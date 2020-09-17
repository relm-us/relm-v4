<script>
  import Video from './Video.svelte'
  import Audio from './Audio.svelte'
  import VideoMuteButton from './VideoMuteButton.svelte'

  import { videoPositions } from './ParticipantStore.js'

  window.videoPositions = videoPositions

  export let participantId
  export let videoTrack
  export let audioTrack
  export let mirror = false
  export let visible = true

  let muted = false

  function handleToggleMute(muted_) {
    muted = muted_
  }

  let position
  $: position = $videoPositions[participantId] || { x: 100, y: 100 }
</script>

{#if visible}
  <div
    class="wrapper"
    style="--x: {position.x || 0}px; --y: {position.y || 0}px;">
    <div class="circle" style="--size: 100px">
      {#if videoTrack}
        <Video track={videoTrack} {mirror} />
      {/if}
      {#if audioTrack}
        <Audio track={audioTrack} />
      {/if}
    </div>
    <VideoMuteButton {muted} onToggle={handleToggleMute} />
  </div>
{/if}

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
    animation: fadein 0.5s;
  }
  .wrapper.hide {
    animation: fadeout 0.5s;
    animation-fill-mode: forwards;
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
