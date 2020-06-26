<script>
  import RightPanel from './RightPanel.svelte'
  import PressTabHelp from './PressTabHelp.svelte'

  import ThoughtBar from './ThoughtBar.svelte'
  import PadController from './PadController.svelte'
  import Upload from './Upload.svelte'
  import ExportImport from './ExportImport.svelte'
  import IdentityModal from './IdentityModal.svelte'
  import ChooseAvatar from './ChooseAvatar.svelte'

  export let start
  export let stage
  export let network

  let promise = start()
</script>

<!-- Add things that don't depend on start() -->
<RightPanel />
<PressTabHelp />

<!-- Add things that depend on start() -->
{#await promise}
  Waiting...
{:then}
  <ThoughtBar {stage} {network} />
  <PadController {stage} />
  <Upload {stage} {network} />
  <ExportImport {stage} {network} />
  <IdentityModal {stage} {network} />
  <ChooseAvatar {stage} />
{:catch err}
  {console.error(err)}
{/await}
