import { writable } from 'svelte/store'
import { selectedDevices as selectedDevicesStore } from './DeviceListStore.js'

const { TRACK_AUDIO_LEVEL_CHANGED } = JitsiMeetJS.events.track

const audioRequested = writable(true)
const videoRequested = writable(true)

function getRequestedTracks() {
  const requestedTracks = []

  audioRequested.subscribe((audio) => {
    if (audio) requestedTracks.push('audio')
  })()

  videoRequested.subscribe((video) => {
    if (video) requestedTracks.push('video')
  })()

  return requestedTracks
}

function createLocalAudioLevelStore() {
  const { subscribe, set } = writable(0)

  /**
   * Adds or removes an event listener function if the track is an audio track
   *
   * @param {JitsiTrack} track
   * @param {string} direction - 'add' | 'remove'
   */
  const changeAudioTrackEventListener = (track, direction) => {
    if (track.getType() === 'audio') {
      track[`${direction}EventListener`](TRACK_AUDIO_LEVEL_CHANGED, set)
    }
    return track
  }

  return {
    subscribe,
    set,
    initTrack: (track) => {
      return changeAudioTrackEventListener(track, 'add')
    },
    deinitTrack: (track) => {
      return changeAudioTrackEventListener(track, 'remove')
    },
  }
}

const audioLevel = createLocalAudioLevelStore()

async function createLocalTracks(requestedTracks, selectedDevices) {
  let tracks = {}

  const options = { devices: requestedTracks }

  // If we have a specific video camera to request, include it in the options
  if (requestedTracks.includes('video') && selectedDevices.videoinput) {
    options.cameraDeviceId = selectedDevices.videoinput
  }

  // If we have a specific microphone to request, include it in the options
  if (requestedTracks.includes('audio') && selectedDevices.audioinput) {
    options.micDeviceId = selectedDevices.audioinput
  }

  try {
    // Get all requested tracks at once
    for (const track of await JitsiMeetJS.createLocalTracks(options)) {
      tracks[track.getType()] = audioLevel.initTrack(track)
    }
  } catch (err) {
    if (requestedTracks.length > 1) {
      // If multiple tracks were requested, try again by requesting one at a time
      for (const requestedTrack of requestedTracks) {
        try {
          Object.assign(
            tracks,
            await createLocalTracks([requestedTrack], selectedDevices)
          )
        } catch (err2) {
          console.error(`Shouldn't happen:`, err2)
        }
      }
    } else {
      console.warn(
        `Unable to create local track: ${requestedTracks.join(', ')}`
      )
    }
  }

  return tracks
}

function createLocalTracksStore() {
  const { subscribe, set } = writable({})

  function get() {
    let tracks
    subscribe((tracks_) => (tracks = tracks_))()
    return tracks
  }

  function clear() {
    const tracks = get()

    // Clean up from past local track creation
    for (const track of Object.values(tracks)) {
      audioLevel.deinitTrack(track)
    }

    // Reset localTracks to empty object
    set({})
  }

  return {
    // LocalTracksStore behaves as a Svelte-subscribable store
    subscribe,

    // LocalTracksStore can be set
    set,

    // add: (tracks) => {},

    count: () => {
      return Object.values(get()).length
    },

    /**
     * Create multiple local tracks at once, or if error, create multiple
     * local tracks one at a time. Takes into account `selectedDevices`
     * setting that is "global" to this component.
     *
     * @param {[string]} requestedTracks - a list of types of devices to allocate as tracks, e.g. ['video', 'audio']
     *
     * @returns {Object} - an object with keys equal to device types and values set to corresponding JitsiTrack
     */
    request: async ({ requestedTracks, selectedDevices } = {}) => {
      if (!requestedTracks) {
        requestedTracks = getRequestedTracks()
      }

      if (!selectedDevices) {
        selectedDevices = selectedDevicesStore.get()
      }

      const tracks = await createLocalTracks(requestedTracks, selectedDevices)

      clear()

      set(tracks)

      return Object.values(tracks).length > 0
    },

    // De-initialize existing tracks & clear the LocalTracksStore
    clear,
  }
}

const localTracks = createLocalTracksStore()

export { localTracks, audioLevel, videoRequested, audioRequested }
