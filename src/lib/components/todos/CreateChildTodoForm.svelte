<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Check, X } from '@lucide/svelte';

	interface Props {
		parentId: string;
		oncancel: () => void;
	}

	let { parentId, oncancel }: Props = $props();

	let newChildTitle = $state('');
	let childInput = $state<HTMLInputElement | null>(null);
	let childError = $state('');

	$effect(() => {
		childInput?.focus();
	});
</script>

<form
	method="POST"
	action="?/createChild"
	use:enhance={() =>
		async ({ result, update }) => {
			if (result.type === 'failure') {
				childError = (result.data as { error?: string })?.error ?? 'Failed to create subtask';
				return;
			}
			newChildTitle = '';
			childError = '';
			oncancel();
			await update({ invalidateAll: true });
		}}
	class="flex items-center gap-2"
>
	<input type="hidden" name="parentId" value={parentId} />
	<Input
		name="title"
		bind:value={newChildTitle}
		bind:ref={childInput}
		placeholder="Subtask title"
		class="flex-1"
	/>
	<Button type="submit" variant="ghost" size="icon" class="text-primary"
		><Check class="size-4" /></Button
	>
	<Button
		type="button"
		variant="ghost"
		size="icon"
		onclick={() => {
			childError = '';
			oncancel();
		}}><X class="size-4" /></Button
	>
</form>
{#if childError}
	<p class="text-xs text-destructive">{childError}</p>
{/if}
