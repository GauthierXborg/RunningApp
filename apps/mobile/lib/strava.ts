import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

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

export function parseTokenFromUrl(url: string): StravaToken | null {
  try {
    const parsed = Linking.parse(url);
    const tokenParam = parsed.queryParams?.token;
    if (!tokenParam || typeof tokenParam !== 'string') return null;
    const decoded = JSON.parse(atob(tokenParam));
    return {
      accessToken: decoded.access_token,
      refreshToken: decoded.refresh_token,
      expiresAt: decoded.expires_at,
      athleteId: decoded.athlete_id,
    };
  } catch {
    return null;
  }
}

export async function connectStrava(): Promise<StravaToken | null> {
  const state = generateState();
  const authUrl = getStravaAuthUrl(state);

  // Set up a listener for the deep link redirect
  return new Promise<StravaToken | null>(async (resolve) => {
    let resolved = false;

    const subscription = Linking.addEventListener('url', (event) => {
      if (resolved) return;
      const token = parseTokenFromUrl(event.url);
      if (token) {
        resolved = true;
        subscription.remove();
        WebBrowser.dismissBrowser();
        resolve(token);
      }
    });

    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      'running-app://strava-callback'
    );

    // If the browser was dismissed without completing, resolve null
    if (!resolved) {
      resolved = true;
      subscription.remove();

      // Check if the result contains the redirect URL (some platforms return it)
      if (result.type === 'success' && result.url) {
        const token = parseTokenFromUrl(result.url);
        resolve(token);
      } else {
        resolve(null);
      }
    }
  });
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
