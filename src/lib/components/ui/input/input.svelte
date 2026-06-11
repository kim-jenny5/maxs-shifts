<script lang="ts">
	import type {
		HTMLInputAttributes,
		HTMLInputTypeAttribute
	} from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			(
				| { type: 'file'; files?: FileList }
				| { type?: InputType; files?: undefined }
			)
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'border-none dark:bg-input/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 h-9 rounded-md bg-transparent p-0 text-base transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-0 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'border-none dark:bg-input/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid: dark:aria-invalid:/50 h-9 rounded-md -transparent p-0 text-base transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-0 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file: file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
