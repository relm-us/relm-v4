<script>
  import NameScreen from './introduction/NameScreen'
  import AvatarScreen from './introduction/AvatarScreen'
  import WelcomeScreen from './introduction/WelcomeScreen'
  import CameraSetupScreen from './introduction/CameraSetupScreen'
  import JoinWorld from './JoinWorld.svelte'

  import { name, avatarVariant, agreeTos } from '/svelte/SettingsStore.js'
  import { connection } from '../connection.js'
  import { writable, derived } from 'svelte/store'

  export let start
  export let stage
  export let network

  const doneCameraSetup = writable(false)

  function handleCameraSetupDone() {
    console.log('handle cam done')
    doneCameraSetup.set(true)
  }

  derived(
    [doneCameraSetup, connection.conferencesStore],
    ([$doneCameraSetup, $conferences]) => {
      let conference = Object.values($conferences)[0] || null
      return { doneCameraSetup: $doneCameraSetup, conference }
    }
  ).subscribe(({ doneCameraSetup, conference }) => {
    if (conference) {
      conference.permitEntry(doneCameraSetup)
      console.log('permitEntry', doneCameraSetup)
    }
  })
</script>

{#if $name === null}
  <NameScreen />
{:else if $avatarVariant === null}
  <AvatarScreen />
{:else if !$agreeTos}
  <WelcomeScreen />
{:else}
  {#if !$doneCameraSetup}
    <CameraSetupScreen on:done={handleCameraSetupDone} />
  {:else}
    <JoinWorld {start} {stage} {network} />
  {/if}
{/if}
