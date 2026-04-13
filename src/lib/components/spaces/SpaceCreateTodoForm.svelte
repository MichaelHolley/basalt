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

	let newTodoTitle = $state('');
	let newTodoInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		newTodoInput?.focus();
	});
</script>

<form
	method="POST"
	action="/todos?/create"
	use:enhance={() =>
		({ update }) => {
			newTodoTitle = '';
			oncancel();
			update({ invalidateAll: true });
		}}
	class="mb-2 flex items-center gap-2"
>
	<input type="hidden" name="spaceId" value={spaceId} />
	<Input
		name="title"
		bind:value={newTodoTitle}
		bind:ref={newTodoInput}
		placeholder="Todo title"
		class="flex-1"
	/>
	<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary"
		><Check class="size-4" /></Button
	>
	<Button type="button" variant="ghost" size="icon" class="shrink-0" onclick={oncancel}
		><X class="size-4" /></Button
	>
</form>
