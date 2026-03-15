import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const TMP_DIR = '/tmp';

function getPath(state: string): string {
  // Sanitize state to prevent path traversal
  const safe = state.replace(/[^a-zA-Z0-9]/g, '');
  return join(TMP_DIR, `strava_token_${safe}.json`);
}

export function storeToken(state: string, token: Record<string, unknown>): void {
  writeFileSync(getPath(state), JSON.stringify(token), 'utf-8');
}

export function retrieveToken(state: string): Record<string, unknown> | null {
  const path = getPath(state);
  if (!existsSync(path)) return null;
  const data = JSON.parse(readFileSync(path, 'utf-8'));
  unlinkSync(path);
  return data;
}
