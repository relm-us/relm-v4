<script>
  import Connection from './audiovideo/Connection.svelte'
  import Video from './audiovideo/Video.svelte'
  import Mirror from './audiovideo/Mirror.svelte'
</script>

<Mirror />
<Connection conferenceIds={['relm-test']} />
