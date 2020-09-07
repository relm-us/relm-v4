<script>
  import { onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { canAutoPermit, getDefaultDeviceId, getDeviceList } from './avutil.js'
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
  let localTracks
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

  const canChangeOutputDevice = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(
    'output'
  )
  const canChangeInputDevice = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(
    'input'
  )

  let deviceList = []
  let devices = {
    audioinput: {},
    audiooutput: {},
    videoinput: {},
  }

  // Camera Configuration
  let cameraOptions = []
  let cameraDefaultId
  let cameraSelectedId

  $: cameraOptions = Object.values(devices['videoinput']).map((input) => ({
    value: input.deviceId,
    label: input.label,
  }))

  $: cameraDefaultId = getDefaultDeviceId(devices, 'videoinput')

  // Microphone Configuration
  let microphoneOptions = []
  let microphoneDefaultId
  let microphoneSelectedId

  $: microphoneOptions = Object.values(devices['audioinput']).map((input) => ({
    value: input.deviceId,
    label: input.label,
  }))

  $: microphoneDefaultId = getDefaultDeviceId(devices, 'audioinput')

  $: if (cameraSelectedId || microphoneSelectedId) {
    requestPermissions()
  }

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

  const deviceListChanged = (deviceList_) => (deviceList = deviceList_)

  const requestPermissions = async () => {
    const requestAlreadyBlocked = requestBlocked

    // Clean up from past local track creation
    if (localTracks) {
      for (const track of localTracks) {
        track.detach()
        track.removeEventListener(
          JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
          audioLevelChanged
        )
      }
    }

    videoError = false
    audioError = false
    requestBlocked = false
    try {
      const options = {
        devices: ['video', 'audio'],
      }
      if (cameraSelectedId) {
        options.cameraDeviceId = cameraSelectedId
      }
      if (microphoneSelectedId) {
        options.micDeviceId = microphoneSelectedId
      }
      console.log('requestPermissions', options)
      localTracks = await JitsiMeetJS.createLocalTracks(options)
    } catch (err) {
      console.warn(
        'Video & audio requested, but unable to create both local tracks'
      )

      // Try requesting just camera if requesting both camera & mic failed
      try {
        const options = {
          devices: ['video'],
        }
        if (cameraSelectedId) {
          options.cameraDeviceId = cameraSelectedId
        }
        localTracks = await JitsiMeetJS.createLocalTracks(options)
      } catch (err) {
        console.warn('Video requested, but unable to create local track')
        // Only shake the div if it's already bright red
        if (requestAlreadyBlocked) {
          shakeInactiveVideo()
        }
        videoError = true
      }

      // Try requesting just mic if requesting both camera & mic failed
      try {
        const options = {
          devices: ['audio'],
        }
        if (microphoneSelectedId) {
          options.micDeviceId = microphoneSelectedId
        }
        // Try just audio if requesting both camera & mic failed
        localTracks = await JitsiMeetJS.createLocalTracks(options)
      } catch (err) {
        console.warn('Audio requested, but unable to create local track')
        // Only shake the div if it's already bright red
        if (requestAlreadyBlocked) {
          shakeInactiveVideo()
        }
        audioError = true
      }
      if (audioError && videoError) {
        requestBlocked = true
      }
    }

    videoTrack = localTracks.find((track) => track.type === 'video')
    audioTrack = localTracks.find((track) => track.type === 'audio')

    if (audioTrack) {
      audioTrack.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevelChanged
      )
    }

    deviceList = await getDeviceList()

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

    try {
      deviceList = await getDeviceList()
    } catch (err) {
      console.warn(err)
    }

    JitsiMeetJS.mediaDevices.addEventListener(
      JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
      deviceListChanged
    )

    return () => {
      JitsiMeetJS.mediaDevices.removeEventListener(
        JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
        deviceListChanged
      )
    }
  })

  // Convert `deviceList` to `devices` Object, sorted by source type
  $: for (const device of deviceList) {
    devices[device.kind][device.deviceId] = device
  }

  $: console.log(
    'deviceList',
    deviceList,
    JitsiMeetJS.mediaDevices.getAudioOutputDevice()
  )
  $: console.log('cameraSelectedId', cameraSelectedId)
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
        </div>
      </div>
    </div>
    <button class="main-action" on:click={joinGame}>Join meeting</button>
    {#if advancedSettings}
      <div class="advanced-settings">
        <Select
          selected={cameraSelectedId || cameraDefaultId}
          options={cameraOptions}
          onSelect={(option) => {
            cameraSelectedId = option.value
          }}
          icon="/video-enabled.svg" />
        <Select
          selected={microphoneSelectedId || microphoneDefaultId}
          options={microphoneOptions}
          onSelect={(option) => {
            microphoneSelectedId = option.value
          }}
          icon="/audio-enabled.svg" />
        <Select
          selected={0}
          options={[{ value: 0, label: 'Default Speakers' }]}
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
