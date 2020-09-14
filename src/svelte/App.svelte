<script>
  import { onMount } from 'svelte'

  import NameScreen from './introduction/NameScreen'
  import AvatarScreen from './introduction/AvatarScreen'
  import WelcomeScreen from './introduction/WelcomeScreen'
  import CameraSetupScreen from './introduction/CameraSetupScreen'
  import JoinWorld from './JoinWorld.svelte'

  import { name, avatarVariant, agreeTos } from '/svelte/SettingsStore.js'

  export let start
  export let stage
  export let network

  let doneCameraSetup = false

  function handleCameraSetupDone() {
    console.log('handle cam done')
    doneCameraSetup = true
  }
</script>

{#if $name === null}
  <NameScreen />
{:else if $avatarVariant === null}
  <AvatarScreen />
{:else if !$agreeTos}
  <WelcomeScreen />
{:else}
  {#if !doneCameraSetup}
    <CameraSetupScreen on:done={handleCameraSetupDone} />
  {:else}
    <JoinWorld {start} {stage} {network} />
  {/if}
{/if}
