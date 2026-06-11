<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ShiftRow from '$lib/components/ShiftRow.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Plus from '@lucide/svelte/icons/plus';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Check from '@lucide/svelte/icons/check';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Lock from '@lucide/svelte/icons/lock';
	import X from '@lucide/svelte/icons/x';
	import { type Shift } from '$lib/shifts';
	import { cn } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import { linear } from 'svelte/easing';

	function formatEventDate(dateStr: string): string {
		const [y, m, d] = dateStr.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	let { data } = $props();

	let uid = 0;
	function makeShift(): Shift {
		return { id: ++uid, raw: '', parsed: null, type: 'day' };
	}

	let shifts = $state<Shift[]>([makeShift()]);

	type Status =
		| { loading: true }
		| { ok: boolean; warn?: boolean; msg: string }
		| null;
	let status = $state<Status>(null);

	let authed = $derived(data.authed);
	let showPinInput = $state(false);
	let pin = $state('');
	let pinError = $state('');
	let pinLoading = $state(false);

	const filled = $derived(shifts.filter((s) => s.parsed !== null));
	const invalid = $derived(shifts.filter((s) => s.raw && !s.parsed).length);
	const isLoading = $derived(status !== null && 'loading' in status);

	let visibleCount = $state(6);
	const visibleEvents = $derived(data.events.slice(0, visibleCount));
	const hasMore = $derived(visibleCount < data.events.length);

	function add() {
		shifts = [...shifts, makeShift()];
	}

	function remove(id: number) {
		if (shifts.length > 1) shifts = shifts.filter((s) => s.id !== id);
	}

	function update(id: number, delta: Partial<Omit<Shift, 'id'>>) {
		shifts = shifts.map((s) => (s.id === id ? { ...s, ...delta } : s));
	}

	async function submitPin() {
		pinError = '';
		pinLoading = true;
		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pin })
			});
			if (!res.ok) {
				pinError = 'Wrong PIN, try again.';
				return;
			}
			pin = '';
			showPinInput = false;
			location.reload();
		} finally {
			pinLoading = false;
		}
	}

	async function submit() {
		if (!filled.length) {
			status = { ok: false, msg: 'Enter at least one shift date (e.g. 6/22).' };
			return;
		}
		status = { loading: true };

		const events = filled.map((s) => ({
			date: s.parsed!.toISOString().split('T')[0],
			type: s.type
		}));

		try {
			const res = await fetch('/api/shifts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ events })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Something went wrong.');
			status = {
				ok: !data.warn,
				warn: data.warn ?? false,
				msg:
					data.msg ||
					`${filled.length} shift${filled.length !== 1 ? 's' : ''} added to Max's Shifts ✓`
			};
			shifts = [makeShift()];
			await invalidateAll();
		} catch (e: unknown) {
			status = {
				ok: false,
				msg:
					e instanceof Error
						? e.message
						: 'Something went wrong. Please try again.'
			};
		}
	}

	let deletingId = $state<string | null>(null);

	async function deleteShift(eventId: string) {
		deletingId = eventId;
		await fetch(`/api/shifts/${encodeURIComponent(eventId)}`, {
			method: 'DELETE'
		});
		visibleCount = 6;
		await invalidateAll();
		deletingId = null;
	}
</script>

