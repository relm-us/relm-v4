

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

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks, context) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        if (localTracks[i].getType() === 'video') {
            const videoElement = context.createVideoElement(context.playerId)
            videoElement.id = `localVideo${i}`
            videoElement.classList.add('mirror')
            localTracks[i].attach(videoElement)
            
            // $('body').append(`<video autoplay='1' id='localVideo${i}' />`);
            // localTracks[i].attach($(`#localVideo${i}`)[0]);
        } else {
            const audioElement = document.createElement('audio')
            audioElement.id = `localAudio${i}`
            // audioElement.muted = true
            document.body.appendChild(audioElement)
            localTracks[i].attach(audioElement)
            
            // $('body').append(
            //     `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
            // localTracks[i].attach($(`#localAudio${i}`)[0]);
        }
        if (isJoined) {
            room.addTrack(localTracks[i]);
        }
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track, context) {
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
            track.attach(videoElement)
        } else {
            console.warn("Can't createVideoElement for remote player")
        }
        
        // $('body').append(
        //     `<video autoplay='1' id='${participant}video${idx}' />`);
    } else {
        const audioElement = document.createElement('audio')
        audioElement.id = id
        audioElement.autoplay = true
        document.body.appendChild(audioElement)
        track.attach(audioElement)
        
        // $('body').append(
        //     `<audio autoplay='1' id='${participant}audio${idx}' />`);
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
    room = connection.initJitsiConference(context.room, {
      openBridgeChannel: true
    });
    
    // Set playerId as name so that others can connect video to game player
    room.setDisplayName(context.playerId)
    
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, track => onRemoteTrack(track, context));
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
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
            localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);
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
