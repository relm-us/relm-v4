<script lang="ts">
  import { onMount } from 'svelte'
  import omit from 'just-omit'

  import { videoTrack, audioTrack } from './LocalTrackStore.js'
  import Participant from './Participant.svelte'
  import VideoCircle from './VideoCircle.svelte'

  export let connection
  export let conferenceId

  const ConferenceState = {
    INITIAL: 'initial',
    JOINED: 'joined',
    LEFT: 'left',
    FAILED: 'failed',
    ERROR: 'error',
    KICKED: 'kicked',
  }

  let conferenceState = ConferenceState.INITIAL
  let conference = null

  let myParticipantId
  let myRole
  let participants = {}
  let participantRoles = {}

  let remoteTracks = {
    video: {},
    audio: {},
  }

  const userJoined = (participantId, participant) => {
    console.log('userJoined', participantId, 'tracks', participant.getTracks())
    participants[participantId] = participant
    participantRoles[participantId] = participant.getRole()
  }

  const userLeft = (participantId) => {
    participants = omit(participants, [participantId])
    participantRoles = omit(participantRoles, [participantId])
  }

  const userRoleChanged = (participantId, role) => {
    if (participantId === myParticipantId) {
      myRole = role
    }
    // Other participants are handled by individual Participant components
  }

  function assignRemoteTrack(track, value) {
    if (track.isLocal()) {
      return
    }

    const participantId = track.getParticipantId()
    switch (track.getType()) {
      case 'video':
        remoteTracks['video'][participantId] = value
        break
      case 'audio':
        remoteTracks['audio'][participantId] = value
        break
    }
  }

  const trackAdded = (track) => {
    assignRemoteTrack(track, track)
  }

  const trackRemoved = (track) => {
    assignRemoteTrack(track, undefined)
  }

  const trackAudioLevelChanged = (participantId, audioLevel) => {
    // console.log('audio level', participantId, audioLevel)
  }

  const events = {
    CONFERENCE_JOINED: () => (conferenceState = ConferenceState.JOINED),
    CONFERENCE_LEFT: () => (conferenceState = ConferenceState.LEFT),
    CONFERENCE_FAILED: () => (conferenceState = ConferenceState.FAILED),
    CONFERENCE_ERROR: () => (conferenceState = ConferenceState.ERROR),
    KICKED: () => (conferenceState = ConferenceState.KICKED),

    USER_JOINED: userJoined,
    USER_LEFT: userLeft,
    USER_ROLE_CHANGED: userRoleChanged,

    TRACK_ADDED: trackAdded,
    TRACK_REMOVED: trackRemoved,
    TRACK_AUDIO_LEVEL_CHANGED: trackAudioLevelChanged,
  }

  onMount(() => {
    if (conference) {
      console.log('Conference already exists, leaving')
      conference.leave()
    }
    conference = connection.initJitsiConference(conferenceId, {
      // TODO: switch to 'true' once Jitsi-side fix:
      //       https://community.jitsi.org/t/failed-to-parse-channel-message-as-json/78382
      openBridgeChannel: false,
    })

    myParticipantId = conference.myUserId()

    for (const [eventName, fn] of Object.entries(events)) {
      conference.addEventListener(JitsiMeetJS.events.conference[eventName], fn)
    }

    conference.addEventListener(
      JitsiMeetJS.events.connectionQuality.LOCAL_STATS_UPDATED,
      ({ connectionQuality }) => {
        // avgAudioLevels: Object {  }
        // bandwidth: Object {  }
        // bitrate: Object { upload: 0, download: 0, audio: {…}, … }
        // bridgeCount: 1
        // codec: Object {  }
        // connectionQuality: 100
        // framerate: Object {  }
        // jvbRTT: undefined
        // localAvgAudioLevels: undefined
        // packetLoss: Object { total: 0, download: 0, upload: 0 }
        // resolution: Object {  }
        // serverRegion: "us-west-2"
        // transport: (1) […]
      }
    )

    conference.join()
  })

  let cachedLocalTracks = {
    video: null,
    audio: null,
  }

  function registerLocalTrack(track, cacheKey) {
    track.subscribe((track_) => {
      if (track_) {
        cachedLocalTracks[cacheKey] = track_
        conference.addTrack(track_)
      } else {
        const cachedTrack = cachedLocalTracks[cacheKey]
        if (cachedTrack) {
          conference.removeTrack(cachedTrack).then(() => {
            cachedLocalTracks[cacheKey] = null
          })
        }
      }
    })
  }

  registerLocalTrack(videoTrack, 'video')
  registerLocalTrack(audioTrack, 'audio')
</script>

<div class="conference">
  <div class="header">{conferenceId}</div>
  <div class="state">{conferenceState}</div>
  <div class="state">My ID: {myParticipantId}</div>
  <div class="state">My Role: {myRole}</div>
  <div class="participants">
    <VideoCircle
      participantId={myParticipantId}
      videoTrack={$videoTrack}
      mirror={true} />
    {#each Object.values(participants) as participant}
      <!-- <Participant {participant} /> -->
      <VideoCircle
        participantId={participant.getId()}
        videoTrack={remoteTracks['video'][participant.getId()]}
        audioTrack={remoteTracks['audio'][participant.getId()]} />
    {/each}
  </div>
</div>

<style>
  .conference {
    border: 2px solid #888;
    border-radius: 8px;
    overflow: hidden;
  }
  .header {
    font-weight: bold;
    background-color: sandybrown;
    padding: 8px 15px;
  }
  .state {
    padding: 8px 15px;
  }
</style>
