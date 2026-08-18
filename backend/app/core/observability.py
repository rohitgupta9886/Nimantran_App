import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from collections import deque
import threading


class MetricsCollector:
    """
    Lightweight, thread-safe, in-memory metrics buffer for production observability.
    Captures API latencies, AI failures, campaign worker throughput, RSVP rates,
    QR scans, and error taxonomy distribution without external infrastructure overhead.
    """

    def __init__(self, max_recent_latencies: int = 500):
        self._lock = threading.Lock()
        self.started_at = datetime.now(timezone.utc)
        self.max_recent_latencies = max_recent_latencies

        # API Metrics
        self.api_total_requests: int = 0
        self.api_status_2xx: int = 0
        self.api_status_4xx: int = 0
        self.api_status_5xx: int = 0
        self.api_latencies: deque = deque(maxlen=max_recent_latencies)

        # AI Metrics
        self.ai_total_requests: int = 0
        self.ai_success_count: int = 0
        self.ai_failure_count: int = 0
        self.ai_latencies: deque = deque(maxlen=max_recent_latencies)

        # Campaign & Worker Metrics
        self.campaign_jobs_enqueued: int = 0
        self.campaign_jobs_processed: int = 0
        self.campaign_jobs_succeeded: int = 0
        self.campaign_jobs_failed: int = 0
        self.campaign_jobs_retried: int = 0

        # Provider Metrics
        self.provider_whatsapp_dispatched: int = 0
        self.provider_whatsapp_failed: int = 0
        self.provider_sms_dispatched: int = 0
        self.provider_sms_failed: int = 0
        self.provider_email_dispatched: int = 0
        self.provider_email_failed: int = 0

        # RSVP Metrics
        self.rsvp_total_submissions: int = 0
        self.rsvp_accepted_count: int = 0
        self.rsvp_declined_count: int = 0
        self.rsvp_failure_count: int = 0

        # QR Metrics
        self.qr_total_scans: int = 0
        self.qr_valid_checkins: int = 0
        self.qr_duplicate_scans: int = 0
        self.qr_invalid_passes: int = 0

        # Error Category Counters
        self.error_counts: Dict[str, int] = {
            "AI_ERROR": 0,
            "DATABASE_ERROR": 0,
            "PROVIDER_ERROR": 0,
            "VALIDATION_ERROR": 0,
            "AUTH_ERROR": 0,
            "RATE_LIMIT_ERROR": 0,
            "INTERNAL_SERVER_ERROR": 0,
        }

    # ==========================================
    # API RECORDING
    # ==========================================
    def record_api_request(self, status_code: int, duration_ms: float):
        with self._lock:
            self.api_total_requests += 1
            self.api_latencies.append(duration_ms)
            if 200 <= status_code < 400:
                self.api_status_2xx += 1
            elif 400 <= status_code < 500:
                self.api_status_4xx += 1
            else:
                self.api_status_5xx += 1

    # ==========================================
    # AI RECORDING
    # ==========================================
    def record_ai_call(self, duration_ms: float, success: bool = True):
        with self._lock:
            self.ai_total_requests += 1
            self.ai_latencies.append(duration_ms)
            if success:
                self.ai_success_count += 1
            else:
                self.ai_failure_count += 1
                self.error_counts["AI_ERROR"] += 1

    # ==========================================
    # CAMPAIGN & WORKER RECORDING
    # ==========================================
    def record_campaign_enqueued(self, count: int = 1):
        with self._lock:
            self.campaign_jobs_enqueued += count

    def record_campaign_processed(self, channel: str, success: bool, retrying: bool = False):
        with self._lock:
            self.campaign_jobs_processed += 1
            ch = channel.lower()
            if success:
                self.campaign_jobs_succeeded += 1
                if "whatsapp" in ch:
                    self.provider_whatsapp_dispatched += 1
                elif "sms" in ch:
                    self.provider_sms_dispatched += 1
                elif "email" in ch:
                    self.provider_email_dispatched += 1
            else:
                if retrying:
                    self.campaign_jobs_retried += 1
                else:
                    self.campaign_jobs_failed += 1
                    self.error_counts["PROVIDER_ERROR"] += 1
                if "whatsapp" in ch:
                    self.provider_whatsapp_failed += 1
                elif "sms" in ch:
                    self.provider_sms_failed += 1
                elif "email" in ch:
                    self.provider_email_failed += 1

    # ==========================================
    # RSVP RECORDING
    # ==========================================
    def record_rsvp(self, attending: bool, success: bool = True):
        with self._lock:
            self.rsvp_total_submissions += 1
            if not success:
                self.rsvp_failure_count += 1
            elif attending:
                self.rsvp_accepted_count += 1
            else:
                self.rsvp_declined_count += 1

    # ==========================================
    # QR SCAN RECORDING
    # ==========================================
    def record_qr_scan(self, result: str):
        with self._lock:
            self.qr_total_scans += 1
            if result == "VALID":
                self.qr_valid_checkins += 1
            elif result == "ALREADY_CHECKED_IN":
                self.qr_duplicate_scans += 1
            else:
                self.qr_invalid_passes += 1

    # ==========================================
    # ERROR TAXONOMY RECORDING
    # ==========================================
    def record_error(self, category: str):
        with self._lock:
            cat = category.upper()
            if cat in self.error_counts:
                self.error_counts[cat] += 1
            else:
                self.error_counts[cat] = self.error_counts.get(cat, 0) + 1

    # ==========================================
    # SUMMARY / SNAPSHOT
    # ==========================================
    def get_metrics_snapshot(self) -> Dict[str, Any]:
        with self._lock:
            uptime_seconds = (datetime.now(timezone.utc) - self.started_at).total_seconds()
            
            # API latency calculations
            lat_list = list(self.api_latencies)
            avg_api_latency = round(sum(lat_list) / len(lat_list), 2) if lat_list else 0.0
            p95_api_latency = (
                round(sorted(lat_list)[int(len(lat_list) * 0.95)], 2) if len(lat_list) >= 10 else avg_api_latency
            )

            # AI latency calculations
            ai_lat_list = list(self.ai_latencies)
            avg_ai_latency = round(sum(ai_lat_list) / len(ai_lat_list), 2) if ai_lat_list else 0.0

            return {
                "uptime_seconds": round(uptime_seconds, 1),
                "started_at": self.started_at.isoformat(),
                "api": {
                    "total_requests": self.api_total_requests,
                    "status_2xx": self.api_status_2xx,
                    "status_4xx": self.api_status_4xx,
                    "status_5xx": self.api_status_5xx,
                    "avg_latency_ms": avg_api_latency,
                    "p95_latency_ms": p95_api_latency,
                },
                "ai": {
                    "total_requests": self.ai_total_requests,
                    "success_count": self.ai_success_count,
                    "failure_count": self.ai_failure_count,
                    "avg_latency_ms": avg_ai_latency,
                },
                "campaigns": {
                    "jobs_enqueued": self.campaign_jobs_enqueued,
                    "jobs_processed": self.campaign_jobs_processed,
                    "jobs_succeeded": self.campaign_jobs_succeeded,
                    "jobs_failed": self.campaign_jobs_failed,
                    "jobs_retried": self.campaign_jobs_retried,
                },
                "providers": {
                    "whatsapp": {"dispatched": self.provider_whatsapp_dispatched, "failed": self.provider_whatsapp_failed},
                    "sms": {"dispatched": self.provider_sms_dispatched, "failed": self.provider_sms_failed},
                    "email": {"dispatched": self.provider_email_dispatched, "failed": self.provider_email_failed},
                },
                "rsvp": {
                    "total_submissions": self.rsvp_total_submissions,
                    "accepted": self.rsvp_accepted_count,
                    "declined": self.rsvp_declined_count,
                    "failures": self.rsvp_failure_count,
                },
                "qr": {
                    "total_scans": self.qr_total_scans,
                    "valid_checkins": self.qr_valid_checkins,
                    "duplicate_scans": self.qr_duplicate_scans,
                    "invalid_passes": self.qr_invalid_passes,
                },
                "errors": dict(self.error_counts),
            }


# Singleton instance
metrics = MetricsCollector()
