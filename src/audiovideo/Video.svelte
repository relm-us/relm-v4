<script>
  import { afterUpdate, onDestroy } from 'svelte'
  import { uuidv4 } from '../util.js'

  export let id = uuidv4()
  export let autoPlay = true
  // iOS needs this so the video doesn't automatically play full screen
  export let playsInline = true
  export let track = undefined
  export let mirror = false

  let attachedTrack
  let videoElement

  const detach = () => {
    const track = attachedTrack
    if (track && track.detach) {
      track.detach(videoElement)
    }
  }

  const attach = (track) => {
    if (track === attachedTrack) {
      return
    }
    if (attachedTrack) {
      detach()
    }
    if (track && track.attach) {
      attachedTrack = track
      track.attach(videoElement)
    }
  }

  onDestroy(detach)

  afterUpdate(() => {
    attach(track)
  })
</script>

<!-- Note:
  A number of video attributes are HTML "Boolean attributes", so to prevent the 
  attribute key from being rendered, Svelte needs the value to be `undefined` when false:
  - autoplay
  - playsinline
  - disablepictureinpicture
-->
<video
  bind:this={videoElement}
  class:mirror
  {id}
  autoPlay={autoPlay ? true : undefined}
  playsInline={playsInline ? true : undefined}
  disablePictureInPicture="" />

<style>
  video {
    object-fit: cover;
  }
  video.mirror {
    transform: rotateY(180deg);
  }
</style>
