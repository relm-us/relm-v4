<script>
  import { identityModalState } from './stores.js'

  import { config } from '../config.js'
  import { showToast } from '../lib/Toast.js'
  import { Security } from '../security.js'

  export let stage
  export let network

  const cfg = config(window.location)

  let isOpen
  let text

  const security = Security()

  identityModalState.subscribe((value) => {
    isOpen = value
  })

  function clearText() {
    text = ''
  }

  async function copyIdentityToEditor() {
    const playerId = await security.getOrCreateId()
    const pubkey = await security.exportPublicKey()
    const signature = await security.sign(playerId)
    const headers = {
      'x-relm-id': playerId,
      'x-relm-s': signature,
      'x-relm-x': pubkey.x,
      'x-relm-y': pubkey.y,
    }
    // Assigning text here triggers svelte magic
    text = JSON.stringify(headers, null, 2)
  }

  function closeWindow() {
    identityModalState.update(() => false)
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

    // TODO: Use data as new identity
    //
    // showToast(`Imported ${objectCount} objects into this relm.`)
    showToast(`Identity import not yet supported`)

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
    copyIdentityToEditor()
  }
</script>

<style>
  .editor {
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
  .button-panel {
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

<svelte:window on:keydown|capture={handleKeydown} />

<div class="editor" class:hide={!isOpen}>
  <textarea
    value={text}
    on:input={(e) => {
      text = e.target.value
    }} />

  <div class="button-panel">

    <div class="button-panel-wrap-left">
      <button class="button" on:click={clearText}>Clear Editor</button>
      <button class="button" on:click={copyIdentityToEditor}>
        Reset Editor
      </button>
    </div>

    <div class="button-panel-wrap-right">
      <button class="button" on:click={handleImport}>Save</button>
      <button class="button" on:mouseup|capture|stopPropagation={handleClose}>
        Close
      </button>
    </div>

  </div>

</div>
