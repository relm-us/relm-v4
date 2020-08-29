<script>
  import State from '../svelte/stores.js'
  import { spring } from 'svelte/motion'

  // Global state
  let videoTrack
  let audioTrack

  State.videoTrack.subscribe((track) => (videoTrack = track))
  State.audioTrack.subscribe((track) => (audioTrack = track))

  // Local state
  let requestBlocked = false

  // State.videoRequested.subscribe((bool) => (videoRequested = bool))
  // State.audioRequested.subscribe((bool) => (audioRequested = bool))

  let videoError = false
  let audioError = false

  let videoShakePos = spring(0, {
    stiffness: 0.5,
    damping: 0.3,
  })
  const shakeInactiveVideo = () => {
    videoShakePos.set(10)
    setTimeout(() => videoShakePos.set(0), 100)
  }

  const requestPermissions = async () => {
    console.log('requestPermissions')
    let tracks
    const requestAlreadyBlocked = requestBlocked

    videoError = false
    audioError = false
    requestBlocked = false
    try {
      tracks = await JitsiMeetJS.createLocalTracks({
        devices: ['video', 'audio'],
      })
    } catch (err) {
      console.warn(
        'Video & audio requested, but unable to create both local tracks'
      )
      videoError = true
      try {
        // Try just audio if requesting both camera & mic failed
        tracks = await JitsiMeetJS.createLocalTracks({
          devices: ['audio'],
        })
      } catch (err) {
        console.warn('Audio requested, but unable to create local track')
        // Only shake the div if it's already bright red
        if (requestAlreadyBlocked) {
          shakeInactiveVideo()
        }
        requestBlocked = true
        audioError = true
      }
    }
  }

  const handleHelp = () => {
    alert('TODO')
  }

  $: if (requestBlocked) {
  }
</script>

<div class="mirror">
  <h1>Relm</h1>
  <p>You're about to join a video meeting</p>

  <div
    class="video-inactive"
    class:blocked={requestBlocked}
    style="transform: translate({$videoShakePos}px, 0)">
    <div class="image">
      <img src="/video-disabled.svg" width="75" alt="Video Disabled" />
    </div>
    <div class="message">
      {#if requestBlocked}
        Cam and mic are blocked
      {:else}Cam and mic are not active{/if}
    </div>
  </div>

  <p>
    For others to see and hear you, your browser will request access to your cam
    and mic.
  </p>

  <button class="request-permissions" on:click={requestPermissions}>
    {#if requestBlocked}Try Again{:else}Request Permissions{/if}
  </button>
  {#if requestBlocked}
    <div class="help">
      <button on:click={handleHelp}>Need help?</button>
    </div>
  {/if}

</div>

<style>
  .mirror {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .video-inactive {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    background-color: #555;
    border-radius: 10px;
    width: 375px;
    height: 225px;
  }
  .video-inactive.blocked {
    background-color: #f55;
  }
  .video-inactive .image {
    display: flex;
    justify-content: center;
    flex-grow: 1;
    margin-top: 15px;
  }
  .video-inactive .message {
    color: #eee;
    background-color: #222;
    border-radius: 10px;
    padding: 8px 15px;
    margin: 8px;
    text-align: center;

    font-family: Arial, Helvetica, sans-serif;
  }
  .video-inactive.blocked .message {
    background-color: #822;
  }
  button:active {
    transform: translateY(1px);
  }
  button.request-permissions {
    color: white;
    background-color: #4682b4;
    border: 0;
    border-radius: 8px;
    padding: 8px 15px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
  }
  button.request-permissions:hover {
    background-color: #6798c1;
  }
  .help {
    margin-top: 8px;
  }
  .help button {
    border: none;
    background: none;
    text-decoration: underline;
  }
</style>
