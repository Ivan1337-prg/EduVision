import { API_SERVER_URL } from '@env';

export const API_BASE_URL = API_SERVER_URL || 'http://localhost:5000';

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.detail || payload.message || 'Request failed');
  }

  return payload;
}

export async function validateStudentSession({ sessionId, studentCode }) {
  const response = await fetch(
    buildUrl(`/session/${encodeURIComponent(sessionId)}/student/${encodeURIComponent(studentCode)}`),
  );

  return parseResponse(response);
}

export async function submitFaceValidation({ sessionId, studentCode, imageBlob }) {
  const response = await fetch(
    buildUrl(`/session/${encodeURIComponent(sessionId)}/validate/${encodeURIComponent(studentCode)}`),
    {
      method: 'POST',
      headers: {
        'Content-Type': imageBlob.type || 'image/jpeg',
      },
      body: imageBlob,
    },
  );

  return parseResponse(response);
}