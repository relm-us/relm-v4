let connection = null
let isJoined = false
let room = null

let localTracks = {}
const remoteMetadata = {}

let relmContext

function initRemoteParticipant(participantId, tracksAdded = 0) {
  if (!remoteMetadata[participantId]) {
    remoteMetadata[participantId] = {
      trackIndex: -1,
      playerId: null,
    }
  }
  remoteMetadata[participantId].trackIndex += tracksAdded
  return remoteMetadata[participantId]
}

function adjustVideoClasses(isVideo, isLocal, videoEl) {
  const circleEl = videoEl.parentElement
  if (isVideo) {
    if (isLocal) {
      // Local camera should appear "flipped" horizontally, like when looking in a mirror
      videoEl.classList.add('mirror')
    }
  } else {
    if (isLocal) {
      // Screen sharing does not mirror
      videoEl.classList.remove('mirror')
    }
  }
}

async function detachLocalTrack(type = 'audio') {
  // Dispose old audio element, if it exists
  if (localTracks[type]) {
    await localTracks[type].dispose()
    console.log(`disposing local ${type} track`)
  }
  localTracks[type] = null

  const prevAudioElement = document.getElementById(`local-${type}`)
  if (prevAudioElement) {
    prevAudioElement.remove()
  }
}

async function attachLocalTrack(track) {
  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
    (audioLevel) => console.log(`Audio Level local: ${audioLevel}`)
  )
  track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () =>
    console.log('Local track muted')
  )
  track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () =>
    console.log('Local track stopped')
  )
  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
    (deviceId) =>
      console.log(`Track audio output device was changed to ${deviceId}`)
  )

  switch (track.getType()) {
    case 'audio':
      console.log(`attach local audio track`, track)

      // FIXME: once you share desktop, you can't mute audio because we have double audio tracks
      localTracks.audio = track

      // Create new audio element
      const audioElement = relmContext.createAudioElement(relmContext.playerId)
      audioElement.id = 'local-audio'
      // audioElement.muted = true
      document.body.appendChild(audioElement)
      track.attach(audioElement)

      break

    case 'video':
      console.log(`attach local video track`, track)

      await detachLocalTrack('video')
      localTracks.video = track

      // Create new video element
      const videoElement = relmContext.createVideoElement(relmContext.playerId)
      videoElement.id = 'local-video'
      adjustVideoClasses(track.videoType === 'camera', true, videoElement)
      track.attach(videoElement)

      break

    default:
      console.warn(`Unknown track type, won't add: ${track.getType()}`, track)
  }
}

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
  for (const track of tracks) {
    attachLocalTrack(track)

    if (isJoined) {
      room.addTrack(track)
    }
  }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
  if (track.isLocal()) {
    return
  }
  const participantId = track.getParticipantId()

  const participant = initRemoteParticipant(participantId, 1)

  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
    (audioLevel) => console.log(`Audio Level remote: ${audioLevel}`)
  )
  track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () =>
    console.log('remote track muted')
  )
  track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () =>
    console.log('remote track stoped')
  )
  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
    (deviceId) =>
      console.log(`track audio output device was changed to ${deviceId}`)
  )
  if (relmContext.onMuteChanged) {
    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
      (track) => {
        relmContext.onMuteChanged(track, participant.playerId)
      }
    )
  }

  const id = participantId + track.getType() + participant.trackIndex

  switch (track.getType()) {
    case 'audio':
      console.log('create remote video audio', participantId, id, participant)
      const audioElement = relmContext.createAudioElement(participant.playerId)
      audioElement.id = id
      audioElement.autoplay = true
      document.body.appendChild(audioElement)
      track.attach(audioElement)
      break

    case 'video':
      console.log('create remote video track', participantId, id, participant)
      const videoElement = relmContext.createVideoElement(participant.playerId)
      if (videoElement) {
        // NOTE: no need to append videoElement, it has already been added to video bubble
        videoElement.id = id
        adjustVideoClasses(track.videoType === 'camera', false, videoElement)
        track.attach(videoElement)
      } else {
        console.warn("Can't create video element for remote player")
      }
      break

    default:
      console.error(`Can't create remote track of type ${track.getType()}`)
  }
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
  console.log('conference joined!')
  isJoined = true

  for (const track of Object.values(localTracks)) {
    console.log('onConferenceJoined add track', track)
    room.addTrack(track)
  }
}

