<script>
  import { onMount } from 'svelte'
  import { config } from '/config.js'

  import TopPanel from '././TopPanel.svelte'
  import PressTabHelp from './PressTabHelp.svelte'

  import ThoughtBar from './ThoughtBar.svelte'
  import PadController from './PadController.svelte'
  import Upload from './Upload.svelte'
  import ExportImport from './ExportImport.svelte'
  import IdentityModal from './IdentityModal.svelte'
  import Connection from '../audiovideo/Connection'

  export let start
  export let stage
  export let network

  let promise = start()

  onMount(() => {
    document.body.style = 'overflow: hidden'
    return () => {
      document.body.style = 'overflow: auto'
    }
  })
</script>

{#await promise}
  Waiting...
{:then}
  <PressTabHelp />
  <TopPanel {stage} />
  <ThoughtBar {stage} {network} />
  <PadController {stage} />
  <Upload {stage} {network} />
  <ExportImport {stage} {network} />
  <IdentityModal {stage} {network} />
  <Connection conferenceIds={[config.JITSI_CONFERENCE]} />
{:catch err}
  {console.error(err)}
{/await}

<style>
  /* :global(html),
  :global(body) {
    width: 100%;
    height: 100%;
  } */
  /* :global(body) {
    margin: 0px;
    background-color: #bbbbbb;
    overflow: hidden;
  } */
</style>
