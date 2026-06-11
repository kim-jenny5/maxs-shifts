import {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REFRESH_TOKEN,
	TIMEZONE
} from '$env/static/private';

export { TIMEZONE };

export type GCalEvent = {
	id: string;
	date: string;
	type: 'day' | 'night';
	summary: string;
};

export async function getAccessToken(): Promise<string> {
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			refresh_token: GOOGLE_REFRESH_TOKEN,
			grant_type: 'refresh_token'
		})
	});
	const data = await res.json();
	if (!data.access_token) throw new Error('Failed to refresh Google access token');
	return data.access_token;
}

export async function findCalendarId(token: string): Promise<string | null> {
	const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
		headers: { Authorization: `Bearer ${token}` }
	});
	const list = await res.json();
	return list.items?.find((c: { summary: string }) => c.summary === "Max's Shifts")?.id ?? null;
}

export async function getOrCreateCalendarId(token: string): Promise<string> {
	const existing = await findCalendarId(token);
	if (existing) return existing;

	const res = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({ summary: "Max's Shifts" })
	});
	const cal = await res.json();
	return cal.id;
}

export async function fetchUpcomingEvents(): Promise<GCalEvent[]> {
	const token = await getAccessToken();
	const calendarId = await findCalendarId(token);
	if (!calendarId) return [];

	const timeMin = new Date().toISOString();
	const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

	const url = new URL(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
	);
	url.searchParams.set('timeMin', timeMin);
	url.searchParams.set('timeMax', timeMax);
	url.searchParams.set('singleEvents', 'true');
	url.searchParams.set('orderBy', 'startTime');

	const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
	const data = await res.json();

	return (data.items || []).map(
		(item: { id: string; summary: string; start: { dateTime?: string } }) => ({
			id: item.id,
			summary: item.summary,
			date: (item.start.dateTime ?? '').split('T')[0],
			type: item.summary?.includes('Day') ? ('day' as const) : ('night' as const)
		})
	);
}
