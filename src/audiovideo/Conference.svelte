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

  let participants = {}

  const userJoined = (participantId, participant) => {
    participants[participantId] = participant
  }

  const userLeft = (participantId) => {
    participants = omit(participants, [participantId])
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
    // USER_ROLE_CHANGED: userRoleChanged,
    // USER_STATUS_CHANGED: userStatusChanged,

    TRACK_ADDED: trackAdded,
    TRACK_REMOVED: trackRemoved,
  }

  onMount(() => {
    if (conference) {
      console.log('Conference already exists, leaving')
      conference.leave()
    }
    conference = connection.initJitsiConference(conferenceId, {
      openBridgeChannel: true,
    })

    for (const [eventName, fn] of Object.entries(events)) {
      conference.addEventListener(JitsiMeetJS.events.conference[eventName], fn)
    }

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
    width: 33%;
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
  <div class="participants">
    {#each Object.values(participants) as participant}
      <Participant {participant} />
    {/each}
  </div>
</div>
