<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { FileText, CheckSquare, Plus, Check, X } from '@lucide/svelte';
	import type { notes, todos } from '$lib/server/db/schema';

	interface RelatedItem {
		relationId: string;
		type: 'note' | 'todo';
		id: string;
		title: string;
		href: string;
	}

	interface Props {
		currentType: 'note' | 'todo';
		currentId: string;
		relatedItems: RelatedItem[];
		allNotes: (typeof notes.$inferSelect)[];
		allTodos: (typeof todos.$inferSelect)[];
	}

	let { currentType, currentId, relatedItems, allNotes, allTodos }: Props = $props();

	let addingRelation = $state(false);
	let relationTargetType = $state<'note' | 'todo'>('note');
	let relationTargetId = $state('');

	let filteredNotes = $derived(
		currentType === 'note' ? allNotes.filter((n) => n.id !== currentId) : allNotes
	);
	let filteredTodos = $derived(
		currentType === 'todo' ? allTodos.filter((t) => t.id !== currentId) : allTodos
	);
</script>

<div class="flex flex-col gap-1">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Relations</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-5"
			onclick={() => {
				addingRelation = !addingRelation;
				relationTargetId = '';
			}}
			title="Add relation"
		>
			<Plus class="size-3" />
		</Button>
	</div>

	{#if addingRelation}
		<form
			method="POST"
			action="?/createRelation"
			use:enhance={() =>
				({ update }) => {
					addingRelation = false;
					relationTargetId = '';
					update({ invalidateAll: true });
				}}
			class="mb-2 flex flex-col gap-1.5"
		>
			<input type="hidden" name="currentType" value={currentType} />
			<input type="hidden" name="currentId" value={currentId} />
			<select
				name="targetType"
				bind:value={relationTargetType}
				class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			>
				<option value="note">Note</option>
				<option value="todo">Todo</option>
			</select>
			<select
				name="targetId"
				bind:value={relationTargetId}
				class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
				required
			>
				<option value="">Select…</option>
				{#if relationTargetType === 'note'}
					{#each filteredNotes as n (n.id)}
						<option value={n.id}>{n.title}</option>
					{/each}
				{:else}
					{#each filteredTodos as t (t.id)}
						<option value={t.id}>{t.title}</option>
					{/each}
				{/if}
			</select>
			<div class="flex gap-1">
				<Button type="submit" variant="ghost" size="icon" class="text-primary"
					><Check class="size-4" /></Button
				>
				<Button type="button" variant="ghost" size="icon" onclick={() => (addingRelation = false)}
					><X class="size-4" /></Button
				>
			</div>
		</form>
	{/if}

	{#if relatedItems.length === 0 && !addingRelation}
		<p class="text-xs text-muted-foreground italic">No relations.</p>
	{:else}
		<ul class="flex flex-col gap-0.5">
			{#each relatedItems as item (item.relationId)}
				<li class="flex items-center gap-1.5">
					{#if item.type === 'note'}
						<FileText class="size-3.5 shrink-0 text-muted-foreground" />
					{:else}
						<CheckSquare class="size-3.5 shrink-0 text-muted-foreground" />
					{/if}
					<a
						href={item.href}
						class="min-w-0 flex-1 truncate text-xs text-muted-foreground hover:text-foreground"
						>{item.title}</a
					>
					<form
						method="POST"
						action="?/deleteRelation"
						use:enhance={() =>
							({ update }) =>
								update({ invalidateAll: true })}
					>
						<input type="hidden" name="id" value={item.relationId} />
						<Button
							type="submit"
							variant="ghost"
							size="icon"
							class="size-5 shrink-0 hover:text-destructive"
							title="Remove relation"
						>
							<X class="size-3" />
						</Button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>
