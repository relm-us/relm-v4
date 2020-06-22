
<script>
  import { onMount } from 'svelte'
  
  import Dropzone from 'dropzone'
  
  import { showToast } from '../lib/Toast.js'
  import { config } from '../config.js'
  import { uuidv4 } from '../util.js'
  
  export let stage
  export let network
  
  const cfg = config(window.location)
  
  // Don't look for 'dropzone' in HTML tags
  Dropzone.autoDiscover = false
  

  let previewsEl
  let uploadVisible = false
  
  onMount(async () => {
    console.log('Upload onMount', previewsEl)
    const dropzone = new Dropzone(document.body, {
      url: cfg.SERVER_UPLOAD_URL,
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
      if ('png' in response.files || 'webp' in response.files) {
        const webp = cfg.SERVER_UPLOAD_URL + '/' + response.files.webp
        const png = cfg.SERVER_UPLOAD_URL + '/' + response.files.png
        
        const layer = Math.floor(Math.random() * 100)
        const position = stage.player.object.position
        network.permanents.create({
          type: 'decoration',
          goals: {
            position: {
              x: position.x,
              y: position.y + (layer / 100),
              z: position.z,
            },
            asset: {
              url: webp,
              alt: png,
            },
          }
        })
      } else if ('gltf' in response.files) {
        const url = cfg.SERVER_UPLOAD_URL + '/' + response.files.gltf
        const uuid = uuidv4()
        const position = stage.player.object.position
        network.permanents.create({
          type: 'thing3d',
          uuid: uuid,
          goals: {
            position: {
              x: position.x,
              y: position.y,
              z: position.z,
            },
            asset: { url },
          },
        })
        const thing3d = await stage.awaitEntity({ uuid, condition: (entity) => entity.child })
        
        // The `normalize` step happens just once after loading
        thing3d.normalize()
          
        // Select the thing that was just uploaded
        stage.selection.select([thing3d])
          
        showToast(`Uploaded with scale normalized to ${parseInt(thing3d.goals.scale.get('x'), 10)}`)
      } else {
        const ext = /(?:\.([^.]+))?$/.exec(response.file)[1] || 'unknown'
        showToast(`Upload canceled. We don't know how to use files of type ${ext}`)
      }
    })
    dropzone.on('complete', (a) => {
      dropzone.removeAllFiles()
    })
  })
  

/*
  */
</script>

<div
  bind:this={ previewsEl }
  class="dropzone dropzone-previews"
  class:show={ uploadVisible }
/>
