<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { FileText, SquareCheckBig, Plus, Check, X } from '@lucide/svelte';
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
		spaceId?: string;
	}

	let { currentType, currentId, relatedItems, allNotes, allTodos, spaceId }: Props = $props();

	// Note view state
	let addingNoteRelation = $state(false);
	let noteRelationTargetId = $state('');
	let addingTodo = $state(false);
	let newTodoTitle = $state('');
	let addingTodoRelation = $state(false);
	let todoRelationTargetId = $state('');

	// Todo view state
	let addingNoteFromTodo = $state(false);
	let todoViewNoteTargetId = $state('');

	let relatedNotes = $derived(relatedItems.filter((i) => i.type === 'note'));
	let relatedTodos = $derived(relatedItems.filter((i) => i.type === 'todo'));
	let filteredNotes = $derived(
		currentType === 'note' ? allNotes.filter((n) => n.id !== currentId) : allNotes
	);
	let filteredTodos = $derived(allTodos);

	function openNoteRelation() {
		addingTodo = false;
		newTodoTitle = '';
		addingTodoRelation = false;
		todoRelationTargetId = '';
		addingNoteRelation = !addingNoteRelation;
		noteRelationTargetId = '';
	}

	function openAddTodo() {
		addingNoteRelation = false;
		noteRelationTargetId = '';
		addingTodoRelation = false;
		todoRelationTargetId = '';
		addingTodo = !addingTodo;
		newTodoTitle = '';
	}

	function openTodoRelation() {
		addingNoteRelation = false;
		noteRelationTargetId = '';
		addingTodo = false;
		newTodoTitle = '';
		addingTodoRelation = !addingTodoRelation;
		todoRelationTargetId = '';
	}

	function openNoteFromTodo() {
		addingNoteFromTodo = !addingNoteFromTodo;
		todoViewNoteTargetId = '';
	}
</script>

