

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
const remoteMetadata = {};

let onConnectionSuccessWithContext 

function initRemoteParticipant(participantId, tracksAdded = 0) {
  if (!remoteMetadata[participantId]) {
    remoteMetadata[participantId] = {
      trackIndex: -1,
      playerId: null
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

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks, context) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        const track = localTracks[i]

        track.addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        track.addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        track.addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        track.addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        if (track.getType() === 'video') {
            const videoElement = context.createVideoElement(context.playerId)
            videoElement.id = `localVideo${i}`
            adjustVideoClasses(track.videoType === 'camera', true, videoElement)
            track.attach(videoElement)
        } else {
            const audioElement = document.createElement('audio')
            audioElement.id = `localAudio${i}`
            // audioElement.muted = true
            document.body.appendChild(audioElement)
            track.attach(audioElement)
        }
        if (isJoined) {
            room.addTrack(track);
        }
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track, context) {
console.log(`onRemoteTrack (local? ${track.isLocal()})`, track.getType(), track.videoType)
    if (track.isLocal()) {
        return;
    }
    const participantId = track.getParticipantId();

    const participant = initRemoteParticipant(participantId, 1)

    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('remote track muted'));
    track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('remote track stoped'));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));
    if (context.onMuteChanged) {
      track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        (track) => {
          context.onMuteChanged(track, participant.playerId)
        }
      )
    } 
    
    const id = participantId + track.getType() + participant.trackIndex;

    if (track.getType() === 'video') {
      console.log('create remote video track', participantId, id, participant)
        const videoElement = context.createVideoElement(participant.playerId)
        if (videoElement) {
            // NOTE: no need to append videoElement, it has already been added to video bubble
            videoElement.id = id
            adjustVideoClasses(track.videoType === 'camera', false, videoElement)
            track.attach(videoElement)
        } else {
            console.warn("Can't createVideoElement for remote player")
        }
    } else {
        const audioElement = document.createElement('audio')
        audioElement.id = id
        audioElement.autoplay = true
        document.body.appendChild(audioElement)
        track.attach(audioElement)
    }


  
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('conference joined!');
    isJoined = true;
    for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
    }
}


function onUserJoined(participantId, participant) {
  console.log(`onUserJoined, particpant: ${participantId}`, participant, participant.getDisplayName())
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
    console.log('user left');
    if (!remoteMetadata[participant]) {
        return;
    }
    const tracks = remoteMetadata[participant];

    for (let i = 0; i < tracks.length; i++) {
        tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess(context) {
    room = window.room = connection.initJitsiConference(context.room, {
      openBridgeChannel: true
    });
    
    // console.log('onConnectionSuccess', room)
    room.room.on('xmpp.video_type', (a, b) => {
      console.log('xmpp.video_type', a, b)
    })
    room.xmpp.on('xmpp.video_type', (a, b) => {
      console.log('xmpp.video_type2', a, b)
    })
    
    // Set playerId as name so that others can connect video to game player
    room.setDisplayName(context.playerId)
    
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, track => onRemoteTrack(track, context));
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track, a) => {
      console.log('track removed', track, a)
    });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined);
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccessWithContext);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
}

let isVideo = true;

/**
 *
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
        devices: [ isVideo ? 'video' : 'desktop' ]
    })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('local track stoped'));
            
            const videoEl = document.getElementById('localVideo1')
            if (videoEl) {
              adjustVideoClasses(isVideo, true, videoEl)
              localTracks[1].attach(videoEl);
              room.addTrack(localTracks[1]);
            } else {
              console.warn("Can't add video track, 'localVideo1' video element not found", videoEl)
            }
        })
        .catch(error => console.log(error));
  return isVideo
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

async function initJitsiMeet(context) {
  $(window).bind('beforeunload', unload);
  $(window).bind('unload', unload);

  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

  JitsiMeetJS.init({
    disableAudioLevels: true
  });

  connection = new JitsiMeetJS.JitsiConnection(null, null, {
    hosts: {
        domain: 'meet.jit.si',
        muc: 'conference.meet.jit.si',
        focus: 'focus.meet.jit.si'
    },
    externalConnectUrl: 'https://meet.jit.si/http-pre-bind',
    enableP2P: true,
    p2p: {
      enabled: true,
      preferH264: true,
      disableH264: true,
      useStunTurn: true
    },
    useStunTurn: true,
    bosh: `https://meet.jit.si/http-bind?room=${context.room}`,
    websocket: 'wss://meet.jit.si/xmpp-websocket',
    clientNode: 'http://jitsi.org/jitsimeet',
  })
  
  onConnectionSuccessWithContext = () => {
    onConnectionSuccess(context)
  }

  connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccessWithContext);
  connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectionFailed);
  connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      disconnect);

  JitsiMeetJS.mediaDevices.addEventListener(
      JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
      onDeviceListChanged);

  connection.connect();

  JitsiMeetJS.createLocalTracks({ devices: [ 'audio', 'video' ] })
      .then(tracks => onLocalTracks(tracks, context))
      .catch(error => {
          throw error;
      });

  if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
      JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
          const audioOutputDevices
              = devices.filter(d => d.kind === 'audiooutput');

          if (audioOutputDevices.length > 1) {
              $('#audioOutputSelect').html(
                  audioOutputDevices
                      .map(
                          d =>
                              `<option value="${d.deviceId}">${d.label}</option>`)
                      .join('\n'));

              $('#audioOutputSelectWrapper').show();
          }
      });
  }
}


function initializeAVChat(context) {
  console.log('initialized with chat room', context.room)
  const intervalId = setInterval(() => {
    // Wait for JitsiMeetJS to be asynchronously, externally loaded
    if (window.JitsiMeetJS) {
      clearInterval(intervalId)
      JitsiMeetJS = window.JitsiMeetJS
      initJitsiMeet(context)
      return
    }
  }, 200)
}
  
function muteAudio() {
  if (!localTracks) {
    console.warn("Can't mute audio, localTracks not available")
    return
  }
  for (let track of localTracks) {
    if (track.getType() === 'audio') {
      track.mute()
    }
  }
}

function unmuteAudio() {
  if (!localTracks) {
    console.warn("Can't mute audio, localTracks not available")
    return
  }
  for (let track of localTracks) {
    if (track.getType() === 'audio') {
      track.unmute()
    }
  }
}
  
export {
  initializeAVChat,
  muteAudio,
  unmuteAudio,
  switchVideo,
}
