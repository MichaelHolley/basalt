<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { appStore } from '@/stores/app.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	interface Props {
		activeSpaceName: string | null;
		onback: () => void;
		ondone: () => void;
	}

	let { activeSpaceName, onback, ondone }: Props = $props();

	let nameValue = $state('');
	let nameInputEl = $state<HTMLInputElement | null>(null);
	let createFormEl = $state<HTMLFormElement | null>(null);

	$effect(() => {
		nameInputEl?.focus();
	});

	function submitCreate() {
		if (!nameValue.trim()) return;
		createFormEl?.requestSubmit();
	}
</script>

<form
	bind:this={createFormEl}
	method="POST"
	action="/spaces?/create"
	use:enhance={() =>
		async ({ result, update }) => {
			if (result.type === 'success' && result.data?.id) {
				ondone();
				nameValue = '';
				await goto(`/spaces/${result.data.id}`);
				await update({ invalidateAll: true });
			} else {
				await update();
			}
		}}
>
	{#if appStore.activeSpaceId}
		<input type="hidden" name="parentId" value={appStore.activeSpaceId} />
	{/if}
	<input type="hidden" name="name" value={nameValue} />
</form>

<div class="flex items-center gap-2 border-b p-1 pb-1">
	<button
		type="button"
		class="flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground"
		onclick={onback}
		aria-label="Back to search"
	>
		<ArrowLeft class="size-4" />
	</button>
	<span class="text-xs font-medium text-muted-foreground">New Space</span>
	<span class="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
		{activeSpaceName ?? 'root'}
	</span>
	<input
		bind:this={nameInputEl}
		bind:value={nameValue}
		class="h-8 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
		placeholder="Enter name…"
		onkeydown={(e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				submitCreate();
			}
		}}
	/>
</div>

<div class="px-3 py-4 text-center text-xs text-muted-foreground">
	Press <kbd class="rounded border px-1 py-0.5 font-mono text-xs">Enter</kbd> to create ·
	<kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
</div>
