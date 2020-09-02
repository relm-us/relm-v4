<script>
  import { onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { canAutoPermit } from './avutil.js'
  import State from '../svelte/stores.js'
  import Video from './Video.svelte'
  import Audio from './Audio.svelte'
  import Select from './Select.svelte'

  const AUDIO_LEVEL_MINIMUM = 0.0

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
  let letMeHearMyself = false

  // State.videoRequested.subscribe((bool) => (videoRequested = bool))
  // State.audioRequested.subscribe((bool) => (audioRequested = bool))

  let hasPermission = false
  let advancedSettings = false

  let videoError = false
  let audioError = false

  let videoCount = 0

  let audioLevelSpring = spring(0, {
    stiffness: 0.3,
    damping: 0.8,
  })

  let videoPositionSpring = spring(0, {
    stiffness: 0.5,
    damping: 0.3,
  })
  const shakeInactiveVideo = () => {
    videoPositionSpring.set(10)
    setTimeout(() => videoPositionSpring.set(0), 100)
  }

  const toggleAudioRequested = () => (audioRequested = !audioRequested)

  const toggleVideoRequested = () => (videoRequested = !videoRequested)

  const toggleAdvancedSettings = () => (advancedSettings = !advancedSettings)

  const requestPermissions = async () => {
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

    videoTrack = tracks.find((track) => track.type === 'video')
    audioTrack = tracks.find((track) => track.type === 'audio')
    audioTrack.addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      (level) => {
        // audioLevel = level
        audioLevelSpring.set(level)
      }
    )

    hasPermission = true
  }

  const joinGame = () => {
    alert('TODO')
  }

  const handleHelp = () => {
    alert('TODO')
  }

  onMount(async () => {
    const autoPermit = await canAutoPermit()
    if (autoPermit) {
      requestPermissions()
    }
  })
</script>

<div class="mirror">
  <p>You're about to join a video meeting</p>

  {#if hasPermission}
    <div class="video-box">
      {#if letMeHearMyself}
        <Audio track={audioTrack} />
      {/if}
      <Video track={videoTrack} mirror={true} onSuspend={requestPermissions} />
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
            class:audio-level={audioRequested && $audioLevelSpring > AUDIO_LEVEL_MINIMUM}
            class:track-disabled={!audioRequested}
            style="--audio-level:{($audioLevelSpring * 85 + 15).toFixed(2) + '%'}">
            {#if audioRequested}
              <img src="/audio-enabled.svg" width="32" alt="Audio Enabled" />
            {:else}
              <img src="/audio-disabled.svg" width="32" alt="Audio Disabled" />
            {/if}
          </button>
        </div>
      </div>
    </div>
    <button class="main-action" on:click={joinGame}>Join meeting</button>
    {#if advancedSettings}
      <div class="advanced-settings">
        <Select
          selected={0}
          options={[{ value: 0, label: 'Camera 1' }, { value: 1, label: 'Camera 2' }]}
          icon="/video-enabled.svg" />
        <Select
          selected={1}
          options={[{ value: 0, label: 'Mic 1' }, { value: 1, label: 'Mic 2' }]}
          icon="/audio-enabled.svg" />
        <Select
          selected={0}
          options={[{ value: 0, label: 'Speaker 1' }, { value: 1, label: 'Speaker 2' }]}
          icon="/speaker-icon.svg" />
      </div>
    {:else}
      <div class="minor-action">
        <button on:click={toggleAdvancedSettings}>Advanced Settings</button>
      </div>
    {/if}
  {:else}
    <div
      class="video-stack filled"
      class:blocked={requestBlocked}
      style="transform: translate({$videoPositionSpring}px, 0)">
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

    <button class="main-action" on:click={requestPermissions}>
      {#if requestBlocked}Try Again{:else}Request Permissions{/if}
    </button>
    {#if requestBlocked}
      <div class="minor-action">
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
    width: 500px;
  }
  p {
    width: 375px;
    text-align: center;
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
  .button-tray button img {
    z-index: 1;
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
  button.main-action {
    color: white;
    background-color: rgba(70, 130, 180, 1);
    border: 0;
    border-radius: 8px;
    margin-top: 15px;
    padding: 8px 15px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
  }
  button.main-action:hover {
    background-color: rgba(103, 152, 193, 1);
  }
  .minor-action {
    margin-top: 8px;
  }
  .minor-action button {
    border: none;
    background: none;
    text-decoration: underline;
    cursor: pointer;
  }
  .audio-level {
    position: relative;
  }
  .audio-level:before {
    content: ' ';
    display: block;
    position: absolute;
    width: 100%;
    height: var(--audio-level);
    max-height: 100%;
    bottom: 0;
    left: 0;
    background-color: rgba(70, 180, 74, 0.7);
    border-bottom-right-radius: 8px;
    border-bottom-left-radius: 8px;
  }
</style>
