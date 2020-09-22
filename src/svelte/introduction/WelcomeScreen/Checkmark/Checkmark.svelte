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
  .checkmark {
    display: flex;
    align-items: center;
  }
  .box {
    flex-shrink: 0;
    flex-grow: 0;
    width: 2em;
    height: 2em;
    border: 2px solid #bbb;
    border-radius: 4px;
  }
  .box.checked {
    background-image: url(./images/checkmark.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: 75%;
  }
  .text {
    flex-grow: 1;
    padding-left: 16px;
  }
</style>
