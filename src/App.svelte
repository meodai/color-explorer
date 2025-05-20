<script>
  import { onMount } from 'svelte';
  import { colorStore } from './lib/stores/colorStore.js';
  import WikiArticle from './lib/components/WikiArticle.svelte';
  import Definitions from './lib/components/Definitions.svelte';
  import { derived } from 'svelte/store';

  // Subscribe to store
  const { subscribe, fetchColorData } = colorStore;
  const colorData = subscribe;

  // Visibility derived from hex
  const isVisible = derived(colorStore, $c => Boolean($c.hex));

  function fetchRandomColor() {
    console.clear();
    console.log('Fetching random color...');
    fetchColorData();
  }

  onMount(() => {
    fetchRandomColor();
  });

  /*
        similarColors: returnedColors.filter(c => c.hex !== hex),
      description: cd.description[0] || '',
      descriptionList: cd.getDescriptiveList(),
      meanings: cd.meanings,
      */
</script>

<main style="--c-color: {$colorStore.hex}; --c-contrast: {$colorStore.bestContrast};">

  <button type="button"
    class="colorswatch" 
    on:click={fetchRandomColor}
    aria-label="Generate a random color"
    >
    <div class="color-details">
      <span class="color-name">{$colorStore.name}</span>
      <span class="color-value">{$colorStore.hex}</span>
      <span>Click for new color</span>
    </div>
  </button>
  
  <div class="info-container">
    {#if $colorStore.description}
      <p>{$colorStore.description}</p>
    {/if}

    {#if $colorStore.wikiArticles.length}
      <WikiArticle articles={$colorStore.wikiArticles} />
    {/if}
    {#if $colorStore.definitions.length}
      <Definitions definitions={$colorStore.definitions} />
    {/if}
    <!-- etc for quotes and disambiguation components -->
    {#if $colorStore.disambiguations.length}
      <div class="disambiguation">
        <h2>Disambiguation</h2>
        <ul>
          {#each $colorStore.disambiguations as disambiguation}
            <WikiArticle articles={[disambiguation]} />
          {/each}
        </ul>
      </div>
    {/if}

    {#if $colorStore.quotes.length}
      <!--div class="quotes">
        <h2>Quotes</h2>
        <ul>
          {#each $colorStore.quotes as quote}
            <li>{JSON.stringify(quote)}</li>
          {/each}
        </ul>
      </div-->
    {/if}


  </div>

  <div class="similars">

    
    {#if $colorStore.similarColors.length}
      <h2>Similar Colors</h2>
      <ul>
        {#each $colorStore.similarColors as col}
          <li>
            <button type="button" class="colorswatch" on:click={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              colorStore.fetchColorData(col.hex)
            }}
            style="--c-color: {col.hex}; --c-contrast: {col.bestContrast};"
            >
              <div class="color-details">
                <span class="color-name">{col.name}</span>
                <span class="color-value">{col.hex}</span>
                <span>Click for new color</span>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>

<style>
  
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
    padding: 1rem;
    color: var(--c-contrast);
  }

  ul, li {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  ul:has(.colorswatch) {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  ul .colorswatch {
    height: auto;
    margin: 0;
  }
  
  .color-details {
    text-align: center;
  }

  .color-value {
    display: block;
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
