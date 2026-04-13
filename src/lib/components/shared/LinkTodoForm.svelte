<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Check, X } from '@lucide/svelte';
	import type { todos } from '$lib/server/db/schema';

	interface Props {
		currentId: string;
		availableTodos: (typeof todos.$inferSelect)[];
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
	class="flex flex-col gap-1.5"
>
	<input type="hidden" name="currentType" value="note" />
	<input type="hidden" name="currentId" value={currentId} />
	<input type="hidden" name="targetType" value="todo" />
	<select
		name="targetId"
		bind:value={targetId}
		class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
		required
	>
		<option value="">Select todo…</option>
		{#each availableTodos as t (t.id)}
			<option value={t.id}>{t.title}</option>
		{/each}
	</select>
	<div class="flex gap-1">
		<Button type="submit" variant="ghost" size="icon" class="text-primary">
			<Check class="size-4" />
		</Button>
		<Button type="button" variant="ghost" size="icon" onclick={onclose}>
			<X class="size-4" />
		</Button>
	</div>
</form>
