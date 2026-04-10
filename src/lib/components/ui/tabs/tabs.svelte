<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		children,
		...restProps
	}: TabsPrimitive.RootProps & { ref?: HTMLElement | null; children?: Snippet } = $props();
</script>

<TabsPrimitive.Root bind:ref data-slot="tabs" {...restProps}>
	{@render children?.()}
</TabsPrimitive.Root>
