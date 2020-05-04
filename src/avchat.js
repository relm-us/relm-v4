
let JitsiMeetJS
let connection
let remoteParticipants = {}
let conference
let localTracks

const CONFERENCE_ROOM_NAME = 'relm01'

function initRemoteParticipant(participantId) {
  if (!remoteParticipants[participantId]) {
    remoteParticipants[participantId] = {
      trackIndex: -1,
      playerId: null
    }
  }
}

// ---

function onTrackAdded(track, playerId, callbacks) {
  console.log('onTrackAdded', track)
  if (track.isLocal()) {
    onLocalTrackAdded(track, playerId, callbacks)
  } else {
    onRemoteTrackAdded(track, playerId, callbacks)
  }
}

function onTrackRemoved(track) {
  if (track.isLocal()) {
    onLocalTrackRemoved(track)
  } else {
    onRemoteTrackRemoved(track)
  }
}

function onLocalTrackAdded(track, playerId, callbacks) {
  console.log('onLocalTrackAdded', track)
  track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, onLocalTrackStopped)
}

function onLocalTrackRemoved(track) {
  console.log('onLocalTrackRemoved', track)
}

function onLocalTrackStopped() {
  console.log('onLocalTrackStopped')
}

function onRemoteTrackAdded(track, playerId, callbacks) {
  console.log('onRemoteTrackAdded', track)
  track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, onRemoteTrackAudioLevelChanged)
  track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, onRemoteTrackAudioOutputChanged)
  track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, onRemoteTrackMuteChanged)

  const participantId = track.getParticipantId()
  initRemoteParticipant(participantId)
  remoteParticipants[participantId].trackIndex++
  
  const elementId = `${track.getType()}-${participantId}-${remoteParticipants[participantId].trackIndex}`

  switch(track.getType()) {
    case 'video':
      window.track = track
      const remotePlayerId = remoteParticipants[participantId].playerId
      if (remotePlayerId && playerId !== remotePlayerId) {
        const videoElement = callbacks.createVideoElement(remotePlayerId)
        if (videoElement) {
          videoElement.setAttribute('id', elementId)
          track.attach(videoElement)
        } else {
          console.warn("Can't createVideoElement for remote player")
        }
      } else {
        console.warn(`Remote participant ${participantId} has no playerId set, can't add video`)
      }
    
      // console.log('need to attach video', elementId)
      // const videoElement = document.createElement('video')
      // videoElement.setAttribute('autoplay', 1)
      // videoElement.setAttribute('id', elementId)
      // videoElement.style.position = 'absolute'
      // videoElement.style.top = '0'
      // videoElement.style.width = '200px'
      // track.attach(videoElement)
      // document.body.appendChild(videoElement)
      break;
    case 'audio':
      const audioElement = document.createElement('audio')
      audioElement.autoplay = true
      audioElement.id = elementId
      document.body.appendChild(audioElement)
      track.attach(audioElement)
      break;
    default:
      console.error('track has unknown type', track.getType())
      return
  }
}

function onRemoteTrackRemoved(track) {
  console.log('onRemoteTrackRemoved', track)
}

function onRemoteTrackAudioLevelChanged(audioLevel) {
  // console.log(`onTrackAudioLevelChanged, remote audio level: ${audioLevel}`)
}

function onRemoteTrackAudioOutputChanged(deviceId) {
  console.log(`onRemoteTrackAudioOutputChanged, device changed to: ${deviceId}`)
}

function onRemoteTrackMuteChanged() {
  console.log('onRemoteTrackMuteChanged')
}

function onConferenceJoined() {
  console.log('onConferenceJoined')
  addLocalTracksToConference()
}

function onConferenceLeft() {
  console.log('onConferenceLeft')
}

function onConferenceError(errorCode) {
  console.log('onConferenceError', errorCode)
}

function onConferenceFailed(errorCode) {
  console.log('onConferenceFailed', errorCode)
}

function onUserJoined(participantId, participant) {
  console.log(`onUserJoined, particpant: ${participantId}`, participant)
  initRemoteParticipant(participantId)
  if (participant.getDisplayName()) {
    remoteParticipants[participantId].playerId = participant.getDisplayName()
  }
}

function onUserLeft(participantId, participant) {
  console.log(`onUserLeft, particpant: ${participantId}`, participant)
}

function onUserDisplayNameChanged(participantId, displayName) {
  console.log('onUserDisplayNameChanged', participantId, displayName)
  remoteParticipants[participantId].playerId = displayName
}

