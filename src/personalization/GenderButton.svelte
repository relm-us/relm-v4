<script>
  export let gender
  export let variant
  export let onSelect
  export let highlight = false
</script>

<div
  class="button"
  class:f={gender === 'f'}
  class:m={gender === 'm'}
  class:highlight
  on:click={() => onSelect(gender, variant)}
  on:mousedown|preventDefault
  data-gender={gender}
  data-index={variant}>
  <img
    src="avatars/{gender}{variant}.png"
    alt="gender {gender} option {variant}" />
</div>

<style>
  img {
    width: 48px;
    pointer-events: none;
  }
  .button {
    padding: 8px;
    cursor: pointer;
  }
  .button:hover,
  .highlight {
    background-color: #fefefe;
    border-radius: 8px;
  }
  .button.f img {
    border-bottom: 3px solid pink;
  }
  .button.m img {
    border-bottom: 3px solid #66bbff;
  }
</style>