<div class="flex flex-col gap-1">
	<h2 class="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">Relations</h2>

	{#if currentType === 'note'}
		<Tabs.Root value="notes" class="w-full">
			<Tabs.List class="w-full" variant="line">
				<Tabs.Trigger value="notes" class="flex-1 text-xs">
					Notes{relatedNotes.length > 0 ? ` (${relatedNotes.length})` : ''}
				</Tabs.Trigger>
				<Tabs.Trigger value="todos" class="flex-1 text-xs">
					Todos{relatedTodos.length > 0 ? ` (${relatedTodos.length})` : ''}
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="notes" class="flex flex-col gap-1">
				{#if relatedNotes.length === 0 && !addingNoteRelation}
					<p class="text-xs text-muted-foreground italic">No linked notes.</p>
				{:else}
					<ul class="flex flex-col gap-0.5">
						{#each relatedNotes as item (item.relationId)}
							<li class="flex items-center gap-1.5">
								<FileText class="size-3.5 shrink-0 text-muted-foreground" />
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

				{#if addingNoteRelation}
					<form
						method="POST"
						action="?/createRelation"
						use:enhance={() =>
							({ update }) => {
								addingNoteRelation = false;
								noteRelationTargetId = '';
								update({ invalidateAll: true });
							}}
						class="flex flex-col gap-1.5"
					>
						<input type="hidden" name="currentType" value="note" />
						<input type="hidden" name="currentId" value={currentId} />
						<input type="hidden" name="targetType" value="note" />
						<select
							name="targetId"
							bind:value={noteRelationTargetId}
							class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
							required
						>
							<option value="">Select note…</option>
							{#each filteredNotes as n (n.id)}
								<option value={n.id}>{n.title}</option>
							{/each}
						</select>
						<div class="flex gap-1">
							<Button type="submit" variant="ghost" size="icon" class="text-primary">
								<Check class="size-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onclick={() => (addingNoteRelation = false)}
							>
								<X class="size-4" />
							</Button>
						</div>
					</form>
				{/if}

				<Button
					variant="ghost"
					size="sm"
					class="mt-1 h-6 w-full justify-start gap-1 text-xs text-muted-foreground"
					onclick={openNoteRelation}
				>
					<Plus class="size-3" /> Link note
				</Button>
			</Tabs.Content>

			<Tabs.Content value="todos" class="flex flex-col gap-1">
				{#if relatedTodos.length === 0 && !addingTodo && !addingTodoRelation}
					<p class="text-xs text-muted-foreground italic">No linked todos.</p>
				{:else}
					<ul class="flex flex-col gap-0.5">
						{#each relatedTodos as item (item.relationId)}
							<li class="flex items-center gap-1.5">
								<SquareCheckBig class="size-3.5 shrink-0 text-muted-foreground" />
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

				{#if addingTodo && spaceId}
					<form
						method="POST"
						action="?/createLinkedTodo"
						use:enhance={() =>
							({ update }) => {
								addingTodo = false;
								newTodoTitle = '';
								update({ invalidateAll: true });
							}}
						class="flex flex-col gap-1.5"
					>
						<input type="hidden" name="noteId" value={currentId} />
						<input type="hidden" name="spaceId" value={spaceId} />
						<input
							name="title"
							type="text"
							bind:value={newTodoTitle}
							placeholder="Todo title…"
							required
							onkeydown={(e) => {
								if (e.key === 'Escape') {
									addingTodo = false;
									newTodoTitle = '';
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
									addingTodo = false;
									newTodoTitle = '';
								}}
							>
								<X class="size-4" />
							</Button>
						</div>
					</form>
				{/if}

				{#if addingTodoRelation}
					<form
						method="POST"
						action="?/createRelation"
						use:enhance={() =>
							({ update }) => {
								addingTodoRelation = false;
								todoRelationTargetId = '';
								update({ invalidateAll: true });
							}}
						class="flex flex-col gap-1.5"
					>
						<input type="hidden" name="currentType" value="note" />
						<input type="hidden" name="currentId" value={currentId} />
						<input type="hidden" name="targetType" value="todo" />
						<select
							name="targetId"
							bind:value={todoRelationTargetId}
							class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
							required
						>
							<option value="">Select todo…</option>
							{#each filteredTodos as t (t.id)}
								<option value={t.id}>{t.title}</option>
							{/each}
						</select>
						<div class="flex gap-1">
							<Button type="submit" variant="ghost" size="icon" class="text-primary">
								<Check class="size-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onclick={() => (addingTodoRelation = false)}
							>
								<X class="size-4" />
							</Button>
						</div>
					</form>
				{/if}

				<div class="mt-1 flex gap-1">
					{#if spaceId}
						<Button
							variant="ghost"
							size="sm"
							class="h-6 flex-1 justify-start gap-1 text-xs text-muted-foreground"
							onclick={openAddTodo}
						>
							<SquareCheckBig class="size-3" /> New todo
						</Button>
					{/if}
					<Button
						variant="ghost"
						size="sm"
						class="h-6 flex-1 justify-start gap-1 text-xs text-muted-foreground"
						onclick={openTodoRelation}
					>
						<Plus class="size-3" /> Link todo
					</Button>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	{:else}
		<!-- Todo view: flat list of related notes only -->
		<div class="mb-2 flex items-center justify-between">
			<span class="text-xs text-muted-foreground">Linked notes</span>
			<Button
				variant="ghost"
				size="icon"
				class="size-5"
				onclick={openNoteFromTodo}
				title="Link note"
			>
				<Plus class="size-3" />
			</Button>
		</div>

		{#if addingNoteFromTodo}
			<form
				method="POST"
				action="?/createRelation"
				use:enhance={() =>
					({ update }) => {
						addingNoteFromTodo = false;
						todoViewNoteTargetId = '';
						update({ invalidateAll: true });
					}}
				class="mb-2 flex flex-col gap-1.5"
			>
				<input type="hidden" name="currentType" value="todo" />
				<input type="hidden" name="currentId" value={currentId} />
				<input type="hidden" name="targetType" value="note" />
				<select
					name="targetId"
					bind:value={todoViewNoteTargetId}
					class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
					required
				>
					<option value="">Select note…</option>
					{#each filteredNotes as n (n.id)}
						<option value={n.id}>{n.title}</option>
					{/each}
				</select>
				<div class="flex gap-1">
					<Button type="submit" variant="ghost" size="icon" class="text-primary">
						<Check class="size-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onclick={() => (addingNoteFromTodo = false)}
					>
						<X class="size-4" />
					</Button>
				</div>
			</form>
		{/if}

		{#if relatedNotes.length === 0 && !addingNoteFromTodo}
			<p class="text-xs text-muted-foreground italic">No linked notes.</p>
		{:else}
			<ul class="flex flex-col gap-0.5">
				{#each relatedNotes as item (item.relationId)}
					<li class="flex items-center gap-1.5">
						<FileText class="size-3.5 shrink-0 text-muted-foreground" />
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
	{/if}
</div>
