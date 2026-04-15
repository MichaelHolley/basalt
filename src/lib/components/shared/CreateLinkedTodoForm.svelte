<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Check, X } from '@lucide/svelte';

	interface Props {
		noteId: string;
		spaceId: string;
		onclose: () => void;
	}

	let { noteId, spaceId, onclose }: Props = $props();

	let title = $state('');
</script>

<form
	method="POST"
	action="?/createLinkedTodo"
	use:enhance={() =>
		({ update }) => {
			title = '';
			onclose();
			update({ invalidateAll: true });
		}}
	class="flex items-center gap-1"
>
	<input type="hidden" name="noteId" value={noteId} />
	<input type="hidden" name="spaceId" value={spaceId} />
	<input
		name="title"
		type="text"
		bind:value={title}
		placeholder="Todo title…"
		required
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				title = '';
				onclose();
			}
		}}
		class="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
	/>
	<Button type="submit" variant="ghost" size="icon" class="size-5 shrink-0 text-primary">
		<Check class="size-3" />
	</Button>
	<Button
		type="button"
		variant="ghost"
		size="icon"
		class="size-5 shrink-0"
		onclick={() => {
			title = '';
			onclose();
		}}
	>
		<X class="size-3" />
	</Button>
</form>
