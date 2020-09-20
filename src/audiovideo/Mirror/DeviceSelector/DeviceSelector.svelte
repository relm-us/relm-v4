<script>
  import { createEventDispatcher } from 'svelte'

  import { groupBy } from '../../avutil.js'
  import Select from './Select'
  
  import { deviceList, defaultDevices } from '../../DeviceListStore.js'

  export let selected = {}

  // DeviceSelector sends a 'selected' event when user selects anything
  const dispatch = createEventDispatcher()

  const kinds = ['videoinput', 'audioinput', 'audiooutput']
  const icons = {
    videoinput: '/video-enabled.svg',
    audioinput: '/audio-enabled.svg',
    audiooutput: '/speaker-icon.svg',
  }

  /**
   * Options are derived from deviceList: i.e. an object grouped by the kind of device:
   * {
   *   videoinput: [{ ... }, ...],
   *   audioinput: [{ ... }, ...],
   *   audiooutput: [{ ... }, ...],
   * }
   */
  let options = {}
  $: options = groupBy(
    $deviceList.map((input) => ({
      value: input.deviceId,
      label: input.label,
      kind: input.kind,
    })),
    'kind'
  )
</script>

{#each kinds as kind}
  <Select
    selected={selected[kind] || $defaultDevices[kind]}
    options={options[kind]}
    onSelect={(option) => {
      dispatch('selected', { kind, value: option.value })
    }}
    icon={icons[kind]} />
{/each}
