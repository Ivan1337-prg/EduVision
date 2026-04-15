import { API_SERVER_URL } from '@env';

export const API_BASE_URL = API_SERVER_URL || 'http://localhost:5000';
const TUNNEL_BYPASS_HEADERS = {
  Accept: 'application/json',
  'bypass-tunnel-reminder': 'true',
};

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('The backend tunnel returned an HTML page instead of JSON. Restart the tunnel or update the demo backend URL.');
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.detail || payload.message || 'Request failed');
  }

  return payload;
}

export async function validateStudentSession({ sessionId, studentCode }) {
  const response = await fetch(
    buildUrl(`/session/${encodeURIComponent(sessionId)}/student/${encodeURIComponent(studentCode)}`),
    {
      headers: TUNNEL_BYPASS_HEADERS,
    },
  );

  return parseResponse(response);
}

export async function submitFaceValidation({ sessionId, studentCode, imageBlob }) {
  const response = await fetch(
    buildUrl(`/session/${encodeURIComponent(sessionId)}/validate/${encodeURIComponent(studentCode)}`),
    {
      method: 'POST',
      headers: {
        ...TUNNEL_BYPASS_HEADERS,
        'Content-Type': imageBlob.type || 'image/jpeg',
      },
      body: imageBlob,
    },
  );

  return parseResponse(response);
}