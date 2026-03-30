<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar";
  import {
    FileText,
    CheckSquare,
    ChevronRight,
    Settings,
    House,
  } from "@lucide/svelte";

  const spaces = [
    {
      name: "Work",
      items: [
        { icon: FileText, label: "standup.md", href: "#" },
        { icon: CheckSquare, label: "Todos", href: "#" },
      ],
    },
    {
      name: "Private",
      items: [
        { icon: FileText, label: "journal.md", href: "#" },
        { icon: CheckSquare, label: "Todos", href: "#" },
      ],
    },
  ];
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
    {#each spaces as space}
      <Sidebar.Group>
        <Sidebar.GroupLabel>{space.name}</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each space.items as item}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>
                  {#snippet child({ props })}
                    <a href={item.href} {...props}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    {/each}
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
