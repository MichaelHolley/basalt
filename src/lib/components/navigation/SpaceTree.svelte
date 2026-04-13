<script lang="ts">
	import type { SpaceNode } from '$lib/server/db/types';
	import SpaceTreeNode from '$lib/components/navigation/SpaceTreeNode.svelte';
	import { appStore } from '@/stores/app.svelte';

	interface Props {
		spaces: SpaceNode[];
		depth?: number;
	}

	let { spaces, depth = 0 }: Props = $props();
</script>

{#each spaces as space (space.id)}
	<SpaceTreeNode {space} notes={appStore.notesBySpace[space.id] ?? []} {depth} />
{/each}
