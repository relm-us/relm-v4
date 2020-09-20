<script>
  import Video from '../Video'
  import Audio from '../Audio'
  import VideoMuteButton from './VideoMuteButton'

  import {
    videoPositions,
    videoVisibilities,
    videoSize,
  } from '../ParticipantStore.js'

  // import videoDisabledIcon from './images/video-disabled.svg'

  window.videoPositions = videoPositions
  window.videoVisibilities = videoVisibilities
  window.videoSize = videoSize

  export let participantId
  export let videoTrack
  export let audioTrack = null
  export let volume = 0
  export let mirror = false

  export let videoEnabled = true
  export let audioEnabled = true
  export let onVideoChanged = (_) => {}
  export let onAudioChanged = (_) => {}

  function toggleVideoEnabled() {
    videoEnabled = !videoEnabled
    onVideoChanged(videoEnabled)
  }

  function handleSetAudioEnabled(enabled) {
    if (audioEnabled !== enabled) {
      audioEnabled = enabled
      onAudioChanged(enabled)
    }
  }

  let position
  $: position = $videoPositions[participantId] || { x: 100, y: 100 }

  let visible
  $: visible = $videoVisibilities[participantId] === true ? true : false
</script>

<div
  class="wrapper"
  class:show={visible}
  class:hide={!visible}
  style="--x: {position.x || 0}px; --y: {position.y || 0}px;">
  <div class="circle" style="--size: {$videoSize}px">
    {#if videoTrack && videoEnabled}
      <Video track={videoTrack} {mirror} />
    {/if}
    {#if audioTrack && audioEnabled}
      <Audio track={audioTrack} />
    {/if}
  </div>
  {#if videoTrack && videoEnabled}
    <div class="overlay enabled" on:click={toggleVideoEnabled} />
  {:else}
    <div class="overlay disabled" on:click={toggleVideoEnabled} />
  {/if}
  <VideoMuteButton
    {volume}
    {audioEnabled}
    setAudioEnabled={handleSetAudioEnabled} />
</div>

<style>
  .wrapper {
    position: absolute;

    /**
     * Allow wrapper to be positioned wherever the ParticipantStore instructs
     */
    left: var(--x);
    top: var(--y);

    transform: translate(-50%, -50%);
    /* pointer-events: none; */
  }
  .wrapper.show {
    visibility: visible;
    opacity: 1;
    transition: visibility 0s linear 0s, opacity 300ms;
  }
  .wrapper.hide {
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear 300ms, opacity 300ms;
  }

  .circle {
    display: flex;

    width: var(--size);
    height: var(--size);

    /**
     * On Chrome, with certain video cards, the video feed is not clipped properly
     * when all border-radius directions are equal, so we make one of them 99% here.
     */
    border-radius: 99% 100% 100% 100%;
    border: 3px solid white;
    overflow: hidden;
    background-color: #ddd;
    position: relative;
    z-index: 1;
  }
  .circle.desktop {
    border-radius: 0 !important;
  }
  .overlay {
    position: absolute;
    z-index: 2;
    width: 100%;
    height: 100%;
    top: 0;
    border-radius: 99% 100% 100% 100%;
  }
  .overlay:hover {
    background-color: rgba(0, 0, 0, 0.5);
    background-size: 50%;
    background-position: center;
    background-repeat: no-repeat;
  }
  .overlay.enabled:hover {
    background-image: url(./images/video-disabled.svg);
  }
  .overlay.disabled:hover {
    background-image: url(./images/video-enabled.svg);
  }
</style>