<div class="bg-gray-50">
	<div class="min-h-screen mx-auto max-w-4xl px-5 py-10">
		<div class="flex flex-col items-center mx-auto max-w-md">
			<div class="mb-6">
				<h1 class="text-2xl font-bold tracking-tight text-gray-900">
					Max's Shifts 🧑🏻‍⚕️
				</h1>
			</div>

			<div class="mb-3 flex flex-col gap-2 w-full">
				{#each shifts as shift (shift.id)}
					{@const id = shift.id}
					<div in:slide={{ duration: 250, easing: linear }}>
						<ShiftRow
							{shift}
							onUpdate={(delta) => update(id, delta)}
							onRemove={() => remove(id)}
							canRemove={shifts.length > 1}
						/>
					</div>
				{/each}
			</div>

			<Button
				variant="outline"
				onclick={add}
				class="mb-6 w-full rounded-2xl border-dashed py-6 text-sm text-gray-400 hover:text-gray-600"
			>
				<Plus size={14} /> Add another shift
			</Button>

			{#if status && !isLoading}
				{@const isOk = 'ok' in status && status.ok}
				{@const isWarn = 'warn' in status && status.warn}
				<div
					class={cn(
						'w-full mb-4 rounded-2xl border-[1.5px] px-4 py-4 text-sm leading-relaxed',
						isOk
							? 'bg-green-50 border-green-200 text-green-900'
							: isWarn
								? 'bg-orange-50 border-orange-200 text-orange-800'
								: 'bg-rose-50 border-rose-200 text-rose-800'
					)}
				>
					<div class="flex items-start gap-2">
						{#if isOk}
							<Check size={16} class="mt-0.5 shrink-0 text-green-600" />
						{:else if isWarn}
							<AlertCircle size={16} class="mt-0.5 shrink-0 text-orange-500" />
						{:else}
							<AlertCircle size={16} class="mt-0.5 shrink-0 text-red-600" />
						{/if}
						<div class="whitespace-pre-wrap">
							{'msg' in status ? status.msg : ''}
						</div>
					</div>
				</div>
			{/if}

			{#if authed}
				<Button
					onclick={submit}
					disabled={isLoading}
					class="w-full rounded-2xl py-6 text-sm font-semibold"
				>
					{#if isLoading}
						<Loader2 size={15} class="animate-spin" /> Adding to calendar…
					{:else}
						<CalendarDays size={15} />
						{filled.length
							? `Add ${filled.length} shift${filled.length !== 1 ? 's' : ''} to Google Calendar`
							: 'Add to Google Calendar'}
					{/if}
				</Button>
			{:else if showPinInput}
				<div class="w-full flex flex-col gap-2">
					<div class="flex gap-2">
						<input
							type="password"
							inputmode="numeric"
							pattern="[0-9]*"
							bind:value={pin}
							placeholder="Enter PIN"
							onkeydown={(e) => e.key === 'Enter' && submitPin()}
							class="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-gray-400"
						/>
						<Button
							onclick={submitPin}
							disabled={pinLoading || !pin}
							class="rounded-4xl px-5 py-6 text-sm font-semibold"
						>
							{#if pinLoading}
								<Loader2 size={15} class="animate-spin" />
							{:else}
								Unlock
							{/if}
						</Button>
					</div>
					{#if pinError}
						<p class="text-center text-xs text-red-400">{pinError}</p>
					{/if}
				</div>
			{:else}
				<Button
					variant="outline"
					onclick={() => (showPinInput = true)}
					class="w-full rounded-2xl py-6 text-sm text-gray-400"
				>
					<Lock size={14} /> Add to Google Calendar
				</Button>
			{/if}

			{#if !isLoading && invalid > 0}
				<p class="mt-2 text-center text-xs text-gray-400">
					{invalid} row{invalid !== 1 ? 's' : ''} with invalid dates will be skipped
				</p>
			{/if}
		</div>

		{#if authed}
			<div
				class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-sm mx-auto lg:max-w-2xl"
			>
				<div>
					<p
						class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
					>
						Calendar
					</p>
					<Calendar events={data.events} />
				</div>

				<div>
					<p
						class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
					>
						Upcoming shifts
					</p>
					{#if data.events.length > 0}
						<div class="flex flex-col gap-2">
							{#each visibleEvents as event (event.id)}
								{@const isNight = event.type === 'night'}
								<div
									in:slide={{ duration: 200, easing: linear }}
									class={cn(
										'flex items-center justify-between rounded-2xl border-[1.5px] px-4 py-3 text-gray-700',
										isNight
											? 'border-blue-950 bg-white'
											: 'border-amber-200 bg-white'
									)}
								>
									<div class="flex items-center gap-3">
										<span class="text-sm">{isNight ? '🌙' : '☀️'}</span>
										<span class="text-sm font-medium"
											>{formatEventDate(event.date)}</span
										>
									</div>
									{#if authed}
										<button
											onclick={() => deleteShift(event.id)}
											disabled={deletingId === event.id}
											class={cn(
												'cursor-pointer border-0 bg-transparent p-1 transition-colors',
												isNight
													? 'text-gray-600 hover:text-gray-950'
													: 'text-gray-300 hover:text-gray-400'
											)}
											aria-label="Delete shift"
										>
											{#if deletingId === event.id}
												<Loader2 size={15} class="animate-spin" />
											{:else}
												<X size={15} />
											{/if}
										</button>
									{/if}
								</div>
							{/each}
							{#if hasMore}
								<button
									onclick={() => (visibleCount += 3)}
									class="cursor-pointer border-0 bg-transparent py-2 text-xs font-medium text-gray-400 hover:text-gray-600"
								>
									Load more
								</button>
							{/if}
						</div>
					{:else}
						<p class="text-sm text-gray-400">No upcoming shifts.</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
