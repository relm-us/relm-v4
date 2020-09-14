<script>
  import { onMount } from 'svelte'

  import { config } from '../../config.js'
  // import { onInterval } from '../../svelte/util.js'

  import Conference from '../Conference'

  import connectingIcon from './images/connecting.svg'
  import connectedIcon from './images/connected.svg'
  import connectionFailedIcon from './images/connection-failed.svg'

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
  <div class="status">
    {#if connectState === ConnectState.CONNECTING}
      <img src={connectingIcon} alt="Connecting..." />
    {:else if connectState === ConnectState.CONNECTED}
      <img src={connectedIcon} alt="Connected." />
    {:else if connectState === ConnectState.FAILED}
      <img src={connectionFailedIcon} alt="Connection Failed." />
    {:else}.{/if}
  </div>
  <div class="conferences">
    {#if connectState === ConnectState.CONNECTED}
      {#each conferenceIds as conferenceId}
        <Conference {connection} {conferenceId} />
      {/each}
    {/if}
  </div>
  {#if false}
    <h2>Config</h2>
    {#if configVisible}
      <button on:click={() => (configVisible = false)}>Hide Config</button>
      <div class="config">
        <pre>{JSON.stringify(config.JITSI_CONFIG, null, 2)}</pre>
      </div>
    {:else}
      <button on:click={() => (configVisible = true)}>Show Config</button>
    {/if}
  {/if}
</div>

<style>
  .status {
    position: fixed;
    top: 0;
    right: 16px;
  }

  .status img {
    width: 64px;
  }
</style>
