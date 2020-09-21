<script>
  import Welcome from './Welcome'
  // import EnterName from './EnterName.svelte'
  // import InitialMicCamSetup from './InitialMicCamSetup.svelte'
  import JoinWorld from './JoinWorld.svelte'

  export let start
  export let stage
  export let network

  const Screens = {
    WELCOME: { component: Welcome, next: () => Screens.JOIN_WORLD },
    // ENTER_NAME: EnterName,
    // INITIAL_MIC_CAM_SETUP: InitialMicCamSetup,
    JOIN_WORLD: { component: JoinWorld, next: null },
  }

  let screen = Screens.WELCOME

  function next() {
    if (screen.next) {
      screen = screen.next()
    } else {
      console.error("Next screen is null, can't visit next()")
    }
  }
</script>

{#if screen === Screens.JOIN_WORLD}
  <JoinWorld {start} {stage} {network} />
{:else}
  <svelte:component this={screen.component} {next} />
{/if}
