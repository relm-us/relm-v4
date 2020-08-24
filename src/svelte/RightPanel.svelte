<script>
  import { chooseAvatarState } from './stores.js'
  import HelpContent from './HelpContent.svelte'

  let helpPanelOpen = false

  function preventDefault(event) {
    event.preventDefault()
  }

  function toggleShowPanel(event) {
    helpPanelOpen = !helpPanelOpen
    event.preventDefault()
  }

  function handleClickAvatar(event) {
    chooseAvatarState.update((value) => true)
  }
</script>

<style>
  .button {
    font-size: 18px;
    border-radius: 8px;
    border: 3px solid #eebb11;
    background: #eee;
    color: #333;
    padding: 5px 10px;

    cursor: pointer;
  }
  .button:hover {
    background: #fff;
    border-color: #ef9911;
  }

  #right-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    left: 20px;
    max-height: 100%;
    z-index: 3;

    display: flex;
    flex-direction: column;
    align-items: flex-end;

    pointer-events: none;
  }
  #right-panel > * {
    pointer-events: all;
  }

  #help-panel {
    overflow-y: auto;
    max-width: 100%;
  }

  .panel-button {
    margin-top: 5px;
  }
  .panel-subpanel {
    display: none;
    /* padding: 5px 10px; */
    margin-top: 5px;
    background: #fff;
    border-radius: 4px;
  }
  .panel-subpanel.show {
    display: block;
  }
</style>

<div id="right-panel">

  <div
    id="my-character"
    class="panel-button button"
    on:click={handleClickAvatar}>
    My Character
  </div>
  <button
    id="upload-button"
    class="panel-button button"
    on:mousedown={preventDefault}>
    Upload
  </button>
  <div
    id="help-button"
    class="panel-button button"
    on:mousedown={toggleShowPanel}>
    Help
  </div>

  <div id="help-panel" class="panel-subpanel" class:show={helpPanelOpen}>
    <HelpContent />
  </div>
</div>
