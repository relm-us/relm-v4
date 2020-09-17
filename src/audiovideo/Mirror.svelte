<script>
  import { onMount } from 'svelte'
  import { spring } from 'svelte/motion'

  import { canAutoPermit, getDefaultDeviceId } from './avutil.js'
  import { deviceList } from './DeviceListStore.js'
  import { videoTrack, audioTrack } from './LocalTrackStore.js'

  import Video from './Video.svelte'
  import Audio from './Audio.svelte'
  import DeviceSelector from './DeviceSelector.svelte'

  const AUDIO_LEVEL_MINIMUM = 0.0

  // Local state
  let localTracks = []
  let videoTrack_ = null
  let audioTrack_ = null

  let selectedDevices = {}
  let requestBlocked = false
  let enterMessage = null
  let videoRequested = true
  let audioRequested = true
  let letMeHearMyself = false

  let hasPermission = false
  let advancedSettings = false
  let advancedSettingsSupported = JitsiMeetJS.util.browser.isChrome()

  let videoError = false
  let audioError = false

  let videoCount = 0

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

  /**
   * Create multiple local tracks at once, or if error, create multiple
   * local tracks one at a time. Takes into account `selectedDevices`
   * setting that is "global" to this component.
   */
  const createLocalTracks = async (devices) => {
    let tracks = []

    const options = { devices }

    if (devices.includes('video') && selectedDevices.videoinput) {
      options.cameraDeviceId = selectedDevices.videoinput
    }

    if (devices.includes('audio') && selectedDevices.audioinput) {
      options.micDeviceId = selectedDevices.audioinput
    }

    try {
      // Get all requested tracks at once
      tracks = await JitsiMeetJS.createLocalTracks(options)
    } catch (err) {
      if (devices.length > 1) {
        // If multiple tracks were requested, try again by requesting one at a time
        for (const device of devices) {
          tracks.push(...(await createLocalTracks([device])))
        }
      } else {
        console.warn(`Unable to create local track: ${devices.join(', ')}`)
      }
    }

    return tracks
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

    // Reset localTracks to empty array in case no tracks are allocated below
    localTracks = []

    const showBlockedIfNot = (expected) => {
      if (localTracks.length !== expected) {
        if (requestBlocked) {
          // Visual feedback already indicates red,
          // so shake it to emphasize error
          shakeInactiveVideo()
        }
        requestBlocked = true
      } else {
        requestBlocked = false
      }
    }

    if (audioRequested && videoRequested) {
      localTracks = await createLocalTracks(['video', 'audio'])
      showBlockedIfNot(2)
    } else if (videoRequested) {
      localTracks = await createLocalTracks(['video'])
      showBlockedIfNot(1)
    } else if (audioRequested) {
      localTracks = await createLocalTracks(['audio'])
      showBlockedIfNot(1)
    } else {
      console.log(`Neither audio nor video requested`)
    }

    if (localTracks.length >= 1) {
      videoTrack_ = localTracks.find((track) => track.type === 'video')
      audioTrack_ = localTracks.find((track) => track.type === 'audio')

      if (audioTrack_) {
        audioTrack_.addEventListener(
          JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
          audioLevelChanged
        )
      }

      // Indicate that permission has been granted for at least 1 device
      hasPermission = true

      // After asking for permission, it's possible the browser will now allow us
      // to see more information about the devices available to the user, so requery
      await deviceList.requery()
    } else {
      console.warn(`Oh dear, we can't get any audio or video tracks to work`)
    }
  }

  const joinGame = () => {
    if (videoRequested && videoTrack_) {
      videoTrack.set(videoTrack_)
    } else {
      videoTrack.set(null)
    }

    if (audioRequested && audioTrack_) {
      audioTrack.set(audioTrack_)
    } else {
      audioTrack.set(null)
    }
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
        <Audio track={audioTrack_} />
      {/if}
      <Video track={videoTrack_} mirror={true} onSuspend={requestPermissions} />
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
