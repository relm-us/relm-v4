import stampit from 'stampit'

import Dropzone from 'dropzone'
import { DOMReady } from './domready.js'
import { addManifestTo } from './manifest_loaders.js'
import { guestNameFromPlayerId, avatarOptionFromPlayerId, avatarOptionsOfGender } from './avatars.js'
import { Security } from './security.js'
import { initializeAVChat, muteAudio, unmuteAudio } from './avchat.js'
import { normalizeWheel } from './lib/normalizeWheel.js'
import { setWouldSelectObject, selectObject, selectedObject } from './selection.js'
import { showToast, showPrevioustToast } from './lib/Toast.js'

import { Entity, stage, network } from './entity.js'
import { HasObject } from './has_object.js'
import { HasLabel } from './has_label.js'
import { FollowsTarget } from './follows_target.js'
import { KeyboardController } from './keyboard_controller.js'
import { CameraController } from './camera_controller.js'
import { HasAnimationMixer } from './has_animation_mixer.js'
import { WalksWhenMoving } from './walks_when_moving.js'
import { HasThoughtBubble } from './has_thought_bubble.js'
import { HasVideoBubble } from './has_video_bubble.js'
import { HasOpacity } from './has_opacity.js'
import { HasOffscreenIndicator } from './has_offscreen_indicator.js'
import { AwarenessGetsState, AwarenessSetsState } from './network_awareness.js'
import { LocalstoreGetsState, localstoreRestoreState } from './localstore_gets_state.js'
import { MousePointer, OtherMousePointer } from './mouse_pointer.js'
import { Decoration } from './decoration.js'
import { Teleportal } from './teleportal.js'
import { InteractionDiamond } from './interaction_diamond.js'
import { Component } from './component.js'
import { uuidv4 } from './util.js'
import config from './config.js'
import { PadController } from './pad_controller.js'
import { stateToObject } from './state_to_object.js'

import "toastify-js/src/toastify.css"
import { HasUniqueColor } from './has_unique_color.js'
import { Thing3D } from './thing3d.js'
import { UpdatesLabelToUniqueColor } from './updates_label_to_unique_color.js'

const IMAGE_FILETYPE_RE = /\.(png|gif|jpg|jpeg)$/
const GLTF_FILETYPE_RE = /\.(gltf|glb)$/

const cfg = config(window.location)
const decorationLayerThickness = 0.01
let decorationLayer = 0
let mostRecentlyCreatedObjectId = null

// Don't look for 'dropzone' in HTML tags
Dropzone.autoDiscover = false

const showInfoAboutObject = (entity) => {
  const p = entity.object.position
  const infos = [
    `type: ${entity.type}`,
    `uuid: ${entity.uuid}`,
    `position: {x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)}, z: ${p.y.toFixed(1)}}`,
  ]
  
  if (entity.state.url) {
    // portals have url
    const url = entity.state.url.now
    infos.push(`url: <a href="${url}" style="color:white">${url}</a>`)
  } else if (entity.state.asset) {
    const url = entity.state.asset.now.url
    infos.push(`url: <a href="${url}" style="color:white">${url}</a>`)
  } else if (entity.state.link) {
    const url = entity.state.link.now || '[not set]'
    infos.push(`url: <a href="${url}" style="color:white">${url}</a>`)
  }
  
  if (entity.getScale) {
    const scale = entity.getScale()
    infos.push(`scale: ${scale.toFixed(1)}`)
  }
  
  if (entity.getRotation) {
    const rotation = entity.getRotation() / -THREE.Math.DEG2RAD
    infos.push(`rotation: ${rotation.toFixed(1)}`)
  }
  
  const isLockable = !!entity.isUiLocked
  if (isLockable) {
    const locked = entity.isUiLocked() ? 'locked' : 'unlocked'
    infos.push(`locked: ${locked}`)
  }
  
  showToast(infos.join('<br>'))
}

const security = Security()

const Player = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasVideoBubble,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
  HasUniqueColor,
  UpdatesLabelToUniqueColor,
  // This is how the player sends updates
  AwarenessGetsState,
  LocalstoreGetsState,
{
  name: 'Player',
})

const OtherPlayer = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasVideoBubble,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
  HasUniqueColor,
  UpdatesLabelToUniqueColor,
  HasOffscreenIndicator,
  // This is how OtherPlayers get updates
  AwarenessSetsState,
{
  name: 'OtherPlayer'
})

