<script>
  import { onMount } from 'svelte'
  import omit from 'just-omit'

  import { myJitsiParticipantIds } from '../svelte/stores.js'
  import Participant from './Participant.svelte'

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

  const userJoined = (participantId, participant) => {
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

  const trackAdded = (track) => {
    if (track.isLocal()) {
      console.log('trackAdded (local)', track)
      return
    }
    console.log('trackAdded', track)
    const participantId = track.getParticipantId()
  }

  const trackRemoved = (track) => {
    console.log('trackRemoved', track)
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
  }

  onMount(() => {
    if (conference) {
      console.log('Conference already exists, leaving')
      conference.leave()
    }
    conference = window.conference = connection.initJitsiConference(
      conferenceId,
      {
        openBridgeChannel: true,
      }
    )

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

  // $: switch (conferenceState) {
  //   case ConferenceState.CONNECTED:
  //     break
  //   default:
  // }
</script>

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

<div class="conference">
  <div class="header">{conferenceId}</div>
  <div class="state">{conferenceState}</div>
  <div class="state">My ID: {myParticipantId}</div>
  <div class="state">My Role: {myRole}</div>
  <div class="participants">
    {#each Object.values(participants) as participant}
      <Participant {participant} role={participantRoles[participant.getId()]} />
    {/each}
  </div>
</div>
