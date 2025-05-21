<script>
  export let blocks = [];
</script>

{#if blocks.length}
  <div class="arena-section">
    <h2>Visual Inspiration</h2>
    <div class="arena-blocks">
      {#each blocks as block (block.id)}
        {#if block.image && block.image.display}
          <figure class="arena-block">
            <img 
              src={block.image.display.url} 
              alt={block.title || "Visual inspiration"} 
              loading="lazy"
              fetchpriority="low" 
            />
            {#if block.title}
              <figcaption>{block.title}</figcaption>
            {/if}
          </figure>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  .arena-section {
    margin-top: 2rem;
  }
  
  .arena-blocks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    grid-gap: 1rem;
    margin-top: 1rem;
  }
  
  .arena-block {
    margin: 0;
    padding: 0;
    background-color: #f9f9f9;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  
  .arena-block img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
    aspect-ratio: 1 / 1;
  }
  
  figcaption {
    padding: 0.5rem;
    font-size: 0.8rem;
    text-align: center;
    background: rgba(255,255,255,0.9);
  }
</style>
