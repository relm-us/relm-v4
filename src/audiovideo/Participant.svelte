<script>
  export let participant

  const id = participant.getId()
  const name = participant.getDisplayName()
</script>

<style>
  .participant {
    border-top: 2px solid #888;
  }
  .field {
    display: flex;
    margin: 4px 15px;
  }
  .key {
    font-weight: bold;
  }
  .value {
    padding-left: 15px;
  }
</style>

<div class="participant">
  <div class="field identifier">
    <div class="key">ID</div>
    <div class="value">{id}</div>
  </div>
  <div class="field name">
    <div class="key">Name</div>
    <div class="value">
      {#if name}
        <span class="name">{name}</span>
      {:else}
        <span class="no-name">[Anonymous]</span>
      {/if}

    </div>

  </div>
</div>
