<script lang="ts">
  import { enhance } from "$app/forms";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { House, Settings, Plus, Check, X, Search, FileText } from "@lucide/svelte";
  import SpaceTree from "$lib/components/navigation/SpaceTree.svelte";
  import type { SpaceNode, Note } from "$lib/server/db/utils";

  interface Props {
    spaces?: SpaceNode[];
    notesBySpace?: Record<string, Note[]>;
  }

  let { spaces = [], notesBySpace = {} }: Props = $props();

  let addingSpace = $state(false);
  let newSpaceName = $state("");
  let newSpaceInput = $state<HTMLInputElement | null>(null);

  // Search
  let searchQuery = $state("");
  let searchResults = $state<{ note_id: string; title: string; snippet: string }[]>([]);
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;

  function handleSearch() {
    if (searchDebounce) clearTimeout(searchDebounce);
    if (!searchQuery.trim()) { searchResults = []; return; }
    searchDebounce = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      searchResults = data.results ?? [];
    }, 200);
  }

  function clearSearch() {
    searchQuery = "";
    searchResults = [];
  }

  function startAdd() {
    addingSpace = true;
    newSpaceName = "";
  }

  function cancelAdd() {
    addingSpace = false;
    newSpaceName = "";
  }

  $effect(() => {
    if (addingSpace) newSpaceInput?.focus();
  });
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="/" {...props}>
              <div
                class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <House class="size-4" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold">Basalt</span>
                <span class="text-muted-foreground text-xs">Notes & Todos</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    <!-- Search — hidden in collapsed icon mode -->
    <div class="px-2 pt-2 group-data-[collapsible=icon]:hidden">
      <div class="relative">
        <Search class="text-muted-foreground absolute left-2 top-1/2 size-3 -translate-y-1/2" />
        <input
          type="search"
          placeholder="Search notes…"
          bind:value={searchQuery}
          oninput={handleSearch}
          class="border-input bg-background text-foreground placeholder:text-muted-foreground h-7 w-full rounded-md border pl-6 pr-2 text-xs focus:outline-none focus-visible:ring-1"
        />
      </div>
      {#if searchResults.length > 0}
        <ul class="bg-popover border-border mt-1 flex flex-col rounded-md border py-1 shadow-md">
          {#each searchResults as result}
            <li>
              <a
                href="/spaces/{result.note_id.replace(/\.md$/, '')}"
                onclick={clearSearch}
                class="hover:bg-accent flex flex-col gap-0.5 px-2 py-1.5"
              >
                <span class="flex items-center gap-1.5 text-xs font-medium">
                  <FileText class="text-muted-foreground size-3 shrink-0" />
                  {result.title}
                </span>
                {#if result.snippet}
                  <span class="text-muted-foreground line-clamp-1 pl-4.5 text-[10px]">
                    {@html result.snippet}
                  </span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      {:else if searchQuery.trim() && searchResults.length === 0}
        <p class="text-muted-foreground mt-1 px-2 py-1.5 text-xs italic">No results.</p>
      {/if}
    </div>

    <Sidebar.Group>
      <Sidebar.GroupLabel class="flex items-center justify-between pr-1">
        Spaces
        <Button
          variant="ghost"
          size="icon"
          class="size-5"
          onclick={startAdd}
          title="New space"
        >
          <Plus class="size-3" />
        </Button>
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#if addingSpace}
            <Sidebar.MenuItem>
              <form
                method="POST"
                action="/spaces?/create"
                use:enhance={() => {
                  return ({ update }) => {
                    cancelAdd();
                    update({ invalidateAll: true });
                  };
                }}
                class="flex items-center gap-1 px-2 py-1"
              >
                <Input
                  name="name"
                  bind:value={newSpaceName}
                  bind:ref={newSpaceInput}
                  placeholder="Space name"
                  class="h-6 flex-1 text-xs"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  class="size-5 text-primary"
                >
                  <Check class="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-5"
                  onclick={cancelAdd}
                >
                  <X class="size-3" />
                </Button>
              </form>
            </Sidebar.MenuItem>
          {/if}
          <SpaceTree {spaces} {notesBySpace} />
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href="/settings" {...props}>
              <Settings />
              <span>Settings</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>

  <Sidebar.Rail />
</Sidebar.Root>
