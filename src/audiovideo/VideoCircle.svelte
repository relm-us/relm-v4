<script>
  import Video from './Video.svelte'
  import Audio from './Audio.svelte'

  import { participants } from './ParticipantStore.js'

  export let participantId
  export let videoTrack
  export let audioTrack
  export let mirror = false
</script>

<div class="wrapper">
  <div class="circle">
    {#if videoTrack}
      <Video track={videoTrack} {mirror} />
    {/if}
    {#if audioTrack}
      <Audio track={audioTrack} />
    {/if}
  </div>
</div>

<style>
  .wrapper {
    position: absolute;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .video-wrapper.drag-lock .video-circle {
    border-color: #eebb11;
  }
  .video-wrapper.show {
    animation: fadein 0.5s;
  }
  .video-wrapper.hide {
    animation: fadeout 0.5s;
    animation-fill-mode: forwards;
  }
  .circle {
    display: flex;

    width: 100px;
    height: 100px;
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
  .video-circle.desktop {
    border-radius: 0 !important;
  }
  .video-feed {
    position: relative;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .video-feed.mirror {
    transform: translate(-50%, -50%) rotateY(180deg);
  }
  .video-feed.fullscreen {
    width: 100% !important;
    height: 100% !important;
  }
  .mute-button {
    background: white center no-repeat url(./icons/unmuted.png);
    background-size: 1.1em 1.1em;
    width: 1.5em;
    height: 1.5em;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    bottom: -0.75em;
    border: 3px solid white;
    border-radius: 18px;
    z-index: 1;
    pointer-events: auto;
  }
  .mute-button:hover {
    border-color: #eebb11;
  }
  .mute-button:hover::before {
    content: 'Mute (M)';
    white-space: nowrap;
    position: relative;
    left: 2em;
    padding: 2px 5px;
    height: 20px;
    border: 1px solid #444;
    border-radius: 3px;
    background-color: white;
  }
  .mute-button.muted {
    background-image: url(./icons/muted.png);
  }
</style>
