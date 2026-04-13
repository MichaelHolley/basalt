<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Check, X } from '@lucide/svelte';

	interface Props {
		spaceId: string;
		oncancel: () => void;
	}

	let { spaceId, oncancel }: Props = $props();

	let newNoteTitle = $state('');
	let newNoteInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		newNoteInput?.focus();
	});
</script>

<form
	method="POST"
	action="/notes?/create"
	use:enhance={() =>
		({ update }) => {
			newNoteTitle = '';
			oncancel();
			update({ invalidateAll: true });
		}}
	class="mb-2 flex items-center gap-2"
>
	<input type="hidden" name="spaceId" value={spaceId} />
	<Input
		name="title"
		bind:value={newNoteTitle}
		bind:ref={newNoteInput}
		placeholder="Note title"
		class="flex-1"
	/>
	<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary"
		><Check class="size-4" /></Button
	>
	<Button type="button" variant="ghost" size="icon" class="shrink-0" onclick={oncancel}
		><X class="size-4" /></Button
	>
</form>
