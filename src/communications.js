console.log("communications has janus", Janus)
// console.log("communications has webrtc-adapter")

const server = 'https://janus.ayanarra.com/janus'
const sharedRoom = 1234
const opaqueId = 'ayanarra-' + Janus.randomString(12)

let janus
let audiobridge

/**
 * Polls for window.players.local to be ready, and when it
 * is, calls the callback with the local Player object.
 * 
 * @param {Function} callback 
 */
function pollUntilLocalPlayerReady (callback) {
  const intervalId = setInterval(() => {
    if (
      window.players && 
      window.players.local && 
      window.players.local.opts.name) {
      clearInterval(intervalId)
      callback(window.players.local)
    }
  }, 50)
}

function joinRoom(audiobridge, roomId, displayName) {
  audiobridge.send({"message": {
    "request": "join",
    "room": roomId,
    "display": displayName
  }});
}

function offerStreamToParticipants(audiobridge, participants) {
  audiobridge.createOffer({
    media: {
      video: false // This is an audio only room
    },
    success: function(jsep) {
      console.log("Got SDP!", jsep)
      const publish = {
        "request": "configure",
        "muted": false
      }
      audiobridge.send({"message": publish, "jsep": jsep});
    },
    error: function(error) {
      console.error('WebRTC error', error)
    }
  })
}

function findOrCreateAudioEl(tagId) {
  let audioEl = document.getElementById(tagId)
  if (audioEl === null) {
    // Create an audio element
    audioEl = document.createElement('audio')
    audioEl.tagId = tagId
    audioEl.setAttribute('autoplay', 'true')
    document.body.appendChild(audioEl)
  }
  return audioEl
}
function initialized() {
  console.log('Ayanarra says Janus is Initialized')

  const success = () => {
    console.log('Ayanarra says Janus succeeded')
    janus.attach({
      plugin: 'janus.plugin.audiobridge',
      opaqueId: opaqueId,
      onmessage: (msg, jsep) => {
        console.log('Ayanarra got plugin message', msg, jsep)
        const event = msg.audiobridge
        switch (event) {
          case 'joined':
            offerStreamToParticipants(audiobridge, msg.participants)
            break
          default:
            console.log("Ayanarra didn't handle message", event)
        }

        if(jsep !== undefined && jsep !== null) {
          Janus.debug("Handling SDP as well...");
          Janus.debug(jsep);
          audiobridge.handleRemoteJsep({jsep: jsep});
        }
      },
      success: (pluginHandle) => {
        audiobridge = pluginHandle

        console.log('Plugin attached!',
          audiobridge.getPlugin(),
          audiobridge.getId()
        )

        pollUntilLocalPlayerReady((player) => {
          // This is the message that either creates the room
          // or joins it if it already exists
          joinRoom(audiobridge, sharedRoom, player.opts.name)
        })
      },
      consentDialog: (on) => {
        console.log('consent dialog should be', on)
      },
      onlocalstream: (stream) => {
        console.log('got local stream', stream)
      },
      onremotestream: (stream) => {
        const roomAudioEl = findOrCreateAudioEl('roomaudio')
        Janus.attachMediaStream(roomAudioEl, stream)
      },
      oncleanup: () => {
        console.log('Ayanarra says Janus plugin is cleaning up')
      }
    })
  }

  const error = (err) => {
    console.error('Ayanarra says Janus failed', err)
  }

  const destroyed = () => {
    console.log('Ayanarra says Janus was destroyed')
  }

  janus = new Janus({ server, success, error, destroyed })
}

Janus.init({debug: 'all', callback: initialized})