<script>
  export let checked = false
  export let onCheck

  function handleCheck(_event) {
    if (onCheck) {
      onCheck(!checked)
    }
  }
</script>

<div class="checkmark">
  <div class="box" class:checked on:click={handleCheck} />
  <div class="text">
    <slot />
  </div>
</div>

<style>
  .box {
    width: 2em;
    height: 2em;
    border: 2px solid #bbb;
    border-radius: 4px;
  }
  .box.checked {
    background-image: url(./checkmark.svg);
  }
</style>
