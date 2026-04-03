<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const fields = $derived([
    { label: "Vault location", value: data.vaultPath },
    { label: "Database", value: data.dbPath },
    { label: "Config file", value: data.configPath },
  ]);
</script>

<div class="max-w-xl py-8">
  <h1 class="mb-6 text-lg font-semibold">Settings</h1>

  <div class="flex flex-col gap-4">
    {#each fields as field}
      <div class="flex flex-col gap-1">
        <span class="text-muted-foreground text-xs font-medium"
          >{field.label}</span
        >
        <code class="bg-muted rounded-md px-3 py-2 text-sm break-all"
          >{field.value}</code
        >
      </div>
    {/each}
  </div>
</div>
