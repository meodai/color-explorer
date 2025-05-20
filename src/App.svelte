<script>
  import { onMount } from 'svelte';
  import { colorStore } from './lib/stores/colorStore.js';
  import WikiArticle from './lib/components/WikiArticle.svelte';
  import Definitions from './lib/components/Definitions.svelte';
  import { derived } from 'svelte/store';

  // Subscribe to store
  const { subscribe, fetchRandomColorData } = colorStore;
  const colorData = subscribe;

  // Visibility derived from hex
  const isVisible = derived(colorStore, $c => Boolean($c.hex));
  let isStarted = true;

  function fetchRandomColor() {
    console.clear();
    console.log('Fetching random color...');
    isStarted = false;
    fetchRandomColorData();
  }

  onMount(() => {
    fetchRandomColor();
  });
</script>

<main style="--c-color: {$colorStore.hex};">

  <button type="button"
    class="colorswatch" 
    on:click={fetchRandomColor}
    aria-label="Generate a random color"
    >
    <div class="color-details">
      <span class="color-name">{$colorStore.name}</span>
      <span class="color-value">{$colorStore.hex}</span>
    </div>
  </button>
  
  <div class="info-container">
    {#if $colorStore.wikiArticles.length}
      <WikiArticle articles={$colorStore.wikiArticles} />
    {/if}
    {#if $colorStore.definitions.length}
      <Definitions definitions={$colorStore.definitions} />
    {/if}
    <!-- etc for quotes and disambiguation components -->
  </div>
</main>

<style>
  :root {
  }
  
  main {
    max-width: 800px;
    margin: 0 auto;
  }

  .colorswatch {
    width: 100%;
    height: 200px;
    background-color: var(--c-color);
    margin: 2rem 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: none;
    outline: none;
    padding: 0;
  }
  
  .color-details {
    text-align: center;
  }
  
  .color-name {
    display: block;
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .info-container {
    margin-top: 2rem;
  }
  
  .article {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .article img {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
  }
  
  .dictionary-entry {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .definition-title {
    font-size: 0.9rem;
    font-weight: normal;
  }
  
  .pronunciation {
    margin: 0.5rem 0;
  }
  
  .phonetic {
    font-style: italic;
    margin-right: 0.5rem;
  }
  
  .audio-btn {
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 1rem;
  }
  
  .part-of-speech {
    font-style: italic;
    margin-bottom: 0.25rem;
  }
  
  .definitions {
    margin-top: 0.25rem;
    padding-left: 1.5rem;
  }
  
  .definitions li {
    margin-bottom: 0.5rem;
  }
  
  .source {
    font-size: 0.8rem;
    margin-top: 1rem;
    text-align: right;
  }
  
  .instructions {
    text-align: center;
    margin-top: 1rem;
  }
  
  .article-images {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  figure {
    margin: 0;
    padding: 0;
  }
  
  .article-image {
    max-width: 100%;
    
    overflow: hidden;
  }
  
  figcaption {
    font-size: 0.8rem;
    padding: 0.5rem 0;
    text-align: center;
  }
  
  .article-images {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .article-image {
    flex: 1 1 calc(33.333% - 1rem);
    max-width: calc(33.333% - 1rem);
    overflow: hidden;
  }
  
  .article-image img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .article-image figcaption {
    font-size: 0.8rem;
    padding: 0.5rem;
    text-align: center;
  }
  
  
</style>
