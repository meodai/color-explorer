<script>
  export let articles = [];
</script>

{#each articles as article}
  <div class="article">
    <h2>{article.title}</h2>
    {#if article.thumbnail}
      <img src={article.thumbnail.source} alt={article.title} loading="lazy" />
    {/if}
    <div>{@html article.extract_html}</div>

    {#if article.images && article.images.length}
      <div class="article-images">
        {#each article.images as img}
          <figure class="article-image">
            <img src={img.url} alt={img.title} loading="lazy" fetchpriority="low" />
            {#if img.title}
              <figcaption>{img.title}</figcaption>
            {/if}
          </figure>
        {/each}
      </div>
    {/if}

    <a href={article.content_urls.desktop.page} target="_blank">Read more</a>
  </div>
{/each}

<style>
  .article {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .article img {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
  }
  .article-images {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .article-image {
    flex: 1 1 calc(33.333% - 1rem);
    box-sizing: border-box;
  }
  @media (max-width: 600px) {
    .article-image {
      flex: 1 1 100%;
    }
  }
</style>
