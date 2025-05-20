<script>
  export let definitions = [];
</script>

{#each definitions as entry}
  <div class="dictionary-entry">
    <h2>{entry.word} <span class="definition-title">- Definition</span></h2>
    <div class="pronunciation">
      {#each entry.phonetics as phonetic}
        {#if phonetic.text}
          <span class="phonetic">{phonetic.text}</span>
        {/if}
        {#if phonetic.audio}
          <button class="audio-btn" on:click={() => new Audio(phonetic.audio).play()}>🔊</button>
        {/if}
      {/each}
    </div>
    {#each entry.meanings.slice(0,3) as meaning}
      <div class="meaning">
        <div class="part-of-speech">{meaning.partOfSpeech}</div>
        <ul class="definitions">
          {#each meaning.definitions.slice(0,3) as def}
            <li>{def.definition}</li>
          {/each}
        </ul>
      </div>
    {/each}
    <div class="source">Source: Dictionary API</div>
  </div>
{/each}

<style>
  .dictionary-entry { /* same styles as App.svelte */ }
  /* ... */
</style>
