import pytest
import json
import logging
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone

from app.main import app
from app.core.context import (
    set_request_id,
    get_request_id,
    set_event_id,
    get_event_id,
    set_campaign_id,
    get_campaign_id,
    get_current_context,
    clear_context,
)
from app.core.observability import metrics
from app.core.errors import (
    ErrorCategory,
    NimantranException,
    AIServiceException,
    ProviderException,
    DatabaseException,
    RateLimitException,
)
from app.core.logging import PrivacyLogFilter, StructuredJsonFormatter
from app.services.campaign_worker import multi_channel_worker


# =========================================================================
# 1. HEALTH & READINESS PROBES
# =========================================================================

@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify /health returns structured status, database connectivity, and worker health without leaking secrets."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded"]
        assert "database" in data
        assert data["database"]["status"] == "connected"
        assert "worker" in data
        assert "is_running" in data["worker"]
        assert "uptime_seconds" in data
        
        # Verify zero secret leakage
        raw_str = json.dumps(data)
        assert "secret" not in raw_str.lower() or "secret_key" not in raw_str.lower()
        assert "password" not in raw_str.lower()


@pytest.mark.asyncio
async def test_liveness_and_readiness_probes():
    """Verify Kubernetes / container orchestrator probes."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Liveness
        live_res = await client.get("/health/liveness")
        assert live_res.status_code == 200
        assert live_res.json() == {"status": "alive"}

        # Readiness
        ready_res = await client.get("/health/readiness")
        assert ready_res.status_code == 200
        assert ready_res.json()["status"] == "ready"
        assert ready_res.json()["database"] == "connected"


@pytest.mark.asyncio
async def test_operational_metrics_endpoint():
    """Verify /health/metrics returns aggregated telemetry."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health/metrics")
        assert res.status_code == 200
        data = res.json()
        assert "telemetry" in data
        tel = data["telemetry"]
        assert "api" in tel
        assert "ai" in tel
        assert "campaigns" in tel
        assert "providers" in tel
        assert "rsvp" in tel
        assert "qr" in tel
        assert "errors" in tel


# =========================================================================
# 2. CORRELATION ID & REQUEST TRACING
# =========================================================================

@pytest.mark.asyncio
async def test_correlation_id_propagation_custom():
    """Verify custom X-Request-ID is preserved and echoed in response headers."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        custom_id = "req_custom_trace_9999"
        res = await client.get("/", headers={"X-Request-ID": custom_id})
        assert res.status_code == 200
        assert res.headers.get("X-Request-ID") == custom_id
        assert "X-Response-Time" in res.headers


@pytest.mark.asyncio
async def test_correlation_id_generation_when_missing():
    """Verify missing X-Request-ID triggers generation of a unique req_... identifier."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/")
        assert res.status_code == 200
        req_id = res.headers.get("X-Request-ID")
        assert req_id is not None
        assert req_id.startswith("req_")
        assert "X-Response-Time" in res.headers


# =========================================================================
# 3. STRUCTURED LOGGING & PRIVACY MASKING
# =========================================================================

def test_privacy_log_filter_scrubs_secrets():
    """Verify PrivacyLogFilter redacts passwords, tokens, and authorization headers."""
    filter_obj = PrivacyLogFilter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg='User authenticated password="MySecretPassword123" with bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
        args=(),
        exc_info=None,
    )
    filter_obj.filter(record)
    assert "MySecretPassword123" not in record.msg
    assert "***REDACTED***" in record.msg


def test_structured_json_formatter():
    """Verify StructuredJsonFormatter outputs valid JSON containing correlation context."""
    clear_context()
    set_request_id("req_audit_test_123")
    set_event_id("evt_test_456")
    set_campaign_id("cmp_test_789")

    formatter = StructuredJsonFormatter()
    record = logging.LogRecord(
        name="nimantran_ai.test",
        level=logging.INFO,
        pathname="",
        lineno=10,
        msg="Campaign batch dispatch initiated",
        args=(),
        exc_info=None,
    )

    formatted_str = formatter.format(record)
    parsed = json.loads(formatted_str)

    assert parsed["level"] == "INFO"
    assert parsed["message"] == "Campaign batch dispatch initiated"
    assert parsed["request_id"] == "req_audit_test_123"
    assert parsed["event_id"] == "evt_test_456"
    assert parsed["campaign_id"] == "cmp_test_789"
    assert "timestamp" in parsed
    clear_context()


