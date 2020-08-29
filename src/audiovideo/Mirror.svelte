<script>
  import State from '../svelte/stores.js'
  import { spring } from 'svelte/motion'
  import Video from './Video.svelte'

  // Global state
  let videoTrack
  let audioTrack

  State.videoTrack.subscribe((track) => (videoTrack = track))
  State.audioTrack.subscribe((track) => (audioTrack = track))

  // Local state
  let requestBlocked = false
  let enterMessage = null
  let videoRequested = true
  let audioRequested = true

  // State.videoRequested.subscribe((bool) => (videoRequested = bool))
  // State.audioRequested.subscribe((bool) => (audioRequested = bool))

  let hasPermission = false

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

  const toggleAudioRequested = () => {
    audioRequested = !audioRequested
  }

  const toggleVideoRequested = () => {
    videoRequested = !videoRequested
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
    console.log('requestPermissions tracks', tracks)

    videoTrack = tracks.find((track) => track.type === 'video')
    audioTrack = tracks.find((track) => track.type === 'audio')
    hasPermission = true
  }

  const handleHelp = () => {
    alert('TODO')
  }

  if (JitsiMeetJS.mediaDevices.isDeviceListAvailable()) {
    JitsiMeetJS.mediaDevices.enumerateDevices((deviceList) => {
      let autoPermit = false
      for (const device of deviceList) {
        console.log('device', device)
        if (device.label) autoPermit = true
      }

      if (autoPermit) {
        requestPermissions()
      }
    })
  }
</script>

<div class="mirror">
  <h1>Relm</h1>
  <p>You're about to join a video meeting</p>

  {#if hasPermission}
    <div class="video-box">
      <Video track={videoTrack} />
      <div class="video-stack overlay">
        {#if !audioRequested && !videoRequested}
          <div class="message">Join with cam and mic off</div>
        {:else if !videoRequested}
          <div class="message">Join with cam off</div>
        {:else if !audioRequested}
          <div class="message">Join with mic off</div>
        {:else}
          <div />
        {/if}
        <div class="button-tray">
          <button
            on:click={toggleVideoRequested}
            class:track-disabled={!videoRequested}>
            {#if videoRequested}
              <img src="/video-enabled.svg" width="32" alt="Video Enabled" />
            {:else}
              <img src="/video-disabled.svg" width="32" alt="Video Disabled" />
            {/if}
          </button>
          <button
            on:click={toggleAudioRequested}
            class:track-disabled={!audioRequested}>
            {#if audioRequested}
              <img src="/audio-enabled.svg" width="32" alt="Audio Enabled" />
            {:else}
              <img src="/audio-disabled.svg" width="32" alt="Audio Disabled" />
            {/if}
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div
      class="video-stack filled"
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
      For others to see and hear you, your browser will request access to your
      cam and mic.
    </p>

    <button class="request-permissions" on:click={requestPermissions}>
      {#if requestBlocked}Try Again{:else}Request Permissions{/if}
    </button>
    {#if requestBlocked}
      <div class="help">
        <button on:click={handleHelp}>Need help?</button>
      </div>
    {/if}
  {/if}

</div>

<style>
  .mirror {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .video-box {
    display: flex;
    justify-content: center;

    overflow: hidden;
    border-radius: 10px;
    width: 375px;
    height: 225px;

    background-color: #555;
  }
  .video-stack {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;

    border-radius: 10px;
    width: 375px;
    height: 225px;
  }
  .video-stack.overlay {
    position: absolute;
  }
  .video-stack.filled {
    background-color: #555;
  }
  .video-stack :global(video) {
    transform: rotateY(180deg);
  }
  .video-stack.blocked {
    background-color: #f55;
  }
  .video-stack .image {
    display: flex;
    justify-content: center;
    flex-grow: 1;
    margin-top: 15px;
  }
  .video-stack .message {
    color: #eee;
    background-color: rgba(33, 33, 33, 0.5);
    border-radius: 10px;
    padding: 8px 15px;
    margin: 8px;
    text-align: center;

    font-family: Arial, Helvetica, sans-serif;
  }
  .video-stack .button-tray {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .button-tray button {
    display: flex;

    color: white;
    background-color: rgba(33, 33, 33, 0.5);
    border: none;
    border-radius: 8px;
    margin: 8px;

    font-size: 18px;
    font-family: Arial, Helvetica, sans-serif;
    padding: 8px 15px;
  }
  .button-tray button.track-disabled {
    background-color: rgba(255, 85, 85, 0.7);
  }
  .button-tray button:hover {
    background-color: rgba(85, 85, 85, 0.7);
  }
  .button-tray button.track-disabled:hover {
    background-color: rgba(255, 115, 115, 0.7);
  }
  .video-stack.blocked .message {
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
