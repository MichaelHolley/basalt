<script lang="ts">
  import { enhance } from "$app/forms";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { House, Settings, Plus, Check, X } from "@lucide/svelte";
  import SpaceTree from "$lib/components/navigation/SpaceTree.svelte";
  import type { SpaceNode, Note, Todo } from "$lib/server/db/utils";

  interface Props {
    spaces?: SpaceNode[];
    notesBySpace?: Record<string, Note[]>;
    todosBySpace?: Record<string, Todo[]>;
  }

  let { spaces = [], notesBySpace = {}, todosBySpace = {} }: Props = $props();

  let addingSpace = $state(false);
  let newSpaceName = $state("");
  let newSpaceInput = $state<HTMLInputElement | null>(null);

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
          <SpaceTree {spaces} {notesBySpace} {todosBySpace} />
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
