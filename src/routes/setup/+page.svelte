<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="flex h-full flex-col items-center justify-center gap-8">
	<div class="flex flex-col gap-1 text-center">
		<h1 class="text-2xl font-semibold">Welcome to Basalt</h1>
		<p class="text-muted-foreground text-sm">Choose where your notes will be stored.</p>
	</div>

	<form method="POST" class="flex w-full max-w-sm flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="vaultPath" class="text-sm font-medium">Vault location</label>
			<input
				id="vaultPath"
				name="vaultPath"
				type="text"
				value={data.defaultVaultPath}
				class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
			/>
			{#if form?.error}
				<p class="text-destructive text-xs">{form.error}</p>
			{/if}
		</div>

		<button
			type="submit"
			class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
		>
			Get started
		</button>
	</form>
</div>
