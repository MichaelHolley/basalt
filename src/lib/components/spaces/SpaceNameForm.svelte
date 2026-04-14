<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { Space } from '$lib/server/db/types';
	import { Check, Pencil, X } from '@lucide/svelte';

	interface Props {
		space: Space;
	}

	let { space }: Props = $props();

	let editingName = $state(false);
	let editedName = $state('');
	let nameInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (editingName) nameInput?.focus();
	});

	function startEditName() {
		editedName = space.name;
		editingName = true;
	}

	function cancelEditName() {
		editingName = false;
		editedName = '';
	}
</script>

{#if editingName}
	<form
		method="POST"
		action="/spaces?/rename"
		use:enhance={() =>
			({ update }) => {
				editingName = false;
				editedName = '';
				update({ invalidateAll: true });
			}}
		class="flex items-center gap-2"
	>
		<input type="hidden" name="id" value={space.id} />
		<Input
			name="name"
			bind:value={editedName}
			bind:ref={nameInput}
			class="text-2xl font-semibold"
			onkeydown={(e) => {
				if (e.key === 'Escape') cancelEditName();
			}}
			onblur={(e) => {
				const rel = e.relatedTarget as HTMLElement | null;
				if (!rel?.closest('form[action="/spaces?/rename"]')) cancelEditName();
			}}
		/>
		<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary">
			<Check class="size-4" />
		</Button>
		<Button type="button" variant="ghost" size="icon" class="shrink-0" onclick={cancelEditName}>
			<X class="size-4" />
		</Button>
	</form>
{:else}
	<div class="group flex items-center gap-2">
		<h1 class="text-2xl font-semibold">
			{space.name}
		</h1>
		<Button
			variant="ghost"
			size="icon"
			class="size-6 opacity-0 group-hover:opacity-100"
			onclick={startEditName}
			title="Rename space"
		>
			<Pencil class="size-3.5" />
		</Button>
	</div>
{/if}
