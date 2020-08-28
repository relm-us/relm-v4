<script>
  import { onMount } from 'svelte'
  import { config } from '../config.js'
  import { onInterval } from '../svelte/util.js'
  // import Conference from './Conference.svelte'

  // @type {Array<string>} conferenceIds - the unique name of the Jitsi conference (room) to join
  export let conferenceIds

  const ConnectState = {
    INITIAL: 'initial',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    FAILED: 'failed',
    DISCONNECTED: 'disconnected',
  }

  let connection
  let connectState = ConnectState.INITIAL

  const deviceListChanged = (devices) => {
    console.log(`deviceListChanged`, devices)
  }

  const permissionPrompt = (environmentType) => {
    console.log(`permissionPrompt`, environmentType)
  }

  const events = {
    CONNECTION_ESTABLISHED: () => (connectState = ConnectState.CONNECTED),
    CONNECTION_FAILED: () => (connectState = ConnectState.FAILED),
    CONNECTION_DISCONNECTED: () => (connectState = ConnectState.DISCONNECTED),

    DEVICE_LIST_CHANGED: deviceListChanged,
    PERMISSION_PROMPT_IS_SHOWN: permissionPrompt,

    WRONG_STATE: () => console.error('Jitsi Connection: Wrong State'),
  }

  onMount(() => {
    connection = new JitsiMeetJS.JitsiConnection(
      null,
      null,
      config.JITSI_CONFIG
    )

    for (const [eventName, fn] of Object.entries(events)) {
      connection.addEventListener(JitsiMeetJS.events.connection[eventName], fn)
    }

    connection.connect()
    connectState = ConnectState.CONNECTING
  })

  // If we fail to connect, retry until we succeed (if network conditions allow)
  // onInterval(() => {
  //   if (connectState === ConnectState.FAILED) {
  //     console.log('Trying to reconnect to Jitsi server...')
  //     connection.connect()
  //   }
  // }, 5000)
</script>

<style>
  .heading {
    font-size: 32px;
    font-weight: bold;
  }
  .conferences {
    margin: 15px 4px;
  }
  .conferences > .heading {
    font-size: 24px;
    font-weight: bold;
  }
  .connection {
    border: 2px solid #888;
    border-radius: 8px;
    padding: 8px 15px;
  }
  .status {
    font-size: 18px;
  }
  .state {
    font-weight: bold;
  }
  .config {
  }
</style>

<div class="connection">
  <div class="heading">Connection</div>
  <div class="status">
    Status:
    <span class="state">{connectState}</span>
  </div>
  <div class="conferences">
    <div class="heading">Conferences:</div>
    {#if connectState === ConnectState.CONNECTED}
      <!-- {#each conferenceIds as conferenceId}
        <Conference {connection} {conferenceId} />
      {/each} -->
    {/if}
  </div>
  <div class="heading">Config</div>
  <div class="config">
    <pre>{JSON.stringify(config.JITSI_CONFIG, null, 2)}</pre>
  </div>
</div>