function onUserJoined(participantId, participant) {
  console.log(
    `onUserJoined, particpant: ${participantId}`,
    participant,
    participant.getDisplayName()
  )
  initRemoteParticipant(participantId)
  if (participant.getDisplayName()) {
    remoteMetadata[participantId].playerId = participant.getDisplayName()
  }
}

/**
 *
 * @param id
 */
function onUserLeft(participant) {
  console.log('user left')
  if (!remoteMetadata[participant]) {
    return
  }
  const tracks = remoteMetadata[participant]

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].detach($(`#${id}${tracks[i].getType()}`))
  }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
  room = window.room = connection.initJitsiConference(relmContext.room, {
    openBridgeChannel: 'websocket',
  })

  // Set playerId as name so that others can connect video to game player
  room.setDisplayName(relmContext.playerId)

  room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack)
  room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track, a) => {
    console.log('track removed', track, a)
  })
  room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, (track) => {
    console.log(
      `${track.getType()} track changed muted status: ${track.isMuted()}`
    )
  })
  room.on(
    JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
    (userID, audioLevel) => {
      console.log(`audio level changed: ${audioLevel} (${userID})`)
    }
  )
  room.on(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, (userID) => {
    console.log(`dominant speaker changed: (${userID})`)
  })
  room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined)
  room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft)
  room.on(
    JitsiMeetJS.events.conference.MESSAGE_RECEIVED,
    (userID, text, ts) => {
      console.log(`message received: '${text}' (${userID}), ${ts}`)
    }
  )
  // room.on(JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED, () => {
  //   console.log(`endpoint message received`)
  // });
  room.on(
    JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
    (userID, displayName) => {
      console.log(`display name changed: '${displayName}' (${userID})`)
    }
  )
  room.on(JitsiMeetJS.events.conference.SUBJECT_CHANGED, (subject) => {
    console.log(`subject changed: '${subject}'`)
  })
  room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined)
  room.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, () =>
    console.log(`conference left`)
  )
  room.on(JitsiMeetJS.events.conference.USER_ROLE_CHANGED, (userID, role) => {
    console.log(`user role changed: '${role}' (${userID})`)
  })
  room.on(
    JitsiMeetJS.events.conference.USER_STATUS_CHANGED,
    (userID, status) => {
      console.log(`user status changed: '${status}' (${userID})`)
    }
  )
  room.on(JitsiMeetJS.events.conference.CONFERENCE_FAILED, (errorCode) => {
    console.error(`conference failed: error code ${errorCode}`)
  })
  room.on(JitsiMeetJS.events.conference.CONFERENCE_ERROR, (errorCode) => {
    console.error(`conference error: error code ${errorCode}`)
  })
  room.on(JitsiMeetJS.events.conference.KICKED, () => {
    console.error(`user has been kicked from conference`)
  })
  room.on(
    JitsiMeetJS.events.conference.START_MUTED_POLICY_CHANGED,
    (audioStartMuted, videoStartMuted) => {
      console.log(
        `'start muted' policy changed, audio: '${audioStartMuted}', video: (${videoStartMuted})`
      )
    }
  )
  room.on(JitsiMeetJS.events.conference.STARTED_MUTED, () => {
    console.log(`user started in muted state`)
  })
  room.on(
    JitsiMeetJS.events.conference.AUTH_STATUS_CHANGED,
    (isAuthEnabled, authIdentity) => {
      console.log(`auth status changed: ${isAuthEnabled} (${authIdentity})`)
    }
  )
  room.on(JitsiMeetJS.events.conference.TALK_WHILE_MUTED, () => {
    console.log(`user is talking while muted`)
  })
  room.on(JitsiMeetJS.events.conference.NO_AUDIO_INPUT, () => {
    console.log(`no audio input`)
  })
  room.on(JitsiMeetJS.events.conference.AUDIO_INPUT_STATE_CHANGE, () => {
    console.log(`audio input state changed`)
  })
  room.on(JitsiMeetJS.events.conference.NOISY_MIC, () => {
    console.log(`noisy mic`)
  })

  room.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () =>
    console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`)
  )

  // room.on(
  //   JitsiMeetJS.events.connectionQuality.LOCAL_STATS_UPDATED,
  //   (stats) => console.log(`connection quality local stats updated:`, stats)
  // );
  // room.on(
  //   JitsiMeetJS.events.connectionQuality.REMOTE_STATS_UPDATED,
  //   (userID, stats) => console.log(`connection quality remote stats updated (${userID}):`, stats)
  // );

  room.join()
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
  console.error('Connection Failed!')
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
  console.log('current devices', devices)
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
  console.log('disconnect!')
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess
  )
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed
  )
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect
  )
}

/**
 *
 */
function unload() {
  for (const track of Object.values(localTracks)) {
    track.dispose()
  }
  if (room) {
    room.leave()
  }
  connection.disconnect()
}

let isVideo = true

/**
 *
 */
async function switchVideo() {
  // eslint-disable-line no-unused-vars
  isVideo = !isVideo
  try {
    const tracks = await JitsiMeetJS.createLocalTracks({
      devices: [isVideo ? 'video' : 'desktop'],
    })
    console.log('switchVideo createLocalTracks', tracks)
    for (const track of tracks) {
      await attachLocalTrack(track, relmContext)
      room.addTrack(track)
    }
  } catch (error) {
    console.log(`Unable to switchVideo`, error)
    detachLocalTrack('video')
    isVideo = true
    return true
  }

  return isVideo
}

async function initJitsiMeet() {
  $(window).bind('beforeunload', unload)
  $(window).bind('unload', unload)

  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR)

  JitsiMeetJS.init({
    disableAudioLevels: true,
  })

  connection = new JitsiMeetJS.JitsiConnection(null, null, {
    hosts: {
      domain: 'meet.jit.si',
      muc: 'conference.meet.jit.si',
      focus: 'focus.meet.jit.si',
    },
    externalConnectUrl: 'https://meet.jit.si/http-pre-bind',
    enableP2P: true,
    p2p: {
      enabled: true,
      preferH264: true,
      disableH264: true,
      useStunTurn: true,
    },
    useStunTurn: true,
    bosh: `https://meet.jit.si/http-bind?room=${relmContext.room}`,
    websocket: 'wss://meet.jit.si/xmpp-websocket',
    clientNode: 'http://jitsi.org/jitsimeet',
  })

  connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess
  )
  connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed
  )
  connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect
  )
  connection.addEventListener(JitsiMeetJS.events.connection.WRONG_STATE, () =>
    console.error('jitsi connection WRONG_STATE')
  )

  JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged
  )
  JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.PERMISSION_PROMPT_IS_SHOWN,
    (environmentType) =>
      console.log(`permission prompt is shown (${environmentType})`)
  )

  connection.connect()

  const tracks = await JitsiMeetJS.createLocalTracks({
    devices: ['audio', 'video'],
  })
  onLocalTracks(tracks)

  // TODO: allow selecting sound output
  /*
  if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable("output")) {
    JitsiMeetJS.mediaDevices.enumerateDevices((devices) => {
      const audioOutputDevices = devices.filter(
        (d) => d.kind === "audiooutput"
      );

      // JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
      if (audioOutputDevices.length > 1) {
        $("#audioOutputSelect").html(
          audioOutputDevices
            .map((d) => `<option value="${d.deviceId}">${d.label}</option>`)
            .join("\n")
        );

        $("#audioOutputSelectWrapper").show();
      }
    });
  }
  */
}

function initializeAVChat(context) {
  relmContext = context

  console.log('initialized with chat room', relmContext.room)
  const intervalId = setInterval(() => {
    // Wait for JitsiMeetJS to be asynchronously, externally loaded
    if (window.JitsiMeetJS) {
      clearInterval(intervalId)
      JitsiMeetJS = window.JitsiMeetJS
      initJitsiMeet(relmContext)
      return
    }
  }, 200)
}

function muteAudio() {
  if (!localTracks.audio) {
    console.warn("Can't mute audio, localTrack.audio not available")
    return
  } else {
    localTracks.audio.mute()
  }
}

function unmuteAudio() {
  if (!localTracks.audio) {
    console.warn("Can't unmute audio, localTrack.audio not available")
    return
  } else {
    localTracks.audio.unmute()
  }
}

export { initializeAVChat, muteAudio, unmuteAudio, switchVideo }
