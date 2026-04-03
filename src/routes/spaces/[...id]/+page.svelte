<script lang="ts">
  import type { PageData } from "./$types";
  import SpaceView from "$lib/components/spaces/SpaceView.svelte";
  import NoteView from "$lib/components/notes/NoteView.svelte";
  import TodoView from "$lib/components/todos/TodoView.svelte";
  import RelationsPanel from "$lib/components/shared/RelationsPanel.svelte";

  let { data }: { data: PageData } = $props();
</script>

{#if data.type === "space"}
  <SpaceView space={data.space} todos={data.todos} notes={data.notes} />
{:else if data.type === "note"}
  <div class="flex h-full">
    <NoteView note={data.note} content={data.content} />
    <div class="border-l w-56 shrink-0 overflow-y-auto px-3 py-3">
      <RelationsPanel
        currentType="note"
        currentId={data.note.id}
        relatedItems={data.relatedItems}
        allNotes={data.allNotes}
        allTodos={data.allTodos}
      />
    </div>
  </div>
{:else if data.type === "todo"}
  <div class="flex h-full">
    <TodoView todo={data.todo} children={data.children} />
    <div class="border-l w-56 shrink-0 overflow-y-auto px-3 py-3">
      <RelationsPanel
        currentType="todo"
        currentId={data.todo.id}
        relatedItems={data.relatedItems}
        allNotes={data.allNotes}
        allTodos={data.allTodos}
      />
    </div>
  </div>
{/if}
