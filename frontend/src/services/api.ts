const API_BASE = '/api/v1';
const BACKEND_DIRECT_BASE = 'http://127.0.0.1:8000/api/v1';

function extractErrorMessage(json: any, rawText: string, status: number): string {
  if (!json) {
    return rawText || `Server returned error (${status})`;
  }

  // 1. FastAPI 422 validation errors: detail is an Array of { loc, msg, type }
  if (Array.isArray(json.detail)) {
    const messages = json.detail.map((errItem: any) => {
      if (typeof errItem === 'string') return errItem;
      if (errItem && typeof errItem === 'object') {
        const field = Array.isArray(errItem.loc) ? errItem.loc.filter((l: any) => l !== 'body').join('.') : '';
        const msg = errItem.msg || errItem.message || JSON.stringify(errItem);
        return field ? `${field}: ${msg}` : msg;
      }
      return String(errItem);
    });
    return messages.filter(Boolean).join(', ') || 'Validation error occurred';
  }

  // 2. detail is a string
  if (typeof json.detail === 'string' && json.detail.trim().length > 0) {
    return json.detail;
  }

  // 3. detail is an object
  if (json.detail && typeof json.detail === 'object') {
    return json.detail.message || json.detail.msg || JSON.stringify(json.detail);
  }

  // 4. error object (e.g., { error: { message: "..." } } or { error: "..." })
  if (json.error) {
    if (typeof json.error === 'string') return json.error;
    if (typeof json.error === 'object') {
      return json.error.message || json.error.detail || JSON.stringify(json.error);
    }
  }

  // 5. message string
  if (typeof json.message === 'string' && json.message.trim().length > 0) {
    return json.message;
  }

  // 6. rawText fallback
  if (rawText && rawText.trim().length > 0) {
    return rawText.length > 200 ? `${rawText.slice(0, 200)}...` : rawText;
  }

  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string; error?: any }> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Strip duplicate /api/v1 prefix if present
  let cleanPath = endpoint;
  if (cleanPath.startsWith('/api/v1/')) {
    cleanPath = cleanPath.slice('/api/v1'.length);
  } else if (cleanPath.startsWith('api/v1/')) {
    cleanPath = '/' + cleanPath.slice('api/v1/'.length);
  } else if (cleanPath === '/api/v1' || cleanPath === 'api/v1') {
    cleanPath = '/';
  } else if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  // Attach Authorization token for non-public routes
  if (token && !cleanPath.startsWith('/public/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${cleanPath}`, {
      ...options,
      headers,
    });
    if (res.status === 404 || res.status === 502 || res.status === 504) {
      res = await fetch(`${BACKEND_DIRECT_BASE}${cleanPath}`, {
        ...options,
        headers,
      });
    }
  } catch (err) {
    res = await fetch(`${BACKEND_DIRECT_BASE}${cleanPath}`, {
      ...options,
      headers,
    });
  }

  const rawText = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(rawText);
  } catch (e) {
    if (!res.ok) {
      throw new Error(`Server Error (${res.status}): ${rawText.slice(0, 150)}`);
    }
  }

  if (!res.ok) {
    const errorMsg = extractErrorMessage(json, rawText, res.status);
    throw new Error(errorMsg);
  }

  return json;
}

