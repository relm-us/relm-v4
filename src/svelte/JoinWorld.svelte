<script>
  import TopPanel from '././TopPanel.svelte'
  import PressTabHelp from './PressTabHelp.svelte'

  import ThoughtBar from './ThoughtBar.svelte'
  import PadController from './PadController.svelte'
  import Upload from './Upload.svelte'
  import ExportImport from './ExportImport.svelte'
  import IdentityModal from './IdentityModal.svelte'

  export let start
  export let stage
  export let network

  let promise = start()
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
