<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils';
	import { parseShortDate, formatDisplay, type Shift } from '$lib/shifts';

	let {
		shift,
		onUpdate,
		onRemove,
		canRemove
	}: {
		shift: Shift;
		onUpdate: (delta: Partial<Omit<Shift, 'id'>>) => void;
		onRemove: () => void;
		canRemove: boolean;
	} = $props();

	const looksDone = $derived(/^\d{1,2}\/\d+/.test(shift.raw));
	const showInvalid = $derived(looksDone && !shift.parsed);

	const initialParts = shift.raw.split('/');
	let month = $state(initialParts[0] ?? '');
	let day = $state(initialParts[1] ?? '');
	let dayRef = $state<HTMLInputElement | null>(null);

	function sync(m: string, d: string) {
		const raw = m || d ? `${m}/${d}` : '';
		onUpdate({ raw, parsed: parseShortDate(raw) });
	}

	function onMonthInput(e: Event) {
		const val = (e.currentTarget as HTMLInputElement).value
			.replace(/\D/g, '')
			.slice(0, 2);
		month = val;
		sync(val, day);
		if (val.length === 2) dayRef?.focus();
	}

	function onDayInput(e: Event) {
		const val = (e.currentTarget as HTMLInputElement).value
			.replace(/\D/g, '')
			.slice(0, 2);
		day = val;
		sync(month, val);
	}

	function onBlur() {
		const m = month.length === 1 ? month.padStart(2, '0') : month;
		const d = day.length === 1 ? day.padStart(2, '0') : day;
		month = m;
		day = d;
		sync(m, d);
	}

	const inputClass =
		'w-[60px] bg-transparent text-sm font-medium text-gray-900 outline-none ring-0 focus:outline-none focus:ring-0 focus:shadow-none border-0 text-center placeholder:text-gray-300';

	const toggleOptions = [
		{
			t: 'day' as const,
			label: 'Day',
			icon: '☀️',
			activeBg: 'bg-amber-200',
			activeText: 'text-amber-800'
		},
		{
			t: 'night' as const,
			label: 'Night',
			icon: '🌙',
			activeBg: 'bg-blue-950',
			activeText: 'text-neutral-50'
		}
	];
</script>

<div
	class={cn(
		'flex items-center gap-3 rounded-2xl bg-white px-4 py-3 border-[1.5px]',
		showInvalid ? 'border-rose-200' : 'border-gray-200'
	)}
>
	<div class="flex min-w-0 flex-1 items-center gap-2">
		<div class="flex shrink-0 items-center">
			<input
				type="text"
				inputmode="numeric"
				pattern="[0-9]*"
				maxlength="2"
				value={month}
				oninput={onMonthInput}
				onblur={onBlur}
				placeholder="MM"
				class={inputClass}
			/>
			<span class="text-sm text-gray-300">/</span>
			<input
				bind:this={dayRef}
				type="text"
				inputmode="numeric"
				pattern="[0-9]*"
				maxlength="2"
				value={day}
				oninput={onDayInput}
				onblur={onBlur}
				placeholder="DD"
				class={inputClass}
			/>
		</div>

		{#if shift.parsed}
			<span
				class="hidden sm:block min-w-0 flex-1 truncate text-xs text-gray-400"
				>{formatDisplay(shift.parsed)}</span
			>
		{:else if showInvalid}
			<span class="text-xs text-rose-400">invalid</span>
		{/if}
	</div>

	<div class="flex shrink-0 gap-1 rounded-full bg-stone-100 p-1">
		{#each toggleOptions as o}
			<button
				onclick={() => onUpdate({ type: o.t })}
				class={cn(
					'cursor-pointer rounded-full border-0 px-3 py-2 text-xs font-semibold transition-all',
					shift.type === o.t
						? `${o.activeBg} ${o.activeText}`
						: 'bg-transparent text-stone-400'
				)}
			>
				<span class="hidden sm:inline">{o.label} </span>{o.icon}
			</button>
		{/each}
	</div>

	<button
		onclick={onRemove}
		disabled={!canRemove}
		class="shrink-0 border-0 bg-transparent p-1 text-gray-300 transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:cursor-pointer enabled:hover:text-gray-400"
		aria-label="Remove shift"
	>
		<X size={15} />
	</button>
</div>
