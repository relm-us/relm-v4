<script>
  import RightPanel from './RightPanel.svelte'
  import PressTabHelp from './PressTabHelp.svelte'
  
  import ThoughtBar from './ThoughtBar.svelte'
  import PadController from './PadController.svelte'
  import Upload from './Upload.svelte'
  import ExportImport from './ExportImport.svelte'
  import ChooseAvatar from './ChooseAvatar.svelte'
  
  export let start
  export let stage
  export let network
  
  console.log('promise = start()')
  let promise = start()
</script>

<!-- Add things that don't depend on start() -->
<RightPanel />
<PressTabHelp />

<!-- Add things that depend on start() -->
{#await promise}
  Waiting...
{:then}
  <ThoughtBar stage={ stage } network={ network } />
  <PadController stage={ stage } />
  <!-- <Upload stage={ stage } network={ network } /> -->
  <ExportImport stage={ stage } network={ network } />
  <ChooseAvatar stage={ stage } network={ network } />
{:catch err}
  {console.error(err)}
{/await}