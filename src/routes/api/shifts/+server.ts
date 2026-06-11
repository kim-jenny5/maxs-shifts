import {
	TIMEZONE,
	getAccessToken,
	getOrCreateCalendarId,
	fetchUpcomingEvents
} from '$lib/server/gcal';
import { isAuthed } from '$lib/server/auth';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function nextDay(dateStr: string): string {
	const d = new Date(dateStr + 'T12:00:00');
	d.setDate(d.getDate() + 1);
	return d.toISOString().split('T')[0];
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!(await isAuthed(cookies.get('auth')))) throw error(401, 'Unauthorized');

	const { events } = await request.json();

	const [token, existing] = await Promise.all([
		getAccessToken(),
		fetchUpcomingEvents()
	]);
	const calendarId = await getOrCreateCalendarId(token);

	const existingKeys = new Set(existing.map((e) => `${e.date}:${e.type}`));
	const toAdd = events.filter(
		(e: { date: string; type: string }) =>
			!existingKeys.has(`${e.date}:${e.type}`)
	);
	const skipped = events.length - toAdd.length;

	for (const event of toAdd) {
		const isDay = event.type === 'day';
		const start = `${event.date}T${isDay ? '07:00:00' : '19:00:00'}`;
		const end = `${isDay ? event.date : nextDay(event.date)}T${isDay ? '19:00:00' : '07:00:00'}`;

		const res = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					summary: isDay ? 'Max ☀️ Day Shift' : 'Max 🌙 Night Shift',
					start: { dateTime: start, timeZone: TIMEZONE },
					end: { dateTime: end, timeZone: TIMEZONE }
				})
			}
		);

		if (!res.ok) {
			const err = await res.json();
			throw error(500, err.error?.message || 'Failed to create event');
		}
	}

	const added = toAdd.length;
	const msg =
		added === 0
			? `Date(s) already exist on the calendar.`
			: skipped > 0
				? `${added} shift${added !== 1 ? 's' : ''} added, ${skipped} already existed.`
				: `${added} shift${added !== 1 ? 's' : ''} added! 👏🏻👏🏻`;

	return json({ msg });
};
