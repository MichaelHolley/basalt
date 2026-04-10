<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.ContentProps> & {
		ref?: HTMLElement | null;
		children?: Snippet;
	} = $props();
</script>

<TabsPrimitive.Content
	bind:ref
	data-slot="tabs-content"
	class={cn('mt-2 focus-visible:outline-none', className)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Content>
