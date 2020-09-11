<script>
  import Connection from './audiovideo/Connection.svelte'
  import Video from './audiovideo/Video.svelte'
  import Mirror from './audiovideo/Mirror.svelte'
  // import DeviceSelector from './audiovideo/DeviceSelector.svelte'

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
<!-- <DeviceSelector /> -->

<!-- <Connection conferenceIds={['relm-test']} /> -->

{#if videoVisible}
  <Video {track} />
{/if}

<button on:click={showVideo}>Show Video</button>
<button on:click={hideVideo}>Hide Video</button>
