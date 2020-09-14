<script>
  import { onMount } from 'svelte'

  import ContinueButton from '../../ContinueButton'
  import Background from '../DefaultScreen/Background.svelte'

  import { KEY_RETURN } from 'keycode-js'
  import { name } from '/svelte/SettingsStore.js'

  let input
  let canContinue = false
  let transientName = null

  function handleChange(event) {
    transientName = event.target.value
  }

  function handleKeyDown(event) {
    if (event.keyCode === KEY_RETURN) {
      handleContinue()
    }
  }

  function handleContinue() {
    $name = transientName
  }

  onMount(() => {
    if ($name === null) {
      input.focus()
    }
  })

  $: canContinue = transientName && transientName.length > 2
</script>

<Background />

<div class="column">
  <div class="card">
    <div class="title">What's your name?</div>
    <div class="body">
      <input
        bind:this={input}
        type="text"
        value={$name}
        on:change={handleChange}
        on:keyup={handleChange}
        on:keydown={handleKeyDown} />
    </div>

    <ContinueButton on:click={handleContinue} enabled={canContinue} />
  </div>
</div>

<style>
  .column {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  }
  .card {
    max-width: 600px;
    margin: 0 auto;
    padding: 16px 32px 0px 32px;
    background-color: white;
    border-radius: 8px;
  }

  .title {
    font-size: 32px;
    text-align: center;
    margin: 16px 32px 24px 32px;
  }

  .body {
    margin: 32px;
  }
  .body input {
    font-size: 28px;
    line-height: 50px;
    display: block;
    border: 2px solid #ddd;
    border-radius: 8px;
    margin: 0 auto;
  }
</style>
