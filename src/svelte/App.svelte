<script>
  import { onMount } from 'svelte'

  import NameScreen from './introduction/NameScreen'
  import AvatarScreen from './introduction/AvatarScreen'
  import WelcomeScreen from './introduction/WelcomeScreen'
  // import InitialMicCamSetup from './InitialMicCamSetup.svelte'
  import JoinWorld from './JoinWorld.svelte'

  import { name, avatarVariant, agreeTos } from '/svelte/SettingsStore.js'

  export let start
  export let stage
  export let network

  let screen

  function getScreenFromSettings(name, avatarVariant, agreeTos) {
    if (name === null) {
      return NameScreen
    } else if (avatarVariant === null) {
      return AvatarScreen
    } else if (!agreeTos) {
      return WelcomeScreen
    } else {
      return JoinWorld
    }
  }

  $: screen = getScreenFromSettings($name, $avatarVariant, $agreeTos)
</script>

{#if screen === JoinWorld}
  <JoinWorld {start} {stage} {network} />
{:else}
  <svelte:component this={screen} />
{/if}
