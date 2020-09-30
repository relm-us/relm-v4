<script>
  import { spring } from 'svelte/motion'
  import omit from 'just-omit'

  import { localTracks } from '../LocalTrackStore.js'
  import { myParticipantIds } from '../ParticipantStore.js'

  import VideoCircle from '../VideoCircle'

  window.myParticipantIds = myParticipantIds

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

  // TODO: show conferenceState in for diagnostics (submenu somewhere?)
  let conferenceState = ConferenceState.INITIAL
  let conference = null

  let myParticipantId
  // TODO: let user see their own Jitsi role?
  let myRole
  let participants = {}
  let participantRoles = {}
  let localAudioLevelSpring = spring(0, {
    stiffness: 0.3,
    damping: 0.8,
  })

  let remoteTracks = {
    video: {},
    audio: {},
  }

  // Keep tracks that have been added to conference cached so we can remove them when needed
  let cachedLocalTracks = {
    video: null,
    audio: null,
  }

  /**
   * Event Handlers
   */

  function userJoined(participantId, participant) {
    console.log('userJoined', participantId, 'tracks', participant.getTracks())
    participants[participantId] = participant
    participantRoles[participantId] = participant.getRole()
  }

  function userLeft(participantId) {
    participants = omit(participants, [participantId])
    participantRoles = omit(participantRoles, [participantId])
  }

  function userRoleChanged(participantId, role) {
    if (participantId === myParticipantId) {
      myRole = role
    }
    // Other participants are handled by individual Participant components
  }

  function trackAdded(track) {
    console.log('trackAdded', track)
    assignRemoteTrack(track, track)
  }

  function trackRemoved(track) {
    console.log('trackRemoved', track)
    assignRemoteTrack(track, undefined)
  }

  function localStatsUpdated({ connectionQuality }) {
    console.log('connectionQuality', connectionQuality)
  }

  function trackAudioLevelChanged(audioLevel) {
    // Make small sounds more visible
    const level =
      audioLevel > 0 && audioLevel < 0.2 ? audioLevel * 4 + 0.1 : audioLevel
    localAudioLevelSpring.set(level * 100)
  }

  const events = {
    conference: {
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
    },
    connectionQuality: {
      LOCAL_STATS_UPDATED: localStatsUpdated,
    },
  }

  // Record tracks in `remoteTracks` object
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

  async function init(connection, conferenceId) {
    await deinit(conference)

    console.log(`Joining conference '${conferenceId}'...`)

    // Initialize the conference through the Jitsi connection we've been given
    conference = connection.initJitsiConference(conferenceId, {
      // TODO: switch to 'true' once Jitsi-side fix:
      //       https://community.jitsi.org/t/failed-to-parse-channel-message-as-json/78382
      openBridgeChannel: false,
    })

    // Record the ID we're given to identify "self"
    myParticipantId = conference.myUserId()

    // Record the ID for "self" in the global store, mapping it to this particular conference
    myParticipantIds.update((ids) =>
      Object.assign(ids, { [conferenceId]: myParticipantId })
    )

    // Add event listeners for each of the conference event types we care about
    for (const eventType of Object.keys(events)) {
      for (const [eventName, callback] of Object.entries(events[eventType])) {
        conference.addEventListener(
          JitsiMeetJS.events[eventType][eventName],
          callback
        )
      }
    }

    // Join the conference!
    conference.join()
    console.log(`Conference '${conferenceId}' joined.`)

    keepConferenceUpdatedRegardingTrackStore('video')
    keepConferenceUpdatedRegardingTrackStore(
      'audio',
      (track) => {
        track.addEventListener(
          JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
          trackAudioLevelChanged
        )
      },
      (track) => {
        track.removeEventListener(
          JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
          trackAudioLevelChanged
        )
      }
    )
  }

  async function deinit(conference) {
    if (!conference) {
      return
    }

    console.log(`Leaving conference '${conferenceId}'...`)

    // Add event listeners for each of the conference event types we care about
    for (const [eventName, fn] of Object.entries(events)) {
      conference.addEventListener(JitsiMeetJS.events.conference[eventName], fn)
    }

    // Leave the conference
    await conference.leave()
    console.log(`Left conference '${conferenceId}'.`)
  }

  function addTrackToConference(track, onTrackAdded) {
    if (!conference) {
      console.error(`Can't addTrackToConference: conference is null`)
      return
    }
    const trackType = track.getType()
    conference
      .addTrack(track)
      .then(() => {
        cachedLocalTracks[trackType] = track
        if (onTrackAdded) onTrackAdded(track, trackType)
      })
      .catch((err) => {
        console.warn(err)
      })
  }

  function removeTrackFromConference(track, onTrackRemoved) {
    if (!conference) {
      console.error(`Can't removeTrackFromConference: conference is null`)
      return
    }
    const trackType = track.getType()
    conference
      .removeTrack(track)
      .then(() => {
        delete cachedLocalTracks[trackType]
        if (onTrackRemoved) onTrackRemoved(track, trackType)
      })
      .catch((err) => {
        console.warn(err)
      })
  }

  function keepConferenceUpdatedRegardingTrackStore(
    trackType,
    onTrackAdded,
    onTrackRemoved
  ) {
    return localTracks.subscribe((tracks) => {
      const track = tracks[trackType]
      if (track) {
        addTrackToConference(track, onTrackAdded)
      } else {
        const cachedTrack = cachedLocalTracks[trackType]
        if (cachedTrack) {
          removeTrackFromConference(cachedTrack, onTrackRemoved)
        } else {
          console.warn(
            `localTracks changed, but could neither add nor remove track`,
            trackType,
            tracks
          )
        }
      }
    })
  }

  $: init(connection, conferenceId)
</script>

<div class="conference">
  <div class="participants">
    <VideoCircle
      participantId={myParticipantId}
      videoTrack={$localTracks.video}
      volume={$localAudioLevelSpring}
      mirror={true} />
    {#each Object.values(participants) as participant}
      <!-- <Participant {participant} /> -->
      <VideoCircle
        participantId={participant.getId()}
        videoTrack={remoteTracks.video[participant.getId()]}
        audioTrack={remoteTracks.audio[participant.getId()]} />
    {/each}
  </div>
</div>
