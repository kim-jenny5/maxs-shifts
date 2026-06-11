import { COOKIE_SECRET } from '$env/static/private';

const TOKEN_VALUE = 'authed';

async function computeToken(): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(COOKIE_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(TOKEN_VALUE));
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function isAuthed(cookieValue: string | undefined): Promise<boolean> {
	if (!cookieValue) return false;
	const expected = await computeToken();
	return cookieValue === expected;
}

export async function makeAuthCookie(): Promise<string> {
	return computeToken();
}
