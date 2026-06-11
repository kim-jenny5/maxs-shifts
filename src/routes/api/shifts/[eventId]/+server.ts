import { getAccessToken, findCalendarId } from '$lib/server/gcal';
import { isAuthed } from '$lib/server/auth';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	if (!(await isAuthed(cookies.get('auth')))) throw error(401, 'Unauthorized');

	const token = await getAccessToken();
	const calendarId = await findCalendarId(token);
	if (!calendarId) throw error(404, 'Calendar not found');

	const res = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`,
		{ method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
	);

	if (!res.ok && res.status !== 410) {
		const err = await res.json();
		throw error(res.status, err.error?.message || 'Failed to delete event');
	}

	return json({ ok: true });
};
