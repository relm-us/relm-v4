<script>
  import { onMount } from 'svelte'

  import Dropzone from 'dropzone'

  import { showToast } from '../lib/Toast.js'
  import { config } from '../config.js'
  import { uuidv4 } from '../util.js'

  export let stage
  export let network

  // Don't look for 'dropzone' in HTML tags
  Dropzone.autoDiscover = false

  let previewsEl
  let uploadVisible = false

  onMount(async () => {
    const dropzone = new Dropzone(document.body, {
      url: config.SERVER_UPLOAD_URL,
      clickable: '#upload-button',
      previewsContainer: previewsEl,
      maxFiles: 1,
    })
    dropzone.on('addedfile', (file) => {
      uploadVisible = true
    })
    dropzone.on('error', async (dz, error, xhr) => {
      uploadVisible = false
      showToast(`Unable to upload: ${error.reason} (note: 2MB file size limit)`)
    })
    dropzone.on('success', async (dz, response) => {
      // Close the upload box automatically
      uploadVisible = false

      console.log('Uploaded file variants:', response.files)
      // Add the asset to the network so everyone can see it
      const uuid = uuidv4()
      let entity
      if ('png' in response.files || 'webp' in response.files) {
        const webp = config.SERVER_UPLOAD_URL + '/' + response.files.webp
        const png = config.SERVER_UPLOAD_URL + '/' + response.files.png

        const layer = Math.floor(Math.random() * 100)
        const position = stage.player.object.position
        network.permanents.create({
          type: 'decoration',
          uuid,
          goals: {
            position: {
              x: position.x,
              y: position.y + layer / 100,
              z: position.z,
            },
            asset: {
              url: webp,
              alt: png,
            },
          },
        })
        entity = await stage.awaitEntity({
          uuid,
          condition: (ent) => ent.mesh,
        })
      } else if ('gltf' in response.files) {
        const url = config.SERVER_UPLOAD_URL + '/' + response.files.gltf
        const position = stage.player.object.position
        network.permanents.create({
          type: 'thing3d',
          uuid,
          goals: {
            position: {
              x: position.x,
              y: position.y,
              z: position.z,
            },
            asset: { url },
          },
        })
        entity = await stage.awaitEntity({
          uuid,
          condition: (ent) => ent.child,
        })
      } else {
        const ext = /(?:\.([^.]+))?$/.exec(response.file)[1] || 'unknown'
        showToast(
          `Upload canceled. We don't know how to use files of type ${ext}`
        )
      }

      if (entity) {
        // The `normalize` step happens just once after loading
        entity.normalize()

        // Select the thing that was just uploaded
        stage.selection.select([entity])
      }
    })
    dropzone.on('complete', (a) => {
      dropzone.removeAllFiles()
    })

    document.addEventListener('paste', (event) => {
      const items = (event.clipboardData || event.originalEvent.clipboardData)
        .items
      for (let index in items) {
        const item = items[index]
        if (item.kind === 'file') {
          // adds the file to your dropzone instance
          dropzone.addFile(item.getAsFile())
        }
      }
    })
  })

  /*
   */
</script>

<div
  bind:this={previewsEl}
  class="dropzone dropzone-previews"
  class:hide={!uploadVisible}
  class:show={uploadVisible} />

<style>
  .show {
    display: block;
  }
  .hide {
    display: none;
  }
</style>
