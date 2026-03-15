import * as WebBrowser from 'expo-web-browser';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '';

export interface StravaToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

export interface StravaActivity {
  id: number;
  name: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  paceSeconds: number;
}

export function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getStravaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    response_type: 'code',
    redirect_uri: `${API_URL}/api/strava/callback`,
    scope: 'activity:read_all',
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function openStravaAuth(state: string): Promise<void> {
  const url = getStravaAuthUrl(state);
  await WebBrowser.openBrowserAsync(url);
}

export async function pollForToken(state: string): Promise<StravaToken | null> {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const response = await fetch(`${API_URL}/api/strava/token/${state}`);
      if (response.ok) {
        const data = await response.json();
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at,
          athleteId: data.athlete_id,
        };
      }
    } catch {
      // continue polling
    }
  }
  return null;
}

export async function refreshToken(token: StravaToken): Promise<StravaToken> {
  const response = await fetch(`${API_URL}/api/strava/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token.refreshToken }),
  });
  if (!response.ok) throw new Error('Failed to refresh token');
  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete_id,
  };
}

export async function fetchActivities(
  token: StravaToken,
  after: number
): Promise<StravaActivity[]> {
  const response = await fetch(
    `${API_URL}/api/strava/activities?after=${after}`,
    {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    }
  );
  if (!response.ok) throw new Error('Failed to fetch activities');
  return response.json();
}
