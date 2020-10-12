<script>
  import { spring } from 'svelte/motion'
  import { Audio, Video } from 'jitsi-svelte'
  import VideoMuteButton from './VideoMuteButton'

  export let participant
  export let position

  const ZOOM = 800000

  let x, y, size

  $: size = ZOOM / $position.z
  $: x = $position.x
  $: y = $position.y - size / 2

  function toggleVideoEnabled() {
    participant.setVideoEnabled(!$participant.videoEnabled)
  }

  let videoEnabled
  $: videoEnabled = $participant.videoEnabled && $participant.video

  let audioEnabled
  $: audioEnabled = $participant.audioEnabled && $participant.audio

  let audioLevelSpring = spring(0, {
    stiffness: 0.3,
    damping: 0.8,
  })

  participant.audioLevelStore.subscribe(($audioLevel) =>
    audioLevelSpring.set($audioLevel)
  )
</script>

<div class="wrapper" style="--x: {x || 0}px; --y: {y || 0}px;">
  <div class="circle" style="--size: {size}px">
    {#if videoEnabled}
      <Video track={$participant.video} mirror={$participant.isLocal} />
    {/if}
    {#if audioEnabled && !$participant.isLocal}
      <Audio track={$participant.audio} />
    {/if}
  </div>
  {#if videoEnabled}
    <div class="overlay show-disable" on:click={toggleVideoEnabled} />
  {:else}
    <div class="overlay show-enable" on:click={toggleVideoEnabled} />
  {/if}
  <VideoMuteButton
    {audioEnabled}
    setAudioEnabled={participant.setAudioEnabled}
    volume={$audioLevelSpring * 85 + 15} />
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
  .overlay.show-disable:hover {
    background-image: url(./images/video-disabled.svg);
  }
  .overlay.show-enable:hover {
    background-image: url(./images/video-enabled.svg);
  }
</style>
