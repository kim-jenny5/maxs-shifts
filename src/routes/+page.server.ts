import { isAuthed } from '$lib/server/auth';
import { fetchUpcomingEvents } from '$lib/server/gcal';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const [authed, events] = await Promise.all([
		isAuthed(cookies.get('auth')),
		fetchUpcomingEvents().catch(() => [])
	]);
	return { authed, events };
};
