import { API_SERVER_URL } from '@env';
import { NativeModules, Platform } from 'react-native';

const TUNNEL_BYPASS_HEADERS = {
  Accept: 'application/json',
  'bypass-tunnel-reminder': 'true',
};

function normalizeBaseUrl(url) {
  return url ? url.replace(/\/$/, '') : null;
}

function getDevServerHost() {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL;

  if (!scriptUrl || typeof scriptUrl !== 'string') {
    return null;
  }

  const match = scriptUrl.match(/^[a-z]+:\/\/([^/:]+)(?::\d+)?/i);
  return match?.[1] || null;
}

function isReachableLanHost(host) {
  if (!host) {
    return false;
  }

  if (/^(localhost|127\.0\.0\.1)$/i.test(host)) {
    return false;
  }

  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) {
    return true;
  }

  return /\.local$/i.test(host);
}

function buildCandidateBaseUrls() {
  const candidateBaseUrls = [];
  const devServerHost = getDevServerHost();

  if (isReachableLanHost(devServerHost)) {
    candidateBaseUrls.push(`http://${devServerHost}:5000`);
  }

  if (API_SERVER_URL) {
    candidateBaseUrls.push(API_SERVER_URL);
  }

  if (Platform.OS === 'android') {
    candidateBaseUrls.push('http://10.0.2.2:5000');
  }

  candidateBaseUrls.push('http://localhost:5000');

  return [...new Set(candidateBaseUrls.map(normalizeBaseUrl).filter(Boolean))];
}

function buildUrl(baseUrl, path) {
  return `${baseUrl}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const error = new Error('The backend returned an HTML page instead of JSON. Check the backend URL or restart Expo so it reconnects to your laptop.');
    error.isRetryableConnectionError = true;
    throw error;
  }

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.detail || payload.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function requestWithFallback(path, options = {}) {
  const candidateBaseUrls = buildCandidateBaseUrls();
  let lastError = null;

  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetch(buildUrl(baseUrl, path), options);
      return await parseResponse(response);
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      const isRetryableConnectionError = Boolean(error?.isRetryableConnectionError);

      if (!isNetworkError && !isRetryableConnectionError) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError || new Error('Could not reach the backend. Make sure the backend is running on your laptop and restart Expo.');
}

export async function validateStudentSession({ sessionId, studentCode }) {
  return requestWithFallback(
    `/session/${encodeURIComponent(sessionId)}/student/${encodeURIComponent(studentCode)}`,
    {
      headers: TUNNEL_BYPASS_HEADERS,
    },
  );
}

export async function submitFaceValidation({ sessionId, studentCode, imageBlob }) {
  return requestWithFallback(
    `/session/${encodeURIComponent(sessionId)}/validate/${encodeURIComponent(studentCode)}`,
    {
      method: 'POST',
      headers: {
        ...TUNNEL_BYPASS_HEADERS,
        'Content-Type': imageBlob.type || 'image/jpeg',
      },
      body: imageBlob,
    },
  );
}