const start = async () => {
  // We first add all resources from the manifest so that the progress
  // bar can add up all the resource's sizes. The actual loading doesn't
  // happen until we `enqueue` and `load`.
  addManifestTo(resources)
  
  // Stage 1 Resource Load: Bare essentials
  resources.enqueue(['people', 'interact', 'sparkle', 'marble'])
  await resources.load()

  stage.setGroundTexture(resources.get('marble'))
  window.addEventListener('resize', _ => stage.windowResized(window.innerWidth, window.innerHeight))
  stage.start()


  await DOMReady()
  
  let playersCentroid = new THREE.Vector3()
  let occasionalUpdate = 0
  const sortByZ = (a, b) => (a.object.position.z - b.object.position.z)
  
  // Perform several calculations once per game loop:
  // 1. (occasionally) Refresh videoBubble diameter
  // 2. Calculate centroid of all players on stage
  // 3. Sort players by Z order
  stage.addUpdateFunction((delta) => {
    occasionalUpdate++

    // Double-count the player's position so that the camera prefers player slightly
    let playerCount = 1
    playersCentroid.copy(player.object.position)   
    // TODO: make this filter for 'HasVideoBubble' instead of just looking for players
    stage.forEachEntityOnStageOfType('player', (player, i) => {
      // Occasionally refresh videoBubble diameter due to new players
      // entering scene and needing size adjusted to zoom level
      if (occasionalUpdate % 100 === 0) {
        player.videoBubble.object.setDiameter(stage.fov)
      }
      
      // Add player positions and keep track of count so we can divide by
      // number of players after the loop (to get average/centroid position)
      playersCentroid.add(player.object.position)
      playerCount++
      
      // Sort the visible players by Z order
      const el = player.videoBubble.object.domElement
      if (el) { el.style.zIndex = i + 1 }
    }, sortByZ)
    
    // Finalize player centroid calculation
    playersCentroid.divideScalar(playerCount)
  })
    
  // Mouse wheel zooms in and out
  document.addEventListener('wheel', function(event) {
    if (event.target.id === 'game') {
      let pixelY = normalizeWheel(event.deltaY)
      const newFov = stage.fov - pixelY
      stage.setFov(newFov)
      
      stage.forEachEntityOnStageOfType('player', player => {
        player.videoBubble.object.setDiameter(stage.fov)
      })
    }
  })

  // The stage is special in that it creates a domElement that must be added to our page
  document.getElementById('game').appendChild(stage.renderer.domElement)
  
  document.getElementById('upload-button').addEventListener('mousedown', (event) => {
    event.preventDefault()
  })
  const previews = document.getElementById('previews')
  const dropzone = new Dropzone(document.body, {
    url: cfg.SERVER_UPLOAD_URL,
    clickable: '#upload-button',
    previewsContainer: '#previews',
    maxFiles: 1,
  })
  dropzone.on('addedfile', (file) => {
    previews.classList.add('show')
  })
  dropzone.on('error', async (dz, error, xhr) => {
    previews.classList.remove('show')
    showToast(`Unable to upload: ${error.reason} (note: 2MB file size limit)`)
  })
  dropzone.on('success', async (dz, response) => {
    // Close the upload box automatically
    previews.classList.remove('show')
    
    decorationLayer += decorationLayerThickness
    // Add the decoration to the network so everyone can see it
    const url = cfg.SERVER_UPLOAD_URL + '/' + response.file
    mostRecentlyCreatedObjectId = uuidv4()
    console.log('mostRecentlyCreatedObjectId', mostRecentlyCreatedObjectId)
    
    if (response.file.match(IMAGE_FILETYPE_RE)) {
      network.setState(mostRecentlyCreatedObjectId, {
        type: 'decoration',
        position: {
          x: player.state.position.now.x,
          y: player.state.position.now.y + decorationLayer, // a little above the ground
          z: player.state.position.now.z,
        },
        asset: {
          id: response.id,
          url: url,
        },
        imageScale: 1.0,
        orientation: 0,
      })
    } else if (response.file.match(GLTF_FILETYPE_RE)) {
      // Load it before adding to the network so we can normalize the scale
      const thing3d = Thing3D({
        uuid: uuidv4(), // need to create
        type: 'thing3d',
        position: {
          x: player.state.position.now.x,
          y: player.state.position.now.y,
          z: player.state.position.now.z,
        },
        asset: {
          id: response.id,
          url: url,
        },
        scale: 1.0,
      })
      // The `normalize` step happens just once after loading
      thing3d.once('loaded', () => {
        thing3d.normalize()
        network.setEntity(thing3d)
        
        // Select the thing that was just uploaded
        setWouldSelectObject(thing3d)
        selectObject()
        
        showToast(`Uploaded with scale normalized to ${parseInt(thing3d.state.scale.target, 10)}`)
      }) 
      stage.add(thing3d)
    } else {
      const ext = /(?:\.([^.]+))?$/.exec(response.file)[1] || 'unknown'
      showToast(`Upload canceled. We don't know how to use files of type ${ext}`)
    }
  })
  dropzone.on('complete', (a) => {
    console.log('file upload complete', a)
    dropzone.removeAllFiles()
  })

  // The player!
  const playerId = await security.getOrCreateId()
  const player = window.player = Player({
    uuid: playerId,
    type: 'player',
    label: guestNameFromPlayerId(playerId),
    animationMeshName: avatarOptionFromPlayerId(playerId).avatarId,
    speed: 250,
    followTurning: true,
    animationSpeed: 1.5,
    labelOffset: { x: 0, y: 0, z: 60 },
    videoBubbleOffset: {x: 0, y: 0, z: -240 },
    animationResourceId: 'people',
    lsKey: 'player'
  })
  localstoreRestoreState('player', player)
  if (cfg.LANDING_COORDS) {
    player.state.position.target.copy(cfg.LANDING_COORDS)
  }
  // Warp the player to their 'saved' location, if any
  player.warpToPosition(player.state.position.target)
  // Restore to fully opaque, in case we were saved in a translucent state
  player.state.opacity.target = 1.0
  stage.add(player)
  
  player.videoBubble.object.on('mute', muteAudio)
  player.videoBubble.object.on('unmute', unmuteAudio)
  
  const padController = PadController({ type: 'pad', target: player })
  const controlPadEl = document.getElementById('control-pad')
  // controlPadEl.addEventListener('mousemove', (event) => {
  //   const rect = controlPadEl.getBoundingClientRect()
  //   const x = (event.layerX - rect.width / 2) / (rect.width/2)
  //   const y = (event.layerY - rect.height / 2) / (rect.height/2)
  //   const position = new THREE.Vector3(x * 100, 0, y * 100)
  //   padController.padDirectionChanged(position)
  // })
  // controlPadEl.addEventListener('mouseleave', (event) => {
  //   padController.padDirectionChanged(new THREE.Vector3())
  // })
  const onTouchEvent = (event) => {
    const rect = controlPadEl.getBoundingClientRect()
    const touchX = event.targetTouches[0].clientX - rect.x
    const touchY = event.targetTouches[0].clientY - rect.y
    const x = (touchX - rect.width / 2) / (rect.width/2)
    const y = (touchY - rect.height / 2) / (rect.height/2)
    const position = new THREE.Vector3(x * 100, 0, y * 100)
    padController.padDirectionChanged(position)
  }
  controlPadEl.addEventListener('touchstart', onTouchEvent)
  controlPadEl.addEventListener('touchmove', onTouchEvent)
  controlPadEl.addEventListener('touchend', (event) => {
    padController.padDirectionChanged(new THREE.Vector3())
  })
  controlPadEl.addEventListener('touchcancel', (event) => {
    padController.padDirectionChanged(new THREE.Vector3())
  })
  stage.add(padController)
  
  const mousePointer = window.mousePointer = MousePointer({
    type: 'mouse',
    awarenessUpdateFrequency: 2,
    colorSource: player
  })
  stage.add(mousePointer)
  
  let dragLock = false
  let dragStart = false
  let dragStartPos = null
  let dragStartObjectPos = new THREE.Vector3()
  let dragDelta = new THREE.Vector3()
  window.addEventListener('mousemove', (event) => {
    // Show mouse pointer
    mousePointer.setScreenCoords(event.clientX, event.clientY)
    
    // If mouse has moved a certain distance since clicking, then turn into a "drag"
    if (dragStart && !dragLock) {
      const isect = mousePointer.getIntersectsGround()
      if (isect.length > 0) {
        const mousePos = isect[0].point
        if (mousePos.distanceTo(dragStartPos) > 10) {
          dragLock = true
          // console.log('dragLock true', mousePos)
        }
      }
    }
    
    if (dragLock) {
      const isect = mousePointer.getIntersectsGround()
      if (isect.length > 0) {
        dragDelta.copy(isect[0].point)
        dragDelta.sub(dragStartPos)
        // console.log('mouseDelta', dragDelta)
        
        if (selectedObject) {
          selectedObject.disableFollowsTarget()
          dragDelta.add(dragStartObjectPos)
          selectedObject.object.position.copy(dragDelta)
          selectedObject.state.position.now.copy(dragDelta)
          selectedObject.state.position.target.copy(dragDelta)
          network.setEntity(selectedObject)
        }
      }
    }
  })
  
  window.addEventListener('mousedown', (event) => {
    if (event.target.id !== 'game' && event.target.id !== 'glcanvas') { return }
    
    // Selects whatever the most recent 'mousemove' event got us closest to
    const isect = mousePointer.intersects
    if (isect.length === 0) {
      setWouldSelectObject(null)
    } else {
      const entity = isect[0].entity
      setWouldSelectObject(entity)
      
    }
    selectObject()
    
    // This might be the beginning of a drag & drop sequence, so prep for that possibility
    const isect2 = mousePointer.getIntersectsGround()
    if (isect2.length > 0 && selectedObject) {
      const isLocked = selectedObject.isUiLocked && selectedObject.isUiLocked()
      if (!isLocked) {
        dragStart = true
        dragStartPos = isect2[0].point
        dragStartObjectPos.copy(selectedObject.object.position)
      }
    }
  })
  
  window.addEventListener('mouseup', (event) => {
    const entity = selectedObject
    if (entity) {
      // If we disabled FollowsTarget during drag/drop, re-enable it
      if (entity.enableFollowsTarget) {
        entity.enableFollowsTarget()
      }
      // If we didn't drag/drop the entity, call its onClick
      if (!dragLock && entity && entity.onClick) {
        entity.onClick()
      }
    }
    dragStart = false
    dragLock = false
  })


  network.on('connect', (uuid, state) => {
    const entity = stage.entities[uuid]
    switch(state.type) {
      case 'player':
        entity.setOpacity(1.0)
        entity.showVideoBubble()
        entity.showOffscreenIndicator()
        break
      case 'mouse':
        entity.showSphere()
        entity.showRing()
        break
      default:
        console.warn('"connect" issued for unhandled type', uuid, state)
    }
  })
  
  network.on('disconnect', (uuid, state) => {
    const entity = stage.entities[uuid]
    switch(state.type) {
      case 'player':
        entity.setOpacity(0.2)
        entity.hideVideoBubble()
        entity.setThought(null)
        entity.hideOffscreenIndicator()
        break
      case 'mouse':
        entity.hideSphere()
        entity.hideRing()
        break
      default:
        console.warn('"disconnect" issued for unhandled type', uuid, state)
    }
  })
  
  network.on('add', (uuid, state) => {
    if (Object.keys(stage.entities).includes(uuid)) {
      console.warn(`Stage already has entity with UUID ${uuid}, not adding`)
      return
    }
    switch(state.type) {
      case 'player':
        console.log('create other player', uuid, state)
        try {
          const otherPlayer = OtherPlayer(Object.assign({
            speed: 250,
            followTurning: true,
            animationSpeed: 1.5,
            labelOffset: { x: 0, y: 0, z: 60 },
            videoBubbleOffset: {x: 0, y: 0, z: -240 },
            animationResourceId: 'people',
          }, state, { uuid }))
          if (state.position) {
            otherPlayer.warpToPosition(state.position)
          }
          stage.add(otherPlayer)
        } catch (e) {
          console.error(e)
        }
        break
      
      case 'decoration':
        const decoration = Decoration(Object.assign({
          speed: 500,
        }, state, { uuid }))
        stage.add(decoration)
        if (mostRecentlyCreatedObjectId === uuid) {
          setWouldSelectObject(decoration)
          selectObject()
        }
        break
      
      case 'thing3d':
        const thing3d = Thing3D(Object.assign({
          speed: 500,
        }, state, { uuid }))
        stage.add(thing3d)
        break
        
      case 'diamond':
        const diamond = InteractionDiamond(Object.assign({
        }, state, { uuid }))
        stage.add(diamond)
        break
      
      case 'mouse':
        const mousePointer = OtherMousePointer(Object.assign({}, state, { uuid }))
        stage.add(mousePointer)
        break
      
      case 'teleportal':
        const teleportal = Teleportal(Object.assign({
          target: player,
          active: false,
          speed: 500,
        }, state, { uuid }))
        console.log('Added teleportal', state, teleportal)
        stage.add(teleportal)
        break
      
      default:
        console.warn('"add" issued for unhandled type', uuid, state)
    }
  })
  
  network.on('remove', (uuid) => {
    const entity = stage.entities[uuid]
    if (entity) {
      stage.remove(entity)
    } else {
      console.warn("Can't remove entity (not found)", uuid)
    }
  })

  // At various times, we need to set focus on the game so that character directional controls work
  const focusOnGame = () => { stage.renderer.domElement.focus() }
  const focusOnInput = () => { document.getElementById('input').focus() }
  // Do it once when the page finishes loading, too:
  focusOnGame()

  document.body.addEventListener('mousedown', (event) => {
    if (event.target.id === 'game') {
      focusOnGame()
      event.preventDefault()
    }
  }, true)
  
  const invite = document.getElementById('invite')
  const invitation = document.getElementById('invitation')
  const invitationInput = document.getElementById('invitation-input')
  invite.addEventListener('mousedown', (event) => {
    if (invitation.classList.contains('show')) {
      invitation.classList.remove('show')
    } else {
      const invitationToken = uuidv4().slice(0,7)
      network.invitations.set(invitationToken, 1)
      invitationInput.value = `${window.location.origin}/?t=${invitationToken}`
      invitation.classList.add('show')
    }
    event.preventDefault()
  })
  
  const doCommand = (command, args) => {
    switch (command) {
      case 'sign':
        if (typeof args === 'undefined' || typeof args[0] === 'undefined') {
          showToast('`/sign` requires a subcommand, e.g. "create"')
        } else {
          const subCommand = args[0]
          switch (subCommand) {
            case 'create':
              if (args.length < 2) {
                showToast('`/sign create MESSAGE` requires MESSAGE')
                return
              }
              // TODO: `link` should be renamed to something like `message`
              const link = args.slice(1).join(' ')
              const position = Object.assign({}, player.state.position.now)
              const diamond = InteractionDiamond({
                type: 'diamond',
                position,
                link,
              })
              diamond.object.position.copy(position)
              // Make it about chest-height by default
              diamond.state.position.target.y += 100
              network.setEntity(diamond)
              break
            
            case 'label':
              if (!selectedObject) {
                showToast('Requires a selected object')
                return
              }
              if (args.length < 2) {
                showToast('`/sign label LABEL` requires LABEL')
                return
              }
              const label = args.slice(1).join(' ')
              selectedObject.setLabel(label)
              network.setEntity(selectedObject)
              showToast(`Sign label set to "${label}" (${selectedObject.uuid})`)
              break
            
            case 'message':
              if (!selectedObject) {
                showToast('Requires a selected object')
                return
              }
              if (args.length < 2) {
                showToast('`/link message MSG` requires MSG')
                return
              }
              const message = args.slice(1).join(' ')
              selectedObject.setThought(message)
              network.setEntity(selectedObject)
              showToast(`Sign message set to "${message}" (${selectedObject.uuid})`)
              break
            
            default:
              showToast('`/sign` subcommands are "create", "label", or "message"')
          }
        }
        break
      
      case 'home':
        player.warpToPosition({x:0,y:0,z:0})
        break
        
      case 'name':
        player.setLabel(args.join(' '))
        break
        
      case 'character':
        const gender = args[0]
        if (gender === 'f' || gender === 'm') {
          const avatarOptions = avatarOptionsOfGender(gender)
          const index = parseInt(args[1], 10)
          if (index < avatarOptions.length) {
            player.state.animationMeshName.target = avatarOptions[index].avatarId
          } else {
            showToast('Pick a number between 0 and 8 for your avatar')
          }
        } else {
          showToast('Pick a gender of "f" or "m" for your avatar')
        }
        break
      
      case 'luke':
        if (['x', 'y', 'z'].includes(args[0]) && args[1]) {
          const axis = args[0]
          const magnitude = parseFloat(args[1])
          for (let entity of stage.entitiesOnStage) {
            if (entity.receivesPointer) {
              entity.state.position.target[axis] += magnitude
              network.setEntity(entity)
            }
          }
        }
        break
        
      case 'yoda':
        if (['x', 'y', 'z'].includes(args[0]) && args[1]) {
          const axis = args[0]
          const magnitude = parseFloat(args[1])
          for (let uuid in stage.entities) {
            const entity = stage.entities[uuid]
            if (entity.receivesPointer) {
              entity.state.position.target[axis] += magnitude
              network.setEntity(entity)
            }
          }
        }
        break
        
      case 'collectallscaled':
        let collectionCount = 0
        for (let uuid in stage.entities) {
          const entity = stage.entities[uuid]
          if (entity.receivesPointer && entity.setTexture) {
            if (entity.texture && (entity.state.imageScale.now <= 0.99 || entity.state.imageScale.now >= 1.01)) {
              entity.state.position.target.x = 0
              entity.state.position.target.y = 1
              entity.state.position.target.z = 0
              if (entity.uiUnlock) {
                entity.uiUnlock()
              }
              network.setEntity(entity)
              collectionCount++
            }
          }
        }
        showToast(`Collected ${collectionCount} objects to center of world`)
        break

      
      case 'abracadabra':
        for (let uuid in stage.entities) {
          const entity = stage.entities[uuid]
          if (entity.receivesPointer && entity.setTexture) {
            if (entity.texture) {
              const h = entity.texture.image.height
              const s = entity.state.imageScale.now
              entity.state.position.target.y += ((h * s) / 2 - (h / 2)) * s
              network.setEntity(entity)
            }
          }
        }
        break
      
      case 'antiabracadabra':
        for (let uuid in stage.entities) {
          const entity = stage.entities[uuid]
          if (entity.receivesPointer && entity.setTexture) {
            if (entity.texture) {
              const h = entity.texture.image.height
              const s = entity.state.imageScale.now
              entity.state.position.target.y -= ((h * s) / 2 - (h / 2)) * s
              network.setEntity(entity)
            }
          }
        }
        break

      case 'object':
      case 'obj':
        const object = selectedObject
        const subCommand = args[0]
        if (!selectedObject) {
          showToast('Selected object not found')
        } else {
          console.log('Selected object', selectedObject)
          if (subCommand === 'info') {
            showInfoAboutObject(selectedObject)
          } else if (subCommand === 'changelink') {
            if (typeof args[1] === 'undefined') {
              showToast('changelink expects URL')
            } else if (!object.state.link) {
              showToast("Object can't set link")
            } else {
              const newLink = args[1]
              object.state.link.target = newLink
              
              const label = args[2] || null
              object.setLabel(label)
              
              network.setEntity(object)
              showToast(`Object link set to ${newLink}, label ${label}`)
            }
          } else if (subCommand === 'up') {
            object.state.orientation.target = 0
            network.setEntity(object)
            showToast('Object is standing up (orientation 0)')
          } else if (subCommand === 'down') {
            object.state.orientation.target = 3
            network.setEntity(object)
            showToast('Object is lying down (orientation 3)')
          } else if (subCommand === 'left') {
            object.state.orientation.target = 1
            network.setEntity(object)
            showToast('Object is standing left (orientation 1)')
          } else if (subCommand === 'right') {
            object.state.orientation.target = 2
            network.setEntity(object)
            showToast('Object is standing right (orientation 2)')
          } else if (subCommand === 'delete') {
            network.removeEntity(object.uuid)
            showToast(`Object ${object.uuid} deleted`)
          } else if (subCommand === 'fetch') {
            const destination = new THREE.Vector3()
            const y = object.state.position.now.y
            destination.copy(player.state.position.now)
            destination.y = y
            object.setPosition(destination)
            network.setEntity(object)
            showToast(`Object ${object.uuid} moved to x: ${parseInt(destination.x, 10)}, y: ${parseInt(destination.y, 10)}, z: ${parseInt(destionation.z, 10)}`)
          } else if (subCommand === 'moveTo') {
            if (typeof args[1] === 'undefined' ||
                typeof args[2] === 'undefined' ||
                typeof args[3] === 'undefined') {
              showToast('moveTo requires x, y, z coordinates')
            } else {
              const x = parseFloat(args[1])
              const y = parseFloat(args[2])
              const z = parseFloat(args[3])
              object.state.position.target.copy({x, y, z})
              network.setEntity(object)
              showToast(`Moved object to x: ${parseInt(x, 10)}, y: ${parseInt(y, 10)}, z: ${parseInt(z, 10)}`)
            }
          } else if (subCommand === 'x') {
            if (typeof args[1] === 'undefined') {
              showToast('x command requires a value to move X by')
            } else {
              object.state.position.target.x += parseFloat(args[1])
              network.setEntity(object)
              showToast(`Moved X to ${parseInt(object.state.position.target.x, 10)}`)
            }
          } else if (subCommand === 'y') {
            if (typeof args[1] === 'undefined') {
              showToast('y command requires a value to move Y by')
            } else {
              object.state.position.target.y += parseFloat(args[1])
              network.setEntity(object)
              showToast(`Moved Y to ${parseInt(object.state.position.target.y, 10)}`)
            }
          } else if (subCommand === 'z') {
            if (typeof args[1] === 'undefined') {
              showToast('z command requires a value to move Z by')
            } else {
              object.state.position.target.z += parseFloat(args[1])
              network.setEntity(object)
              showToast(`Moved Z to ${parseInt(object.state.position.target.z, 10)}`)
            }
          } else if (subCommand === 'scale') {
            if (typeof args[1] === 'undefined') {
              showToast('scale command requires a value to scale by')
            } else {
              const scale = parseFloat(args[1])
              if (object.setScale) {
                object.setScale(scale)
                network.setEntity(object)
                showToast(`Scaled object to ${scale}`)
              } else {
                showToast("Object doesn't support setScale")
              }
            }
          } else if (subCommand === 'rotate') {
            if (typeof args[1] === 'undefined') {
              showToast('rotate command requires a value to rotate by')
            } else {
              const degrees = parseFloat(args[1])
              const radians = degrees * -THREE.Math.DEG2RAD
              if (object.setRotation) {
                object.setRotation(radians)
                // object.state.imageRotation.target = radians
                network.setEntity(object)
                showToast(`Object rotated to ${degrees} deg (${radians} rad)`)
              } else {
                showToast("Object doesn't support setRotation")
              }
            }
          } else if (subCommand === 'clone') {
            let count
            if (typeof args[1] === 'undefined') {
              count = 1
            } else {
              count = parseInt(args[1], 10)
            }
            const clonedState = stateToObject(object.type, object.state)
            clonedState.position = Object.assign({}, clonedState.position)
            for (let i = 0; i < count; i++) {
              clonedState.position.x += 50
              clonedState.position.z += 50
              const newUuid = uuidv4()
              network.setState(newUuid, clonedState)
              showToast(`Cloned new object: ${newUuid}`)
            }
          } else if (subCommand === 'lock') {
            if (object.uiLock) {
              object.uiLock()
              setWouldSelectObject(null)
              selectObject()
              network.setEntity(object)
              showToast(`Object locked (${object.uuid})`)
            } else {
              showToast("Selected object can't be locked")
            }
          } else if (subCommand === 'unlock') {
            if (object.uiUnlock) {
              object.uiUnlock()
              setWouldSelectObject(object)
              selectObject()
              network.setEntity(object)
              showToast(`Object unlocked (${object.uuid})`)
            } else {
              showToast("Selected object can't be unlocked")
            }
          }
        }
        break

      case 'mute':
        muteAudio()
        break
      
      case 'unmute':
        unmuteAudio()
        break
        
      case 'portal':
        if (!args || args.length === 0) {
          console.warn('URL is required')
          break
        }
        const radius = parseInt(args[1] || '150')
        const url = args[0]
        const tp = Teleportal({
          // FIXME: should add UUID here
          type: 'teleportal',
          target: player,
          url: url,
          active: false,
          radius: radius,
          position: player.state.position.now,
        })
        tp.object.position.copy(player.state.position.now)
        network.setEntity(tp)
        stage.add(tp)
        break
      
      case 'zoomrange':
        if (args.length === 1) {
          switch (args[0]) {
            case 'max':
              stage.minFov = 20.0
              stage.maxFov = 800.0
              break
            default:
              stage.setDefaultFovRange()
              break
          }
          showToast(`zoomrange set to ${stage.minFov}, ${stage.maxFov}`)
        } else {
          showToast('zoomrange requires min and max')
        }
        break
        
      case 'stop':
        stage.continueRendering = false
        break

      case 'reset':
        stage.continueRendering = false
        setTimeout(() => {
          localStorage.clear()
          window.location.reload()
        }, 100)
        break
      
      case 'whereami':
        const pos = player.object.position
        showToast(`You are at x: ${parseInt(pos.x, 10)}, y: ${parseInt(pos.y, 10)}, z: ${parseInt(pos.z, 10)}`)
        break
        
      default:
        showToast(`As far as I know, this isn't a command: ${command}`)
    }
  }
  
  // Allow TAB and ESC keys to switch from text input to game view
  const inputEl = document.getElementById('input')
  inputEl.addEventListener('keydown', e => {
    const text = e.target.value.trim()
    if (e.keyCode === 9 /* TAB */) {
      // Don't allow TAB to propagate up and cause focus to be switched us back to input
      e.preventDefault()
      e.stopPropagation()
      focusOnGame()
    } else if (e.keyCode === 27 /* ESC */) {
      player.setThought(null)
      focusOnGame()
    } else if (e.keyCode === 13 /* ENTER */) {
      if (text.substring(0,1) === '/') {
        const parts = text.substring(1).split(' ')
        if (parts.length === 1 && parts[0] !== '') {
          const command = parts[0]
          doCommand(command)
        } else if (parts.length > 1) {
          const command = parts[0]
          const args = parts.slice(1)
          doCommand(command, args)
        }
        e.target.value = ''
        focusOnGame()
      } else if (text !== '') {
        // Before focusing back on the game, make a thought bubble, and clear the text
        player.setThought(text)
        e.target.value = ''
      } else {
        focusOnGame()
      }
    } else if (e.keyCode >= 37 && e.keyCode <= 40 && text === "") {
      // If the player has typed nothing, but uses the arrow keys, go back to the game
      focusOnGame()
      kbController.keyPressed(e.keyCode)
    }
  })

  const pressTabHelp = document.getElementById('press-tab-help')
  pressTabHelp.addEventListener('mousedown', (event) => {
    pressTabHelp.classList.add('hide')
    // Don't move focus away from webgl canvas
    event.preventDefault()
  })
  
  document.addEventListener('contextmenu', (event) => {
    const isect = mousePointer.intersects
    if (isect.length > 0) {
      const clickedEntity = isect[0].entity
      showInfoAboutObject(clickedEntity)
    }
    event.preventDefault()
  })
  
  const kbController = KeyboardController({ type: "keyboard", target: player })
  document.addEventListener('keydown', e => {
    
    if (e.target === stage.renderer.domElement) {
      kbController.keyPressed(e.keyCode, { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
      // Don't accidentally allow backspace to trigger browser back
      if (e.keyCode === 8) {
        e.preventDefault()
      }
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      else if (e.keyCode === 9) {
        e.preventDefault()
      } else if (e.keyCode === 191 /* Forward Slash */) {
        e.preventDefault()
        focusOnInput()
        document.getElementById('input').value = '/' 
      }
    }
  })
  document.addEventListener('keyup', e => {
    if (e.target === stage.renderer.domElement) {
      kbController.keyReleased(e.keyCode, { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      if (e.keyCode === 9) {
        e.preventDefault()
      } else if (e.keyCode === 191 /* Forward Slash */) {
        e.preventDefault()
      }
    }
  })
  kbController.on('done', focusOnInput)
  kbController.on('switch', () => { focusOnInput(); pressTabHelp.classList.add('hide') })
  kbController.on('close', () => { player.setThought(null) })
  kbController.on('unknown', (keyCode, opts) => {
    // If the player presses a letter of the alphabet on the keyboard, give them a hint
    if (keyCode >= 65 && keyCode <= 90 && !opts.ctrl && !opts.meta) {
      pressTabHelp.classList.remove('hide')
      pressTabHelp.classList.add('show')
      setTimeout(() => {
        pressTabHelp.classList.add('hide')
      }, 7500)
    }
  })
  kbController.on('doublePressed', (action) => {
    player.setSpeed(500)
    player.setAnimationSpeed(3)
    network.setEntity(player)
  })
  kbController.on('released', (action) => {
    player.setSpeed(250)
    player.setAnimationSpeed(1.5)
    network.setEntity(player)
  })
  stage.add(kbController)

  const camController = CameraController({
    targetNear: playersCentroid,
    targetFar: player.object.position
  })
  stage.add(camController)
  
  const params = { id: playerId }
  const url = new URL(window.location.href)
  const token = url.searchParams.get("t")
  if (window.crypto.subtle) {
    const pubkey = await security.exportPublicKey()
    const signature = await security.sign(playerId)
    params.s = signature
    if (token) {
      Object.assign(params, {
        t: token,
        /**
         * The `x` and `y` parameters are public parts of the ECDSA algorithm.
         * The server registers these and can later verify anything this client
         * cryptographically signs.
         */
        x: pubkey.x,
        y: pubkey.y
      })
    }
    await security.verify(playerId, signature)
  } else {
    console.log("Not using crypto.subtle")
  }
  
  // Call network.connect now, after all the network callbacks are ready,
  // so that we don't miss any inital 'add' events
  network.connect(params)

  initializeAVChat(player.uuid, 'relm-' + cfg.ROOM, {
    onMuteChanged: (track, playerId) => {
      const muted = track.isMuted()
      const otherPlayer = stage.entities[playerId]
      // console.log('onMuteChanged', playerId, muted, otherPlayer)
      if (muted) {
        otherPlayer.videoBubble.object.enterMutedState()
      } else {
        otherPlayer.videoBubble.object.enterUnmutedState()
      }
    },
    createVideoElement: (entityId) => {
      // console.log('playerId', playerId)
      // console.log('createVideoElement', entityId)
      const entity = stage.entities[entityId]
      if (entity) {
        if (entity.videoBubble) {
          return entity.videoBubble.object.createDomElement()
        } else {
          console.warn("Can't create video element for entity that has no VideoBubble", entityId)
        }
      } else {
        console.warn("Can't create video element for missing entity", entityId)
      }
    }
  })
}

start()