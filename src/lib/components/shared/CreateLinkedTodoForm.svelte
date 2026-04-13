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
	class="flex flex-col gap-1.5"
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
		class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
	/>
	<div class="flex gap-1">
		<Button type="submit" variant="ghost" size="icon" class="text-primary">
			<Check class="size-4" />
		</Button>
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onclick={() => {
				title = '';
				onclose();
			}}
		>
			<X class="size-4" />
		</Button>
	</div>
</form>
