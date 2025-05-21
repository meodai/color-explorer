<script>
  export let contents = [];

  console.log('InfiniteView contents:', contents);
</script>

<div class="infinite-view">
</div>

<style>
  .infinite-view {
    position: fixed;
    inset: 0;
    overflow: auto;
    background: #202126;
    z-index: 10;
  }
</style>