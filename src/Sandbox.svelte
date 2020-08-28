<script>
  import Connection from './audiovideo/Connection.svelte'
  import Video from './audiovideo/Video.svelte'
  // import Devices from './audiovideo/Devices.svelte'

  const JitsiMeetJS = window.JitsiMeetJS

  let track
  let videoVisible = true

  const showVideo = () => {
    videoVisible = true
  }
  const hideVideo = () => {
    videoVisible = false
  }
</script>

<Connection conferenceIds={['r2d2tst']} />

{#if showVideo}
  <Video {track} />
{/if}

<!-- <Devices /> -->

<button on:click={showVideo}>Show Video</button>
<button on:click={hideVideo}>Hide Video</button>
