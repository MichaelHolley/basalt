<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Check, X } from '@lucide/svelte';

	interface Props {
		parentId: string;
		oncreated: () => void;
		oncancelled: () => void;
	}

	let { parentId, oncreated, oncancelled }: Props = $props();

	let newChildName = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);

	$effect(() => {
		inputRef?.focus();
	});
</script>

<Sidebar.MenuSubItem>
	<form
		method="POST"
		action="/spaces?/create"
		use:enhance={() => {
			return ({ update }) => {
				oncreated();
				update({ invalidateAll: true });
			};
		}}
		class="flex items-center gap-1 py-1 pl-2"
	>
		<input type="hidden" name="parentId" value={parentId} />
		<Input
			name="name"
			bind:value={newChildName}
			bind:ref={inputRef}
			placeholder="Space name"
			class="h-6 flex-1 text-xs"
		/>
		<Button type="submit" variant="ghost" size="icon" class="size-5 text-primary">
			<Check class="size-3" />
		</Button>
		<Button type="button" variant="ghost" size="icon" class="size-5" onclick={oncancelled}>
			<X class="size-3" />
		</Button>
	</form>
</Sidebar.MenuSubItem>
