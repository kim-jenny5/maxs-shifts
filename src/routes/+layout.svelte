<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Max's Shifts</title>
	<meta
		name="description"
		content="A simple way to track Max's shifts and sync them to Google Calendar."
	/>
</svelte:head>
{@render children()}
