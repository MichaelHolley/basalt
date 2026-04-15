<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Check, X } from '@lucide/svelte';
	import type { Todo } from '$lib/server/db/types';

	interface Props {
		currentId: string;
		availableTodos: Todo[];
		onclose: () => void;
	}

	let { currentId, availableTodos, onclose }: Props = $props();

	let targetId = $state('');
</script>

<form
	method="POST"
	action="?/createRelation"
	use:enhance={() =>
		({ update }) => {
			targetId = '';
			onclose();
			update({ invalidateAll: true });
		}}
	class="flex items-center gap-1"
>
	<input type="hidden" name="currentType" value="note" />
	<input type="hidden" name="currentId" value={currentId} />
	<input type="hidden" name="targetType" value="todo" />
	<select
		name="targetId"
		bind:value={targetId}
		class="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
		required
	>
		<option value="">Select todo…</option>
		{#each availableTodos as t (t.id)}
			<option value={t.id}>{t.title}</option>
		{/each}
	</select>
	<Button type="submit" variant="ghost" size="icon" class="size-5 shrink-0 text-primary">
		<Check class="size-3" />
	</Button>
	<Button type="button" variant="ghost" size="icon" class="size-5 shrink-0" onclick={onclose}>
		<X class="size-3" />
	</Button>
</form>
