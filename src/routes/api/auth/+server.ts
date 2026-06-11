import { ACCESS_PIN } from '$env/static/private';
import { makeAuthCookie } from '$lib/server/auth';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { pin } = await request.json();
	if (pin !== ACCESS_PIN) throw error(401, 'Wrong PIN');

	cookies.set('auth', await makeAuthCookie(), {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		httpOnly: true,
		sameSite: 'strict'
	});

	return json({ ok: true });
};
