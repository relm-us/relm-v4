<script>
  import { onMount } from 'svelte'

  export let participant
  // export let role

  const conference = participant.getConference()

  const id = participant.getId()

  let jid
  let name
  let role
  let statsID
  let connectionStatus
  let tracks
  let properties = {}
  let audioMuted
  let videoMuted
  let videoMutedWebRTC

  // let featuresPromise

  const refresh = () => {
    jid = participant.getJid()
    name = participant.getDisplayName()
    role = participant.getRole()
    statsID = participant.getStatsID()
    connectionStatus = participant.getConnectionStatus()
    tracks = participant.getTracks()
    properties = participant._properties
    audioMuted = participant.isAudioMuted()
    videoMuted = participant.isVideoMuted()
    videoMutedWebRTC = participant.hasAnyVideoTrackWebRTCMuted()

    // featuresPromise = participant.getFeatures()
  }

  refresh()

  const connectionStatusChanged = (participantId, status) => {
    if (participantId === id) {
      connectionStatus = status
    }
  }

  const roleChanged = (participantId, newRole) => {
    if (participantId === id) {
      role = newRole
    }
  }

  let events = {
    PARTICIPANT_CONN_STATUS_CHANGED: connectionStatusChanged,
    USER_ROLE_CHANGED: roleChanged,
  }

  onMount(() => {
    for (const [eventName, fn] of Object.entries(events)) {
      conference.addEventListener(JitsiMeetJS.events.conference[eventName], fn)
    }
    return () => {
      for (const [eventName, fn] of Object.entries(events)) {
        conference.removeEventListener(
          JitsiMeetJS.events.conference[eventName],
          fn
        )
      }
    }
  })
</script>

<div class="participant">
  <div class="field identifier">
    <div class="key">ID</div>
    <div class="value">{id}</div>
  </div>
  <div class="field identifier">
    <div class="key">JID</div>
    <div class="value">{jid}</div>
  </div>
  <div class="field other">
    <div class="key">Name</div>
    <div class="value">
      {#if name}
        <span class="name">{name}</span>
      {:else}
        <span class="no-name">[Anonymous]</span>
      {/if}
    </div>
  </div>
  <div class="field other">
    <div class="key">Role</div>
    <div class="value">{role}</div>
  </div>
  <div class="field other">
    <div class="key">StatsID</div>
    <div class="value">{statsID}</div>
  </div>
  <div class="field other">
    <div class="key">Connection Status</div>
    <div class="value">{connectionStatus}</div>
  </div>
  <div class="field other">
    <div class="key">Tracks</div>
    <div class="value">{JSON.stringify(tracks.map((t) => t.getType()))}</div>
  </div>
  <div class="field other">
    <div class="key">Properties</div>
    <div class="value">{JSON.stringify(properties)}</div>
  </div>
  <div class="field other">
    <div class="key">Audio Muted</div>
    <div class="value">{audioMuted ? 'yes' : 'no'}</div>
  </div>
  <div class="field other">
    <div class="key">Video Muted</div>
    <div class="value">{videoMuted ? 'yes' : 'no'}</div>
  </div>

  <div class="buttons">
    <button on:click={refresh}>Refresh</button>
  </div>
</div>

<style>
  .participant {
    border-top: 2px solid #888;
  }
  .field {
    display: flex;
    margin: 4px 15px;
  }
  .key {
    font-weight: bold;
  }
  .value {
    padding-left: 15px;
    word-wrap: anywhere;
  }
  .buttons {
    display: flex;
    justify-content: center;
  }
  button {
    margin: 8px;
    padding: 4px 8px;
  }
</style>
