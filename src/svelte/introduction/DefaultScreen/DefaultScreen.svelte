<script>
  import Background from './Background.svelte'
</script>

<Background />

<div class="single-column">
  <slot />
</div>

<style>
  .single-column {
    margin: 0 auto;
    padding: 8px 24px;
    width: 600px;
    min-height: 100%;
    border-left: 2px solid #ddd;
    border-right: 2px solid #ddd;
    background-color: white;
  }
</style>
