<script lang="ts">
	import MilkdownEditor from '$lib/components/editor/milkdown-editor.svelte';

	let content = $state('# Welcome to Basalt\n\nStart writing your notes here...');
</script>

<div class="flex h-full flex-col">
	<MilkdownEditor value={content} onchange={(md) => (content = md)} />
</div>
