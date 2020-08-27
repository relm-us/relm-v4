<script>
  import Connection from './audiovideo/Connection.svelte'
  import Video from './audiovideo/Video.svelte'

  const JitsiMeetJS = window.JitsiMeetJS

  let track
  let videoVisible = true

  const showVideo = () => {
    videoVisible = true
  }
  const hideVideo = () => {
    videoVisible = false
  }

  const joinConference = (name) => {}
</script>

<Connection conferenceIds={['relm-test']} />

{#if showVideo}
  <Video {track} />
{/if}

<button on:click={showVideo}>Show Video</button>
<button on:click={hideVideo}>Hide Video</button>
