<script>
  import Mirror from '../audiovideo/Mirror.svelte'
</script>

<div class="setup">
  <h2>Camera Setup</h2>
  <h3>with microphone</h3>

  <Mirror />

</div>

<style>
  .setup {
    padding: 0 20px;
  }
  h2 {
    text-align: center;
    margin: 16px auto 4px auto;
  }
  h3 {
    text-align: center;
    margin: 4px;
    color: #222;
  }
</style>
