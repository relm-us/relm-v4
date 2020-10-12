<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { localTracksStore, Mirror, canAutoPermit } from 'jitsi-svelte'

  import Checkbox from '../../../svelte/Checkbox'
  import DefaultScreen from '../DefaultScreen'
  import { skipCameraSetup } from '../../SettingsStore.js'

  const dispatch = createEventDispatcher()

  let transientSkipCameraSetup

  function done() {
    $skipCameraSetup = transientSkipCameraSetup
    dispatch('done')
  }

  onMount(async () => {
    transientSkipCameraSetup = $skipCameraSetup
    const autoPermit = await canAutoPermit()
    if (autoPermit && $skipCameraSetup) {
      const hasPermission = await localTracksStore.request()
      if (hasPermission) {
        dispatch('done')
      } else {
        $skipCameraSetup = false
      }
    } else {
      $skipCameraSetup = false
    }
  })
</script>

{#if !$skipCameraSetup}
  <DefaultScreen>
    <div class="mirror">
      <h1>Cam & Mic Setup</h1>
      <Mirror on:done={done} />
    </div>
    <div style="display:flex;justify-content:center">
      <Checkbox
        checked={transientSkipCameraSetup}
        onCheck={(checked) => (transientSkipCameraSetup = checked)}>
        Skip this review next time you join Relm
      </Checkbox>
    </div>
  </DefaultScreen>
{/if}

<style>
  .mirror {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
