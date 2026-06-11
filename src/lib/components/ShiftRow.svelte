<script lang="ts">
	import gsap from 'gsap';
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

	let dayBtnRef = $state<HTMLButtonElement | null>(null);
	let nightBtnRef = $state<HTMLButtonElement | null>(null);
	let dayIconRef = $state<HTMLSpanElement | null>(null);
	let nightIconRef = $state<HTMLSpanElement | null>(null);
	let pillRef = $state<HTMLDivElement | null>(null);

	function twColor(name: string): string {
		return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
	}

	const shiftType = $derived(shift.type);

	let firstRun = true;

	$effect(() => {
		const isDay = shiftType === 'day';
		const targetBtn = isDay ? dayBtnRef : nightBtnRef;
		if (!pillRef || !targetBtn || !dayBtnRef || !nightBtnRef) return;

		const pillProps = {
			left: targetBtn.offsetLeft,
			top: targetBtn.offsetTop,
			width: targetBtn.offsetWidth,
			height: targetBtn.offsetHeight,
			backgroundColor: isDay ? twColor('amber-200') : twColor('blue-950')
		};

		if (firstRun) {
			gsap.set(pillRef, pillProps);
			gsap.set(dayBtnRef, { color: isDay ? twColor('amber-800') : twColor('stone-400') });
			gsap.set(nightBtnRef, { color: !isDay ? twColor('neutral-50') : twColor('stone-400') });
			firstRun = false;
		} else {
			gsap.to(pillRef, { ...pillProps, duration: 0.3, ease: 'power2.inOut' });
			gsap.to(dayBtnRef, { color: isDay ? twColor('amber-800') : twColor('stone-400'), duration: 0.2 });
			gsap.to(nightBtnRef, { color: !isDay ? twColor('neutral-50') : twColor('stone-400'), duration: 0.2 });
		}
	});

	function handleToggle(type: 'day' | 'night') {
		if (shift.type === type) return;
		onUpdate({ type });

		const icon = type === 'day' ? dayIconRef : nightIconRef;
		if (icon) gsap.fromTo(icon, { scale: 0.3, rotation: type === 'day' ? 90 : -90 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' });
	}

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
		'w-[60px] bg-transparent text-base font-medium text-gray-900 outline-none ring-0 focus:outline-none focus:ring-0 focus:shadow-none border-0 text-center placeholder:text-gray-300';

	const btnBase = 'cursor-pointer rounded-full border-0 px-3 py-2 text-xs font-semibold';

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

	<div class="relative flex shrink-0 gap-1 rounded-full bg-stone-100 p-1">
		<div bind:this={pillRef} class="pointer-events-none absolute rounded-full"></div>
		<button bind:this={dayBtnRef} onclick={() => handleToggle('day')} class="relative z-10 {btnBase}">
			<span class="hidden sm:inline">Day </span><span bind:this={dayIconRef}>☀️</span>
		</button>
		<button bind:this={nightBtnRef} onclick={() => handleToggle('night')} class="relative z-10 {btnBase}">
			<span class="hidden sm:inline">Night </span><span bind:this={nightIconRef}>🌙</span>
		</button>
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
