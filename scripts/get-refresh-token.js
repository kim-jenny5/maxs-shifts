import http from 'http';
import { exec } from 'child_process';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';
const SCOPE = 'https://www.googleapis.com/auth/calendar';

const authUrl =
	`https://accounts.google.com/o/oauth2/v2/auth?` +
	`client_id=${GOOGLE_CLIENT_ID}` +
	`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
	`&response_type=code` +
	`&scope=${encodeURIComponent(SCOPE)}` +
	`&access_type=offline` +
	`&prompt=consent`;

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, 'http://localhost:3000');
	const code = url.searchParams.get('code');
	if (!code) return;

	res.end('Got it! You can close this tab.');
	server.close();

	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: REDIRECT_URI,
			grant_type: 'authorization_code'
		})
	});

	const tokens = await tokenRes.json();

	if (tokens.refresh_token) {
		console.log('\n✅ Add this to your .env:\n');
		console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
	} else {
		console.error('\n❌ No refresh token received:', tokens);
	}
});

server.listen(3000, () => {
	console.log('Opening browser...');
	exec(`open "${authUrl}"`);
});
