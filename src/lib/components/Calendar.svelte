<script lang="ts">
	import gsap from 'gsap';
	import { cn } from '$lib/utils';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { GCalEvent } from '$lib/shifts';

	let { events }: { events: GCalEvent[] } = $props();

	const today = new Date();
	let year = $state(today.getFullYear());
	let month = $state(today.getMonth());

	const title = $derived(
		new Date(year, month).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric'
		})
	);

	const firstDayOfWeek = $derived(new Date(year, month, 1).getDay());
	const daysInMonth = $derived(new Date(year, month + 1, 0).getDate());

	const eventMap = $derived.by(() => {
		const map = new Map<string, Set<'day' | 'night'>>();
		for (const e of events) {
			if (!map.has(e.date)) map.set(e.date, new Set());
			map.get(e.date)!.add(e.type);
		}
		return map;
	});

	const cells = $derived.by(() => {
		const result: (number | null)[] = [];
		for (let i = 0; i < firstDayOfWeek; i++) result.push(null);
		for (let d = 1; d <= daysInMonth; d++) result.push(d);
		while (result.length % 7 !== 0) result.push(null);
		return result;
	});

	function dateKey(d: number): string {
		return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
	}

	function isToday(d: number): boolean {
		return (
			d === today.getDate() &&
			month === today.getMonth() &&
			year === today.getFullYear()
		);
	}

	let gridRef = $state<HTMLDivElement | null>(null);

	function navigate(direction: 1 | -1) {
		if (!gridRef) return;
		const exitX = direction === 1 ? '-100%' : '100%';
		const enterX = direction === 1 ? '100%' : '-100%';

		gsap
			.timeline()
			.to(gridRef, { x: exitX, duration: 0.25, ease: 'linear' })
			.add(() => {
				if (direction === 1) {
					if (month === 11) {
						year++;
						month = 0;
					} else month++;
				} else {
					if (month === 0) {
						year--;
						month = 11;
					} else month--;
				}
			})
			.fromTo(
				gridRef,
				{ x: enterX },
				{ x: '0%', duration: 0.25, ease: 'linear' }
			);
	}
</script>

<div class="rounded-2xl border-[1.5px] border-gray-200 bg-white p-4">
	<div class="mb-4 flex items-center justify-between">
		<button
			onclick={() => navigate(-1)}
			class="cursor-pointer rounded-full border-0 bg-transparent p-1 text-gray-400 hover:text-gray-600"
		>
			<ChevronLeft size={16} />
		</button>
		<span class="text-sm font-semibold text-gray-700">{title}</span>
		<button
			onclick={() => navigate(1)}
			class="cursor-pointer rounded-full border-0 bg-transparent p-1 text-gray-400 hover:text-gray-600"
		>
			<ChevronRight size={16} />
		</button>
	</div>

	<div class="mb-1 grid grid-cols-7">
		{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as label}
			<div class="pb-2 text-center text-xs text-gray-400">{label}</div>
		{/each}
	</div>

	<div class="overflow-hidden">
		<div bind:this={gridRef} class="grid grid-cols-7">
			{#each cells as cell}
				<div class="flex flex-col items-center py-1">
					{#if cell !== null}
						<span
							class={cn(
								'flex h-7 w-7 items-center justify-center rounded-full text-xs',
								isToday(cell)
									? 'bg-gray-900 font-semibold text-white'
									: 'text-gray-700'
							)}
						>
							{cell}
						</span>
						{@const types = eventMap.get(dateKey(cell))}
						{#if types}
							<div class="mt-0.5 flex gap-0.5">
								{#if types.has('day')}
									<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
								{/if}
								{#if types.has('night')}
									<span class="h-1.5 w-1.5 rounded-full bg-blue-900"></span>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
