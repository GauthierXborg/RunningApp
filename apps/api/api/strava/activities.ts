import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header.' });
  }

  const accessToken = authHeader.slice(7);
  const after = req.query.after as string | undefined;

  try {
    const params = new URLSearchParams({ per_page: '100' });
    if (after) params.set('after', after);

    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Strava API error.' });
    }

    const activities = await response.json();

    const runs = activities
      .filter((a: any) => a.type === 'Run')
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        date: a.start_date,
        distanceKm: Math.round((a.distance / 1000) * 100) / 100,
        durationMinutes: Math.round((a.moving_time / 60) * 100) / 100,
        paceSeconds: a.distance > 0
          ? Math.round(a.moving_time / (a.distance / 1000))
          : 0,
      }));

    res.status(200).json(runs);
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
}
