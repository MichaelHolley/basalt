<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Crepe } from '@milkdown/crepe';
	import '@milkdown/crepe/theme/common/style.css';
	import '@milkdown/crepe/theme/frame.css';

	interface Props {
		value?: string;
		readonly?: boolean;
		onchange?: (markdown: string) => void;
	}

	let { value = '', readonly = false, onchange }: Props = $props();

	let container: HTMLDivElement;
	let crepe: Crepe;

	onMount(async () => {
		crepe = new Crepe({
			root: container,
			defaultValue: value
		});

		crepe.on((listener) => {
			listener.markdownUpdated((_ctx, markdown) => {
				onchange?.(markdown);
			});
		});

		await crepe.create();
		crepe.setReadonly(readonly);
	});

	onDestroy(() => {
		crepe?.destroy();
	});

	$effect(() => {
		crepe?.setReadonly(readonly);
	});
</script>

<div bind:this={container} class="milkdown-container h-full w-full"></div>

<style>
	.milkdown-container :global(.milkdown) {
		height: 100%;

		/* Typography — Geist Mono throughout */
		--crepe-font-title: 'Geist Mono Variable', monospace;
		--crepe-font-default: 'Geist Mono Variable', monospace;
		--crepe-font-code: 'Geist Mono Variable', monospace;

		/* Background Colors */
		--crepe-color-background: var(--background); /* Main background color */
		--crepe-color-surface: var(--card); /* Surface color for cards/panels */
		--crepe-color-surface-low: var(--sidebar); /* Lower surface color for depth */

		/* Text Colors */
		--crepe-color-on-background: var(--foreground); /* Text color on background */
		--crepe-color-on-surface: var(--card-foreground); /* Text color on surface */
		--crepe-color-on-surface-variant: var(
			--muted-foreground
		); /* Secondary text color — icons, placeholders */

		/* Accent Colors */
		--crepe-color-primary: var(--primary); /* Primary brand color */
		--crepe-color-secondary: var(--secondary); /* Secondary accent color */
		--crepe-color-on-secondary: var(--secondary-foreground); /* Text color on secondary */

		/* UI Colors */
		--crepe-color-outline: var(--primary); /* Border/outline color */
		--crepe-color-inverse: var(--foreground); /* Inverse color for contrast */
		--crepe-color-on-inverse: var(--background); /* Text color on inverse */
		--crepe-color-inline-code: var(--primary); /* Inline code color */
		--crepe-color-error: var(--destructive); /* Error state color */

		/* Interactive Colors */
		--crepe-color-hover: var(--accent); /* Hover state color */
		--crepe-color-selected: var(--ring); /* Selected state color */
		--crepe-color-inline-area: var(--input); /* Inline editing area color */

		--crepe-shadow-1: 0px 1px 2px 0px oklch(0 0 0 / 0.08);
		--crepe-shadow-2: 0px 2px 6px 2px oklch(0 0 0 / 0.1);
	}
</style>
