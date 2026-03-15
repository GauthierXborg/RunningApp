import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.status(400).send('Missing code or state parameter.');
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).send('Server configuration error.');
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      return res.status(502).send('Failed to exchange code with Strava.');
    }

    const data = await response.json();

    const token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete_id: data.athlete?.id,
    };

    // Redirect back to the app with the token as a base64-encoded parameter
    const tokenBase64 = Buffer.from(JSON.stringify(token)).toString('base64');
    const deepLink = `running-app://strava-callback?token=${encodeURIComponent(tokenBase64)}&state=${state}`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connected</title>
          <meta http-equiv="refresh" content="0;url=${deepLink}" />
        </head>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1A1A2E; color: #fff;">
          <div style="text-align: center;">
            <h1 style="color: #00D4AA;">Connected!</h1>
            <p>Redirecting back to the app...</p>
            <p style="color: #6B6B8D; font-size: 14px; margin-top: 20px;">
              If you're not redirected automatically, <a href="${deepLink}" style="color: #00D4AA;">tap here</a>.
            </p>
          </div>
          <script>window.location.href = "${deepLink}";</script>
        </body>
      </html>
    `);
  } catch {
    res.status(500).send('Internal server error.');
  }
}
