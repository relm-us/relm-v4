<script>
  import Video from '../Video'
  import Audio from '../Audio'
  import VideoMuteButton from './VideoMuteButton'

  import {
    videoPositions,
    videoVisibilities,
    videoSize,
  } from '../ParticipantStore.js'

  window.videoPositions = videoPositions
  window.videoVisibilities = videoVisibilities
  window.videoSize = videoSize

  export let participantId
  export let videoTrack
  export let audioTrack = null
  export let volume = 0
  export let mirror = false

  let muted = false

  function handleToggleMute(muted_) {
    muted = muted_
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
    {#if videoTrack}
      <Video track={videoTrack} {mirror} />
    {/if}
    {#if audioTrack}
      <Audio track={audioTrack} />
    {/if}
  </div>
  <VideoMuteButton {muted} {volume} onToggle={handleToggleMute} />
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
    pointer-events: none;
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
</style>
