<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="flex h-full flex-col items-center justify-center gap-8">
	<div class="flex flex-col gap-1 text-center">
		<h1 class="text-2xl font-semibold">Welcome to Basalt</h1>
		<p class="text-sm text-muted-foreground">Choose where your notes will be stored.</p>
	</div>

	<form method="POST" class="flex w-full max-w-sm flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="vaultPath" class="text-sm font-medium">Vault location</label>
			<Input id="vaultPath" name="vaultPath" type="text" value={data.defaultVaultPath} />
			{#if form?.error}
				<p class="text-xs text-destructive">{form.error}</p>
			{/if}
		</div>

		<Button type="submit">Get started</Button>
	</form>
</div>
