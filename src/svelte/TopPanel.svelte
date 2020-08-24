<script>
  import { chooseAvatarState } from './stores.js'
  import HelpContent from './HelpContent.svelte'
  import ChooseAvatar from './ChooseAvatar.svelte'
  import { toggleScreenShare } from '../screenshare.js'

  export let stage

  let helpPanelOpen = false
  let avatarPanelOpen = false

  function preventDefault(event) {
    event.preventDefault()
  }

  function toggleShowHelp(event) {
    helpPanelOpen = !helpPanelOpen
    avatarPanelOpen = false
    event.preventDefault()
  }

  function handleClickAvatar(event) {
    avatarPanelOpen = !avatarPanelOpen
    helpPanelOpen = false
    if (event) {
      event.preventDefault()
    }
  }

  function handleClickShareScreen(event) {
    toggleScreenShare(stage)
  }
</script>

<style>
  .panel {
    display: flex;
    justify-content: center;

    margin-top: 8px;
    width: 100%;
    position: absolute;
    top: 0;

    z-index: 100;
    pointer-events: none;
  }
  .button {
    display: flex;
    flex-direction: column;
    align-items: center;

    border-radius: 8px;
    border: 3px solid #eebb11;
    background: #eee;
    color: #333;
    padding: 5px 10px;
    margin-left: 8px;

    opacity: 0.7;

    cursor: pointer;
    pointer-events: all;
  }

  .button > .icon {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;
  }

  .button > .label {
    font-size: 12px;
    text-align: center;
  }

  .button:hover,
  .button.opaque {
    background: #fff;
    border-color: #ef9911;
    opacity: 1;
  }

  .scrollable-panel {
    display: none;

    overflow-y: auto;
    pointer-events: all;

    position: fixed;
    margin: 0 30px;
    top: 94px;
    bottom: 60px;

    background: #fff;
    border-radius: 4px;
  }

  .show {
    display: block;
  }
</style>

<div class="panel">

  <div class="button" on:click={handleClickShareScreen}>
    <div class="icon">
      <img
        src="/screenshare-icon.svg"
        alt="Share screen"
        width="32"
        height="32" />
    </div>
    <div class="label">Share Screen</div>
  </div>

  <button class="button" id="upload-button" on:mousedown={preventDefault}>
    <div class="icon">
      <img src="/upload-icon.svg" alt="Upload asset" width="24" height="24" />
    </div>
    <div class="label">Upload</div>
  </button>

  <div class="button" class:opaque={helpPanelOpen} on:click={toggleShowHelp}>
    <div class="icon">
      <img src="/help-icon.svg" alt="Help" />
    </div>
    <div class="label">Help Docs</div>
  </div>

  <div
    class="button"
    class:opaque={avatarPanelOpen}
    on:click={handleClickAvatar}>
    <div class="icon">
      <img src="/select-avatar-icon.svg" alt="Select Avatar" />
    </div>
    <div class="label">Select Avatar</div>
  </div>

  <div class="scrollable-panel" class:show={helpPanelOpen}>
    <HelpContent />
  </div>

  <div class="scrollable-panel" class:show={avatarPanelOpen}>
    <ChooseAvatar {stage} handleClose={handleClickAvatar} />
  </div>
</div>
