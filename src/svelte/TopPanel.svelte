<script>
  import CameraSetup from './CameraSetup.svelte'
  import HelpContent from './HelpContent.svelte'
  import ChooseAvatar from './ChooseAvatar.svelte'
  import { toggleScreenShare } from '../audiovideo/screenshare.js'

  export let stage

  let cameraPanelOpen = false
  let helpPanelOpen = false
  let avatarPanelOpen = false

  function preventDefault(event) {
    event.preventDefault()
  }

  function toggleShowCameraSetup(event) {
    cameraPanelOpen = !cameraPanelOpen
    helpPanelOpen = false
    avatarPanelOpen = false
    event.preventDefault()
  }

  function toggleShowHelp(event) {
    helpPanelOpen = !helpPanelOpen
    avatarPanelOpen = false
    cameraPanelOpen = false
    event.preventDefault()
  }

  function handleClickAvatar(event) {
    avatarPanelOpen = !avatarPanelOpen
    helpPanelOpen = false
    cameraPanelOpen = false
    stage.focusOnGame()
    if (event) {
      event.preventDefault()
    }
  }

  function handleClickShareScreen(event) {
    toggleScreenShare(stage)
  }
</script>

<div class="panel">
  <div
    class="button first"
    class:opaque={cameraPanelOpen}
    on:click={toggleShowCameraSetup}>
    <div class="icon">
      <img src="/av-config-icon.svg" alt="Microphone/Camera Settings" />
    </div>
    <div class="label">Camera Setup</div>
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

  <div class="button" on:click={handleClickShareScreen}>
    <div class="icon">
      <img src="/screenshare-icon.svg" alt="Share screen" class="medium" />
    </div>
    <div class="label">Share Screen</div>
  </div>

  <div class="button" id="upload-button">
    <div class="icon">
      <img src="/upload-icon.svg" alt="Upload asset" class="small" />
    </div>
    <div class="label">Upload</div>
  </div>

  <div
    class="button last"
    class:opaque={helpPanelOpen}
    on:click={toggleShowHelp}>
    <div class="icon"><img src="/help-icon.svg" alt="Help" /></div>
    <div class="label">Help Docs</div>
  </div>

  <div class="scrollable-panel" class:show={cameraPanelOpen}>
    <CameraSetup />
  </div>

  <div class="scrollable-panel" class:show={helpPanelOpen}>
    <HelpContent />
  </div>

  <div class="scrollable-panel" class:show={avatarPanelOpen}>
    <ChooseAvatar {stage} handleClose={handleClickAvatar} />
  </div>
</div>

<style>
  .panel {
    display: flex;
    justify-content: center;

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
    justify-content: flex-end;

    background: #eee;
    border-left: 1px solid #666;
    color: #333;
    padding: 5px 10px;

    opacity: 0.7;

    cursor: pointer;
    pointer-events: all;
  }
  .button.first {
    border-left: 0;
    border-bottom-left-radius: 8px;
  }
  .button.last {
    border-bottom-right-radius: 8px;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
  }

  .icon img {
    width: 48px;
    height: 48px;
  }
  .icon img.medium {
    width: 32px;
    height: 32px;
  }

  .icon img.small {
    width: 24px;
    height: 24px;
  }

  .button > .label {
    font-size: 12px;
    text-align: center;
  }

  @media only screen and (max-width: 400px) {
    .icon img {
      width: 32px;
      height: 32px;
    }
    .icon img.medium {
      width: 24px;
      height: 24px;
    }

    .icon img.small {
      width: 18px;
      height: 18px;
    }

    .button > .label {
      font-size: 10px;
      text-align: center;
    }
  }

  .button:hover,
  .button.opaque {
    background: #fff;
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
