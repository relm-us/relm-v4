<script>
  import { exportImportState } from './stores.js'
  
  import { config } from '../config.js'
  import { showToast } from '../lib/Toast.js'
  import { exportRelm, importRelm } from '../export.js'
  
  export let stage
  export let network

  const cfg = config(window.location)
  
  let state
  let text
  let exportSelectedOnly = true

  exportImportState.subscribe(value => {
    state = value
  })

  function closeWindow() {
    exportImportState.update(() => null)
  }

  function handleClose() {
    closeWindow()
    stage.focusOnGame()
  }
  
  function handleImport() {
    let data
    try {
      data = JSON.parse(text)
    } catch (err) {
      showToast(`Unable to parse JSON: ${err}`)
      return
    }
    
    closeWindow()
    const objectCount = importRelm(network, data)
    showToast(`Imported ${objectCount} objects into this arelm.`)
  }
  
  $: switch (state) {
    case 'import':
      text = ''
      break
    case 'export':
      text = JSON.stringify(exportRelm(stage, network, exportSelectedOnly, cfg.ROOM), null, 2)
      break
  }
</script>


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
.import-export > textarea {
  resize: none;
  flex-grow: 1;
  padding: 15px;
  border: none;
  border-bottom: 2px solid #999;
}
.import-export > .button-panel {
  margin: 10px 15px;
  display: flex;
  justify-content: flex-end;
}
.import-export .button {
  margin-left: 10px;
}
.import-export input[type=checkbox] {
  width: 35px;
  height: 35px;
}
.import-export .export-only-selected {
  display: flex;
  align-items: center;
  margin-right: 30px;
}
</style>


<div
  class="import-export"
  class:hide={ state === null }
>
  <textarea value={ text } on:input={ (e) => { text = e.target.value }}></textarea>
  
  <div class="button-panel">
  
  {#if state === 'import'}
    <button class="button" on:click={ handleImport }>Import into this relm</button>
    <button class="button" on:mouseup|capture|stopPropagation={ handleClose }>Close</button>
  {:else if state === 'export'}
    <div class="export-only-selected">
      <input type="checkbox" id="export-only-selected-checkbox" bind:checked={ exportSelectedOnly }>
      <label for="export-only-selected-checkbox">Export Selected Objects Only</label>
    </div>
    <button class="button" on:mouseup|capture|stopPropagation={ handleClose }>Close</button>
  {:else}
    Error: state is {state}
  {/if}
  
  </div>
  
</div>
