<script>
  import { onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { canAutoPermit, getDefaultDeviceId } from './avutil.js'
  import Video from './Video.svelte'
  import Audio from './Audio.svelte'
  import DeviceSelector from './DeviceSelector.svelte'
  import { deviceList } from './DeviceListStore.js'

  const AUDIO_LEVEL_MINIMUM = 0.0

  // Global state
  let videoTrack
  let audioTrack

  // State.videoTrack.subscribe((track) => (videoTrack = track))
  // State.audioTrack.subscribe((track) => (audioTrack = track))

  // Local state
  const localTracks = []
  let selectedDevices = {}
  let requestBlocked = false
  let enterMessage = null
  let videoRequested = true
  let audioRequested = true
  let letMeHearMyself = false

  // State.videoRequested.subscribe((bool) => (videoRequested = bool))
  // State.audioRequested.subscribe((bool) => (audioRequested = bool))

  let hasPermission = false
  let advancedSettings = false
  let advancedSettingsSupported = JitsiMeetJS.util.browser.isChrome()

  let videoError = false
  let audioError = false

  let videoCount = 0

  // $: if (cameraSelectedId || microphoneSelectedId) {
  //   requestPermissions()
  // }
  $: console.log('selectedDevices', selectedDevices)

  // Animation springs
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

  const audioLevelChanged = (level) => audioLevelSpring.set(level)

  const createLocalTracks = async (devices) => {
    const options = { devices }
    if (devices.includes('video') && selectedDevices.videoinput) {
      options.cameraDeviceId = selectedDevices.videoinput
    }
    if (devices.includes('audio') && selectedDevices.audioinput) {
      options.micDeviceId = selectedDevices.audioinput
    }
    console.log('createLocalTracks', devices, options)
    return await JitsiMeetJS.createLocalTracks(options)
  }

  const requestPermissions = async () => {
    // Clean up from past local track creation
    for (const track of localTracks) {
      track.detach()
      track.removeEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevelChanged
      )
    }
    localTracks.length = 0

    videoError = false
    audioError = false
    requestBlocked = false
    try {
      const newTracks = await createLocalTracks(['video', 'audio'])
      localTracks.push(...newTracks)
    } catch (err) {
      console.warn(
        'Video & audio requested, but unable to create both local tracks'
      )

      // Try requesting just camera if requesting both camera & mic failed
      try {
        const newTracks = await createLocalTracks(['video'])
        localTracks.push(...newTracks)
      } catch (err) {
        console.warn('Video requested, but unable to create local track')
        videoError = true
      }

      // Try requesting just mic if requesting both camera & mic failed
      try {
        const newTracks = await createLocalTracks(['audio'])
        localTracks.push(...newTracks)
      } catch (err) {
        console.warn('Audio requested, but unable to create local track')
        audioError = true
      }
      if (audioError && videoError) {
        if (requestBlocked) {
          // Visual feedback already indicates red, so shake it to emphasize error
          shakeInactiveVideo()
        }
        requestBlocked = true
      }
    }

    if (localTracks && localTracks.length >= 1) {
      console.warn('localTracks', localTracks)
      videoTrack = localTracks.find((track) => track.type === 'video')
      audioTrack = localTracks.find((track) => track.type === 'audio')

      if (audioTrack) {
        audioTrack.addEventListener(
          JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
          audioLevelChanged
        )
      }
      hasPermission = true
      await deviceList.requery()
    } else {
      // Oh dear, we can't get anything to work
    }
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
            style="--audio-level:{audioError ? '0' : ($audioLevelSpring * 85 + 15).toFixed(2) + '%'}">
            {#if audioRequested}
              <img src="/audio-enabled.svg" width="32" alt="Audio Enabled" />
            {:else}
              <img src="/audio-disabled.svg" width="32" alt="Audio Disabled" />
            {/if}
          </button>
          {#if advancedSettingsSupported}
            <button class="corner" on:click={toggleAdvancedSettings}><img
                src="/settings.svg"
                width="32"
                alt="Settings" /></button>
          {/if}
        </div>
      </div>
    </div>
    <button class="main-action" on:click={joinGame}>Join meeting</button>
    {#if advancedSettings}
      <div class="advanced-settings">
        <DeviceSelector
          selected={selectedDevices}
          on:selected={({ detail }) => {
            if (detail.value !== selectedDevices[detail.kind]) {
              selectedDevices[detail.kind] = detail.value
              requestPermissions()
            }
          }} />
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
          Cam and mic are blocked <button on:click={handleHelp}>(Need help?)</button>
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
  {/if}
  <div style="border 1px solid black; ">
    {#each $deviceList as device}
      <div>{device.label}: {device.deviceId}</div>
    {/each}
  </div>
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
  .video-stack .message button {
    border: none;
    background: none;
    text-decoration: underline;
    cursor: pointer;
    color: white;
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
  .button-tray button.corner {
    position: absolute;
    right: 10px;
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
