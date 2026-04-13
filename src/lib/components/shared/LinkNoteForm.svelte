<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Check, X } from '@lucide/svelte';
	import type { notes } from '$lib/server/db/schema';

	interface Props {
		currentType: 'note' | 'todo';
		currentId: string;
		availableNotes: (typeof notes.$inferSelect)[];
		onclose: () => void;
	}

	let { currentType, currentId, availableNotes, onclose }: Props = $props();

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
	<input type="hidden" name="currentType" value={currentType} />
	<input type="hidden" name="currentId" value={currentId} />
	<input type="hidden" name="targetType" value="note" />
	<select
		name="targetId"
		bind:value={targetId}
		class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
		required
	>
		<option value="">Select note…</option>
		{#each availableNotes as n (n.id)}
			<option value={n.id}>{n.title}</option>
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