function onConnectionEstablished(callbacks, playerId) {
  console.log('onConnectionEstablished')
  
  const confOptions = {
    openBridgeChannel: true
  }
  conference = window.conference = connection.initJitsiConference(CONFERENCE_ROOM_NAME, confOptions)
  conference.setDisplayName(playerId)
  conference.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track) => { onTrackAdded(track, playerId, callbacks) })
  conference.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onTrackRemoved)
  conference.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined)
  conference.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, onConferenceLeft)
  conference.on(JitsiMeetJS.events.conference.CONFERENCE_ERROR, onConferenceError)
  conference.on(JitsiMeetJS.events.conference.CONFERENCE_FAILED, onConferenceFailed)
  conference.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined)
  conference.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft)
  conference.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, onUserDisplayNameChanged)
  
  conference.join()

}

function addLocalTracksToConference() {
  console.log('addLocalTracksToConference', conference)
  if (!conference) { return }
  for (let track of localTracks) {
    if (track.addedLocalTrackToConference) { next }
    conference.addTrack(track)
    track.addedLocalTrackToConference = true
  }
}

function onConnectionFailed(a) {
  console.log('onConnectionFailed', a)
}

function onConnectionDisconnected(a) {
  console.log('onConnectionDisconnected', a)
}

function onDeviceListChanged(a) {
  console.log('onDeviceListChanged', a)
}

async function initJitsiMeet(callbacks, playerId) {
  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR)

  const initOptions = {
    // disableAudioLevels: true,
      // The ID of the jidesha extension for Chrome.
    // desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',
      // Whether desktop sharing should be disabled on Chrome.
    // desktopSharingChromeDisabled: false,
      // The media sources to use when using screen sharing with the Chrome
      // extension.
    // desktopSharingChromeSources: [ 'screen', 'window' ],
      // Required version of Chrome extension
    // desktopSharingChromeMinExtVersion: '0.1',
      // Whether desktop sharing should be disabled on Firefox.
    // desktopSharingFirefoxDisabled: false
  }
  JitsiMeetJS.init() // initOptions
  const options = {
    hosts: {
        domain: 'meet.jit.si',
        muc: 'conference.meet.jit.si',
        focus: 'focus.meet.jit.si'
    },
    // disableSimulcast: false,
    // enableRemb: true,
    // resolution: 640,
    // constraints: {
    //   video: {
    //     height: {
    //       ideal: 320,
    //       max: 320,
    //       min: 160
    //     },
    //     width: {
    //       ideal: 320,
    //       max: 320,
    //       min: 160
    //     }
    //   }
    // },
    externalConnectUrl: 'https://meet.jit.si/http-pre-bind',
    enableP2P: true,
    p2p: {
      enabled: true,
      preferH264: true,
      disableH264: true,
      useStunTurn: true
    },
    useStunTurn: true,
    // serviceUrl: `https://meet.jit.si/http-bind?room=${CONFERENCE_ROOM_NAME}`,
    bosh: `https://meet.jit.si/http-bind?room=${CONFERENCE_ROOM_NAME}`,
    websocket: 'wss://meet.jit.si/xmpp-websocket',
    clientNode: 'http://jitsi.org/jitsimeet',
  }
  connection = new JitsiMeetJS.JitsiConnection(null, null, options)
  
  connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, () => {
    onConnectionEstablished(callbacks, playerId)
  })
  connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed)
  connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnected)
  JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged)

  try {
    await connection.connect()
    localTracks = await JitsiMeetJS.createLocalTracks({
      devices: [ 'audio', 'video' ],
      constraints: {}
    })
  } catch (err) {
    console.error('Connection error', err)
  }
  
  addLocalTracksToConference()

  for (let track of localTracks) {
    const type = track.getType()
    const id = `${type}-local`
    
    switch (type) {
      case 'video':
        const videoElement = callbacks.createVideoElement(playerId)
        videoElement.id = id
        // videoElement.autoplay = true
        // Don't echo local mic to local speakers
        // videoElement.muted = true
        // videoElement.volume = 0
        // window.track = track
        track.attach(videoElement)
        break
      case 'audio':
        const audioElement = document.createElement('audio')
        audioElement.id = id
        // document.body.appendChild(audioElement)
        track.attach(audioElement)
        break
      default:
        console.error("Don't know how to handle track of type", type)
        return
    }
    
    console.log('attached', type)
  }
}

function initializeAVChat(callbacks, playerId) {
  const intervalId = setInterval(() => {
    // Wait for JitsiMeetJS to be asynchronously, externally loaded
    if (window.JitsiMeetJS) {
      clearInterval(intervalId)
      JitsiMeetJS = window.JitsiMeetJS
      console.log('JitsiMeetJS found')
      initJitsiMeet(callbacks, playerId)
      return
    }
    console.log("Waiting for JitsiMeetJS")
  }, 200)
}

export { initializeAVChat }