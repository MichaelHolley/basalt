<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { FileText, SquareCheckBig, Plus, X } from '@lucide/svelte';
	import type { Note, Todo } from '$lib/server/db/types';
	import LinkNoteForm from './LinkNoteForm.svelte';
	import LinkTodoForm from './LinkTodoForm.svelte';
	import CreateLinkedTodoForm from './CreateLinkedTodoForm.svelte';

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
		allNotes: Note[];
		allTodos: Todo[];
		spaceId?: string;
	}

	let { currentType, currentId, relatedItems, allNotes, allTodos, spaceId }: Props = $props();

	let activeForm = $state<'linkNote' | 'linkTodo' | 'createTodo' | 'linkNoteFromTodo' | null>(null);

	let relatedNotes = $derived(relatedItems.filter((i) => i.type === 'note'));
	let relatedTodos = $derived(relatedItems.filter((i) => i.type === 'todo'));
	let filteredNotes = $derived(
		currentType === 'note' ? allNotes.filter((n) => n.id !== currentId) : allNotes
	);

	function toggleForm(form: typeof activeForm) {
		activeForm = activeForm === form ? null : form;
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
				{#if relatedNotes.length === 0 && activeForm !== 'linkNote'}
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

				{#if activeForm === 'linkNote'}
					<LinkNoteForm
						{currentType}
						{currentId}
						availableNotes={filteredNotes}
						onclose={() => (activeForm = null)}
					/>
				{/if}

				<Button
					variant="ghost"
					size="sm"
					class="mt-1 h-6 w-full justify-start gap-1 text-xs text-muted-foreground"
					onclick={() => toggleForm('linkNote')}
				>
					<Plus class="size-3" /> Link note
				</Button>
			</Tabs.Content>

			<Tabs.Content value="todos" class="flex flex-col gap-1">
				{#if relatedTodos.length === 0 && activeForm !== 'createTodo' && activeForm !== 'linkTodo'}
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

				{#if activeForm === 'createTodo' && spaceId}
					<CreateLinkedTodoForm noteId={currentId} {spaceId} onclose={() => (activeForm = null)} />
				{/if}

				{#if activeForm === 'linkTodo'}
					<LinkTodoForm {currentId} availableTodos={allTodos} onclose={() => (activeForm = null)} />
				{/if}

				<div class="mt-1 flex gap-1">
					{#if spaceId}
						<Button
							variant="ghost"
							size="sm"
							class="h-6 flex-1 justify-start gap-1 text-xs text-muted-foreground"
							onclick={() => toggleForm('createTodo')}
						>
							<SquareCheckBig class="size-3" /> New todo
						</Button>
					{/if}
					<Button
						variant="ghost"
						size="sm"
						class="h-6 flex-1 justify-start gap-1 text-xs text-muted-foreground"
						onclick={() => toggleForm('linkTodo')}
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
				onclick={() => toggleForm('linkNoteFromTodo')}
				title="Link note"
			>
				<Plus class="size-3" />
			</Button>
		</div>

		{#if activeForm === 'linkNoteFromTodo'}
			<div class="mb-2">
				<LinkNoteForm
					{currentType}
					{currentId}
					availableNotes={filteredNotes}
					onclose={() => (activeForm = null)}
				/>
			</div>
		{/if}

		{#if relatedNotes.length === 0 && activeForm !== 'linkNoteFromTodo'}
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