# =========================================================================
# 4. ERROR TAXONOMY & SAFE ERROR RESPONSES
# =========================================================================

def test_custom_nimantran_exceptions_taxonomy():
    """Verify domain exception hierarchy and error code serialization."""
    ai_exc = AIServiceException("Model gemini-2.5-flash timed out after 10s")
    assert ai_exc.category == ErrorCategory.AI_ERROR
    assert ai_exc.status_code == 502
    d = ai_exc.to_dict(request_id="req_test_abc")
    assert d["error_code"] == "AI_ERROR"
    assert d["request_id"] == "req_test_abc"
    assert "timed out" not in d["message"]  # User message is sanitized

    prov_exc = ProviderException("MetaWhatsApp", "Connection refused")
    assert prov_exc.category == ErrorCategory.PROVIDER_ERROR
    assert prov_exc.status_code == 502

    db_exc = DatabaseException("Deadlock detected on table events")
    assert db_exc.category == ErrorCategory.DATABASE_ERROR
    assert db_exc.status_code == 500

    rate_exc = RateLimitException()
    assert rate_exc.category == ErrorCategory.RATE_LIMIT_ERROR
    assert rate_exc.status_code == 429


@pytest.mark.asyncio
async def test_api_404_and_validation_error_responses_include_request_id():
    """Verify 404 and 422 responses return structured JSON with request_id."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 404 Not Found
        res_404 = await client.get("/api/v1/non_existent_path_xyz")
        assert res_404.status_code == 404
        data_404 = res_404.json()
        assert data_404["error"] is True
        assert data_404["error_code"] == "NOT_FOUND_ERROR"
        assert "request_id" in data_404

        # 422 Validation Error
        res_422 = await client.post("/api/v1/auth/login", json={"invalid_field": "val"})
        assert res_422.status_code == 422
        data_422 = res_422.json()
        assert data_422["error"] is True
        assert data_422["error_code"] == "VALIDATION_ERROR"
        assert "validation_errors" in data_422


# =========================================================================
# 5. IN-MEMORY METRICS COLLECTOR BUFFER
# =========================================================================

def test_metrics_collector_recording_and_snapshot():
    """Verify MetricsCollector accurately tracks counts, latencies, and percentiles."""
    metrics.record_api_request(200, 10.5)
    metrics.record_api_request(200, 20.0)
    metrics.record_api_request(500, 50.0)

    metrics.record_ai_call(150.0, success=True)
    metrics.record_ai_call(300.0, success=False)

    metrics.record_campaign_enqueued(5)
    metrics.record_campaign_processed("whatsapp", success=True)
    metrics.record_campaign_processed("sms", success=False, retrying=True)

    metrics.record_rsvp(attending=True, success=True)
    metrics.record_rsvp(attending=False, success=True)

    metrics.record_qr_scan("VALID")
    metrics.record_qr_scan("ALREADY_CHECKED_IN")

    snapshot = metrics.get_metrics_snapshot()

    assert snapshot["api"]["total_requests"] >= 3
    assert snapshot["api"]["status_2xx"] >= 2
    assert snapshot["api"]["status_5xx"] >= 1
    assert snapshot["ai"]["total_requests"] >= 2
    assert snapshot["ai"]["success_count"] >= 1
    assert snapshot["ai"]["failure_count"] >= 1
    assert snapshot["campaigns"]["jobs_enqueued"] >= 5
    assert snapshot["campaigns"]["jobs_processed"] >= 2
    assert snapshot["providers"]["whatsapp"]["dispatched"] >= 1
    assert snapshot["rsvp"]["accepted"] >= 1
    assert snapshot["rsvp"]["declined"] >= 1
    assert snapshot["qr"]["valid_checkins"] >= 1
    assert snapshot["qr"]["duplicate_scans"] >= 1


# =========================================================================
# 6. WORKER READINESS & HEALTH STATUS
# =========================================================================

def test_campaign_worker_health_status():
    """Verify MultiChannelCampaignWorker exposes runtime health and heartbeat."""
    status_dict = multi_channel_worker.get_health_status()
    assert "is_running" in status_dict
    assert "queue_size" in status_dict
    assert "processed_count" in status_dict
    assert "succeeded_count" in status_dict
    assert "failed_count" in status_dict
    assert "status" in status_dict
    assert status_dict["status"] in ["HEALTHY", "STOPPED"]
