export type ShiftType = 'day' | 'night';

export type Shift = {
	id: number;
	raw: string;
	parsed: Date | null;
	type: ShiftType;
};

export function parseShortDate(input: string): Date | null {
	if (!input) return null;
	const match = input.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
	if (!match) return null;
	const month = parseInt(match[1], 10);
	const day = parseInt(match[2], 10);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	let year: number;
	if (match[3]) {
		year = parseInt(match[3], 10);
		if (year < 100) year += 2000;
	} else {
		const now = new Date();
		const candidate = new Date(now.getFullYear(), month - 1, day);
		const cutoff = new Date(now);
		cutoff.setDate(cutoff.getDate() - 14);
		year = candidate < cutoff ? now.getFullYear() + 1 : now.getFullYear();
	}
	const date = new Date(year, month - 1, day);
	if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

export function formatDisplay(date: Date): string {
	return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
