<script>
  import State from './stores.js'

  import { config } from '../config.js'
  import { showToast } from '../lib/Toast.js'
  import { exportRelm, importRelm } from '../export.js'

  export let stage
  export let network

  let isOpen
  let text

  State.editModalVisible.subscribe((value) => {
    isOpen = value
  })

  function clearText() {
    text = ''
  }

  function exportSelected() {
    text = JSON.stringify(
      exportRelm(stage, network, true, config.ROOM),
      null,
      2
    )
  }

  function closeWindow() {
    State.editModalVisible.update(() => false)
  }

  function handleClose() {
    closeWindow()
    stage.focusOnGame()
  }

  function handleImport(event) {
    let data
    try {
      data = JSON.parse(text)
    } catch (err) {
      showToast(`Unable to parse JSON: ${err}`)
      return
    }

    const objectCount = importRelm(network, data)
    showToast(`Imported ${objectCount} objects into this relm.`)

    handleClose()
    event.stopPropagation()
  }

  function handleKeydown(event) {
    if (isOpen && event.keyCode === 27) {
      handleClose()
      event.stopPropagation()
    }
  }

  $: if (isOpen) {
    exportSelected()
  }
</script>

<svelte:window on:keydown|capture={handleKeydown} />

<div class="import-export" class:hide={!isOpen}>
  <textarea
    value={text}
    on:input={(e) => {
      text = e.target.value
    }} />

  <div class="button-panel">

    <div class="button-panel-wrap-left">
      <button class="button" on:click={clearText}>Clear Editor</button>
      <button class="button" on:click={exportSelected}>Reset Editor</button>
    </div>

    <div class="button-panel-wrap-right">
      <button class="button" on:click={handleImport}>Apply Changes</button>
      <button class="button" on:mouseup|capture|stopPropagation={handleClose}>
        Close
      </button>
    </div>

  </div>

</div>

<style>
  .import-export {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 80px;
    right: 10%;
    bottom: 80px;
    left: 10%;
    z-index: 4;
    background-color: #fff;
  }
  textarea {
    resize: none;
    flex-grow: 1;
    padding: 15px;
    border: none;
    border-bottom: 2px solid #999;
  }
  .import-export > .button-panel {
    margin: 10px 15px;
    display: flex;
    justify-content: space-between;
  }

  .button-panel-wrap-left {
    display: flex;
    justify-content: flex-start;
  }

  .button-panel-wrap-right {
    display: flex;
    justify-content: flex-end;
  }

  .button {
    margin-left: 10px;
  }
</style>
