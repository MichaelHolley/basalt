<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Check, X } from '@lucide/svelte';

	interface Props {
		oncreated: () => void;
		oncancelled: () => void;
	}

	let { oncreated, oncancelled }: Props = $props();

	let newSpaceName = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);

	$effect(() => {
		inputRef?.focus();
	});
</script>

<form
	method="POST"
	action="/spaces?/create"
	use:enhance={() => {
		return ({ update }) => {
			oncreated();
			update({ invalidateAll: true });
		};
	}}
	class="flex items-center gap-1 px-2 py-1"
>
	<Input
		name="name"
		bind:value={newSpaceName}
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
