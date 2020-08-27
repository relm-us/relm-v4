<script>
  import { onMount } from 'svelte'
  import { config } from '../config.js'
  import { onInterval } from '../svelte/util.js'
  import Conference from './Conference.svelte'

  // @type {Array<string>} conferenceIds - the unique name of the Jitsi conference (room) to join
  export let conferenceIds

  let configVisible = false

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
    console.log('onMount new connection')
    connection = new JitsiMeetJS.JitsiConnection(
      null,
      null,
      config.JITSI_CONFIG
    )

    for (const [eventName, fn] of Object.entries(events)) {
      connection.addEventListener(JitsiMeetJS.events.connection[eventName], fn)
    }

    connectState = ConnectState.CONNECTING
    connection.connect()
  })

  // If we fail to connect, retry until we succeed (if network conditions allow)
  // onInterval(() => {
  //   if (connectState === ConnectState.FAILED) {
  //     console.log('Trying to reconnect to Jitsi server...')
  //     connection.connect()
  //   }
  // }, 5000)
</script>

<div class="connection">
  <h1>Connection</h1>
  <div class="status">
    Status:
    <span class="state">{connectState}</span>
  </div>
  <div class="conferences">
    <h2>Conferences:</h2>
    {#if connectState === ConnectState.CONNECTED}
      {#each conferenceIds as conferenceId}
        <Conference {connection} {conferenceId} />
      {/each}
    {/if}
  </div>
  <h2>Config</h2>
  {#if configVisible}
    <button on:click={() => (configVisible = false)}>Hide Config</button>
    <div class="config">
      <pre>{JSON.stringify(config.JITSI_CONFIG, null, 2)}</pre>
    </div>
  {:else}
    <button on:click={() => (configVisible = true)}>Show Config</button>
  {/if}
</div>

<style>
  h1 {
    font-size: 32px;
    font-weight: bold;
    margin: 0;
  }
  h2 {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }
  .connection {
    border: 2px solid #888;
    border-radius: 8px;
    padding: 8px 15px;
    margin-top: 15px;
  }
  .conferences {
    margin: 15px 4px;
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
