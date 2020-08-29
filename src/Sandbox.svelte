<script>
  import Connection from './audiovideo/Connection.svelte'
  import Video from './audiovideo/Video.svelte'
  import Devices from './audiovideo/Devices.svelte'
  import Mirror from './audiovideo/Mirror.svelte'

  let track
  let videoVisible = false

  const showVideo = () => {
    videoVisible = true
  }
  const hideVideo = () => {
    videoVisible = false
  }
</script>

<Mirror />

<Devices />

<Connection conferenceIds={['relm-test']} />

{#if videoVisible}
  <Video {track} />
{/if}

<button on:click={showVideo}>Show Video</button>
<button on:click={hideVideo}>Hide Video</button>
