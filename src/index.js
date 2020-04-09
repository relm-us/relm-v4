import { MapControls } from '../lib/OrbitControls.js'
import { Stats } from '../lib/Stats.js'
import '../lib/MathSeed.js'

import { addRandomDecorationsToScene } from './decoration.js'
import { Player } from './player.js'
import { RemoteDesktopPortal } from './remote_desktop_portal.js'
import { ResourceLoader, meshoptGLTFLoader, regularGLTFLoader, textureLoader } from './resource_loader.js'
import { bus } from './bus.js'
import { Stage, cameraIdealPosition } from './stage'
import { MeshEntity } from './mesh_entity.js'
import { Island } from './island.js'
import { Chatpost } from './chatpost.js'
import {
  lsGetPlayerId,
  lsGetPlayerState,
  lsSetPlayerState,
  Network,
} from './network.js'
import {
  playerStateToModel,
  playerModelToState,
  playerStateRandomPosition,
  playerStateDefaultQuaternion
} from './player_model.js'

const { THREE, requestAnimationFrame } = window
const { MathUtils } = THREE

const CAMERA_DISTANCE_PER_DELTA = 4.8
const RANDOM_SEED = 213113

const network = new Network()

var controls = {}
var typingMode = false

const chatposts = {}
window.chatposts = chatposts

let previouslyNearestChatpost

// var Camera and panningControls
var cameraSpeed = 1.00
var cameraLastPosition = new THREE.Vector3(0,0,0); var cameraLastPositionSet = false;
var cameraNextPosition = new THREE.Vector3(0,0,0); var cameraNextPositionSet = false;
var cameraVelocity = new THREE.Vector3(0,0,0)
var oldCameraVelocity = new THREE.Vector3(0,0,0)
var avgCameraVelocity = new THREE.Vector3(0,0,0)
var longTermAvgCameraVelocity = new THREE.Vector3(0,0,0)
var cameraNearModeTrigger = 5

// Setup Random Seed
const randomGenerator = Math.seed(RANDOM_SEED)

const players = {}
window.players = players

function localPlayer() {
  return players[lsGetPlayerId()]
}

function remotePlayer(playerId) {
  return players[playerId]
}

function makePlayer (stage, rsrc, model, opts) {
  console.log('makePlayer', model)
  const player = players[model.playerId] = new Player(stage, rsrc, model, opts)
  return player
}

function createLocalPlayer (stage, rsrc) {
  const playerState = lsGetPlayerState()

  if (!('px' in playerState)) {
    Object.assign(playerState, playerStateRandomPosition())
  }
  if (!('qx' in playerState)) {
    Object.assign(playerState, playerStateDefaultQuaternion())
  }

  // Make our single "local" player
  console.log("createLocalPlayer", playerState)
  const playerModel = playerStateToModel(playerState)
  console.log('createLocalPlayer broadcast', playerModel)
  const player = makePlayer(stage, rsrc, playerModel, {
    opacity: 1.0,
    onCloseThought: (player) => {
      network.broadcastPlayerThought(null)
    },
    onActionThought: (player, bubble) => {
      addMessageToChatpost(bubble.text)
      bubble.clearText()
      network.broadcastPlayerThought(null)
    }
  })

  network.broadcastPlayer(player)
}

function syncPlayers (stage, rsrc) {
  network.on('addConnectPlayer', (playerModel) => {
    let player = makePlayer(stage, rsrc, playerModel, { opacity: 0.3 })
    player.setOpacity(1.0)
  })
  
  network.on('addPlayer', (playerModel) => {
    console.log('on addPlayer', playerModel)
    makePlayer(stage, rsrc, playerModel, { opacity: 0.3 })
  })

  network.on('removePlayer', (playerId) => {
    const player = players[playerId]
    stage.removeEntity(player)
    delete players[playerId]
  })
  
  network.on('updatePlayer', (playerState) => {
    const player = players[playerState.id]
    player.setModel(playerStateToModel(playerState))
  })


  network.on('connectPlayer', (clientState) => {
    const player = remotePlayer(clientState.id)
    console.log('network.on connectPlayer', clientState, player)
    player.setOpacity(1.0)

    // Restore current location
    const playerModel = playerStateToModel(clientState)
    player.setPosition(playerModel.position)
    player.setQuaternion(playerModel.quaternion)
  })

  network.on('disconnectPlayer', (playerId, playerModel) => {
    const player = remotePlayer(playerId)
    player.setOpacity(0.3)
    lsSetPlayerState(playerModelToState(player.model))
  })
}

function syncChatposts (stage, rsrc) {
  // The /chatposts schema is:
  // {
  //   "hashmap": {
  //     <UUID of Chatpost>: {
  //       "position": {x, y, z},
  //       "messages": [
  //         {
  //           "name": <String>,
  //           "text": <String>
  //         },
  //         ...
  //       ]
  //     },
  //     ...
  //   }
  // }
  bus.fetch('/chatposts', (cposts) => {
    let uuid
    // Delete chatposts that have been removed
    for (uuid in chatposts) {
      if (!(uuid in cposts.hashmap)) {
        let chatpost = chatposts[uuid]
        chatpost.clearMessages()
        chatpost.removeSignage()
        delete chatposts.uuid
      }
    }

    // Create or update chatposts
    for (uuid in cposts.hashmap) {
      // console.log('chatpost', uuid, cposts.hashmap[uuid])
      if (uuid in chatposts) {
        // Chatpost already exists, see if it needs update
        let chatpost = chatposts[uuid]
        if (chatpost.messages.length !== cposts.hashmap[uuid].messages.length) {
          chatpost.clearMessages()
          for (let msg of cposts.hashmap[uuid].messages) {
            chatpost.addMessage(msg.name, msg.text)
          }
        }
      } else {
        // Doesn't exist yet, create new Chatpost
        let chatpost = new Chatpost(
          cposts.hashmap[uuid].position,
          stage,
          rsrc, {
            onDestroy: (chatpost) => {
              let cposts = bus.fetch('/chatposts')
              console.log("Destroying", chatpost.uuid)
              delete cposts.hashmap[chatpost.uuid]
              bus.save(cposts)
            }
          }
        )
        // Rather than assigning a random UUID, use the one the network tells us.
        // This is because existing Chatpost objects need to maintain the same UUID.
        chatpost.uuid = uuid
        stage.addEntity(chatpost)  
        chatposts[uuid] = chatpost

        chatpost.clearMessages()
        for (let msg of cposts.hashmap[uuid].messages) {
          chatpost.addMessage(msg.name, msg.text)
        }
      }
    }
  })
}

function loadBuildings (rsrc) {
  const building1 = new MeshEntity(rsrc.getObject('town', 'House_01_FantasyAtlas_mat_0'), { rotate: 1 })
  building1.root.position.set(1000, 0, -400)

  const building2 = new MeshEntity(rsrc.getObject('town', 'House_02_FantasyAtlas_mat_0'), { rotate: 2 })
  building2.root.position.set(-1600, 0, 0)

  const building3 = new MeshEntity(rsrc.getObject('town', 'House_03_FantasyAtlas_mat_0'), { rotate: 1 })
  building3.root.position.set(-1400, 0, -1400)

  const building4 = new MeshEntity(rsrc.getObject('town', 'House_04_FantasyAtlas_mat_0'), { rotate: 0, scale: 6 })
  building4.root.position.set(1500, 0, -1200)
}

function cycleAndBroadcastAvatarChange(player, gender) {
  let avatar = player.opts.avatar
  let playerState
  player.opts.avatar = player.getNextAvatar(avatar.avatarId, gender ? gender : avatar.gender)
  player.chooseAvatar(player.opts.avatar.avatarId)

  setLocalPlayerProfile(player.opts.avatar)
  network.broadcastPlayerProfile(player.opts.avatar)
}

let island

function delay(msec) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, msec)
  })
}

async function start () {
  console.log('start')
  const progressBar = document.getElementById('progress-bar')
  
  const rsrc = window.rsrc = new ResourceLoader(
    (self, resource, { path, id, sizeInBytes }) => {
      let div
      if (progressBar.firstChild.tagName === 'DIV') {
        div = progressBar.firstChild
      } else {
        div = document.createElement('div')
        progressBar.innerHTML = ''
        progressBar.appendChild(div)
      }

      div.style.width = Math.ceil((self.currentProgress / self.maxProgress) * 100) + '%'
      div.innerHTML = id
      if (self.currentProgress === self.maxProgress) {
        setTimeout(() => {
          progressBar.style.display = 'none'
          document.getElementById('typing').style.visibility = 'visible'
        }, 200)
      }
    }
  )

  // We first add these resources so that the progress bar can add up all
  // the resource's sizes. The actual loading doesn't happen until we
  // `enqueue` and `load`.
  rsrc.add('people', meshoptGLTFLoader, 'people-packed.glb')
  rsrc.add('skybox', textureLoader, 'ayanarrablueskyfog.jpg')
  rsrc.add('grass', textureLoader, 'grasstexture.jpg')
  rsrc.add('green tree', textureLoader, 'tree01.png')
  rsrc.add('yellow tree', textureLoader, 'tree04.png')
  rsrc.add('hollow stump', textureLoader, 'tree06.png')
  rsrc.add('tree7', textureLoader, 'tree07.png')
  rsrc.add('rock', textureLoader, 'rock02.png')
  rsrc.add('stump', textureLoader, 'tree05.png')
  rsrc.add('shrub', textureLoader, 'plant02.png')
  rsrc.add('mushroom', textureLoader, 'plant04.png')
  rsrc.add('sparkle', textureLoader, 'sparkle_blue.png')
  rsrc.add('signpost', textureLoader, 'sign01.png')
  rsrc.add('signpole', textureLoader, 'sign02.png')
  rsrc.add('town', regularGLTFLoader, 'town.glb')
  rsrc.add('island', regularGLTFLoader, 'oneisland.glb')


  // Stage 1 Resource Load: Bare essentials
  rsrc.enqueue(['people', 'skybox', 'grass'])
  await rsrc.load()

  const stage = new Stage(window.innerWidth, window.innerHeight, {
    skybox: rsrc.get('skybox'),
    grass: rsrc.get('grass')
  })
  window.stage = stage
  window.addEventListener('resize', stage.onWindowResize.bind(stage), false)
  stage.renderTasks.push(mainRenderTask)

  syncPlayers(stage, rsrc)
  // syncChatposts(stage, rsrc)
  // Network connect needs to happen after syncPlayers, syncChatposts
  network.connect()

  createLocalPlayer(stage, rsrc)
  window.players = players

  setupTyping()
  
  // Stage 2 Resources: non-essentials
  rsrc.enqueue([
    'green tree', 'yellow tree', 'hollow stump', 'tree7', 'rock',
    'stump', 'shrub', 'mushroom', 'sparkle', 'signpost', 'signpole'
  ])
  await rsrc.load()

  addRandomDecorationsToScene(stage.scene, stage.ground, randomGenerator)



  let portal
  portal = new RemoteDesktopPortal('https://vnc2.ayanarra.com', -465, 190, { rotate: 1.5})
  window.portal1 = portal
  stage.addEntity(portal)
  
  portal = new RemoteDesktopPortal('https://vnc3.ayanarra.com', 400, 190, { rotate: 1})
  stage.addEntity(portal)

  // Stage 3 Resources: visible later
  rsrc.enqueue(['town', 'island'])
  await rsrc.load()
  
  island = new Island(rsrc, {
    onChangeName: (name) => {
      localPlayer().setName(name)
      lsSetPlayerState({ nm: name })
      network.broadcastPlayerProfile({ name })
    },
    onNextCharacter: () => {
      cycleAndBroadcastAvatarChange(localPlayer())
    },
    onChangeGender: (gender) => {
      cycleAndBroadcastAvatarChange(localPlayer(), gender)
    }
  })
  stage.addEntity(island)

  loadBuildings(rsrc)
}

start()

/// ///////////////////////////////////////////////////////////////////////////////
//    Add ability to pan and zoom around the scene          //
/// ///////////////////////////////////////////////////////////////////////////////

// var panningControls = new MapControls(camera, scene.mixerContext.rendererCss.domElement)

// panningControls.addEventListener('mousedown', panningEvent, false) // to enable automatic follow and user input, call panning event if mouse pressed
function panningEvent () {
  // cameraSpeed = 0;
  console.log('panningEvent')
}
// panningControls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
// panningControls.dampingFactor = 0.05

// panningControls.screenSpacePanning = true

// panningControls.minDistance = 3000
// panningControls.maxDistance = 5500
// panningControls.enableRotate = false

// panningControls.maxPolarAngle = Math.PI / 2
// panningControls.enableCssInputFix = true

// panningControls.enableKeys = true


//////////////////////////////////////////////////////////////////////////////////
//     setup player's mouse inputs for dragging camera around            //
//////////////////////////////////////////////////////////////////////////////////

var cameraTouchDown = false
var cameraDrag = false
var cameraUndragSpeed = 1
var backToCenter = true

// document.addEventListener( 'touchstart', onDocumentMouseDown, false );
// document.addEventListener( 'mousedown', onDocumentMouseDown, false );
function onDocumentMouseDown( event ) {
  //event.preventDefault();
  //var mousex = ( event.clientX / window.innerWidth ) * 2 - 1;
  //var mousey = - ( event.clientY / window.innerHeight ) * 2 + 1;
  //console.log("Mouse X: "+mousex+" Y:"+mousey)
  // console.log("Mouse Down")
  cameraTouchDown = true
  cameraDrag = true
}      

document.addEventListener( 'touchmove', onDocumentMouseMove, false );
document.addEventListener( 'mousemove', onDocumentMouseMove, false );  
function onDocumentMouseMove( event ) {
  //event.preventDefault();
  //var mousex = ( event.clientX / window.innerWidth ) * 2 - 1;
  //var mousey = - ( event.clientY / window.innerHeight ) * 2 + 1;
  //console.log("Mouse X: "+mousex+" Y:"+mousey)
  //console.log("Mouse Move")
  if (cameraTouchDown == true) {
    cameraDrag = true
  }
}

document.addEventListener( 'touchend', onDocumentMouseUp, false );
document.addEventListener( 'mouseup', onDocumentMouseUp, false );       
function onDocumentMouseUp( event ) {
  //event.preventDefault();
  //var mousex = ( event.clientX / window.innerWidth ) * 2 - 1;
  //var mousey = - ( event.clientY / window.innerHeight ) * 2 + 1;
  //console.log("Mouse X: "+mousex+" Y:"+mousey)
  // console.log("Mouse Up")
  if (cameraTouchDown == true) {
    cameraDrag = false
  }
  cameraTouchDown = false
}    
     
//////////////////////////////////////////////////////////////////////////////////
//    setup the stats panel            //
//////////////////////////////////////////////////////////////////////////////////

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)     

/// ///////////////////////////////////////////////////////////////////////////////
//    render the scene            //
/// ///////////////////////////////////////////////////////////////////////////////

const targetOld = new THREE.Vector3()
const targetNew = new THREE.Vector3()
const mainRenderTask = (delta) => {
  const player = localPlayer()
  if (!player) { return }

  if (controls.act && player.isAutonomous()) {
    // console.log('root pos', localPlayer.root.position.y)
    if (player.root.position.y > 1000) {
      // return to ground
      player.teleportDown()
    } else {
      // teleport up to sky
      cameraSpeed = 7.5
      island.moveTo(player.root.position)
      player.teleportUp()
    }
    controls.act = false
  }
  const target = player.getMoveTargetFromControls(controls)
  targetNew.set(target.x, target.y, target.z)
  if (targetNew.distanceTo(targetOld) > 10) {
    if (player.setMoveTarget(target)) {
      network.broadcastPlayer(player)
    }
    targetOld.copy(targetNew)
  }
  
  // ***** get player position: *****
  var tempPosition = new THREE.Vector3()
  // center camera by loading tempPosition with player's future position (walkToTarget)
  // player.moveTarget.getWorldPosition(tempPosition)
  player.root.getWorldPosition(tempPosition)
  
  // ***** update camera target position: *****
  var lookAtShoulders = 65
  tempPosition.y = tempPosition.y + lookAtShoulders

  // Camera Target Option 3: Let user switch between tight movement or dragging the orbit target:
  // var distance = panningControls.target.distanceTo(tempPosition)  
  //   if (cameraDrag == true || backToCenter == false) {
  //     const lerpAlpha = MathUtils.clamp((CAMERA_DISTANCE_PER_DELTA * delta * cameraUndragSpeed) / distance * 20, 0.000001, 1.0)
  //     panningControls.target.lerp(tempPosition, lerpAlpha)
  //     cameraUndragSpeed = MathUtils.clamp(cameraUndragSpeed + (1 + (cameraUndragSpeed)) * delta,0,15);
  //     if (distance < 5) { backToCenter = true; } else { backToCenter = false; }
  //   } else {
  //     panningControls.target.copy(tempPosition)
  //     cameraUndragSpeed = 1
  //   }
  
  // ***** update distant camera position: *****  
  tempPosition.y = tempPosition.y + cameraIdealPosition.y
  tempPosition.z = tempPosition.z + cameraIdealPosition.z

  let chatpost = findNearestChatpost(localPlayer().root.position, 200)
  if (chatpost) {
    chatpost.highlight(true)
    if (previouslyNearestChatpost) {
      if (chatpost.uuid !== previouslyNearestChatpost.uuid) {
        previouslyNearestChatpost.highlight(false)
      }
    }
    previouslyNearestChatpost = chatpost
  } else if (previouslyNearestChatpost) {
    previouslyNearestChatpost.highlight(false)
    previouslyNearestChatpost = null
  }
  
  if (window.stage) {
    var distance = window.stage.camera.position.distanceTo(tempPosition)
    if (cameraDrag == true || backToCenter == false) {
      const lerpAlpha = MathUtils.clamp((CAMERA_DISTANCE_PER_DELTA * delta * cameraUndragSpeed) / distance * 20, 0.000001, 1.0)
      window.stage.camera.position.lerp(tempPosition, lerpAlpha)
    } else {
      window.stage.camera.position.copy(tempPosition)
    }
  }

}

/// ///////////////////////////////////////////////////////////////////////////////
//    loop runner              //
/// ///////////////////////////////////////////////////////////////////////////////

var lastTimeMsec = null

// setup delta variables for smoother animation
var avgDelta = 0.02
var numberOfFramesToAverage = 24
var numberOfFramesToAverageMax = numberOfFramesToAverage

// setup bumpiness variables to detect sudden changes in scene complexity
var bumpiness = 0

var fastAvgBumpiness = 0.012
var fastAvgBumpinessFrames = 20

var slowAvgBumpiness = 0.010
var slowAvgBumpinessFrames = 24

var bumpinessDeviationTrigger = 1.02

function calculateAverageDelta(nowMsec) {
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
  var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
  lastTimeMsec = nowMsec

  var delta = deltaMsec / 1000

  // get a smoother delta by averaging a # of frame deltas (numberOfFramesToAverage)
  avgDelta = (avgDelta * numberOfFramesToAverage + delta) / (numberOfFramesToAverage + 1)

  // detect bumpiness levels in case the scene complexity changes rapidly
  bumpiness = Math.abs(delta - avgDelta)
  fastAvgBumpiness = (fastAvgBumpiness * fastAvgBumpinessFrames + bumpiness) / (fastAvgBumpinessFrames + 1)
  slowAvgBumpiness = (slowAvgBumpiness * slowAvgBumpinessFrames + bumpiness) / (slowAvgBumpinessFrames + 1)

  if (fastAvgBumpiness > slowAvgBumpiness * bumpinessDeviationTrigger) {
    numberOfFramesToAverage = 0
  } else {
    numberOfFramesToAverage = MathUtils.clamp(numberOfFramesToAverage + 1, 1, numberOfFramesToAverageMax)
  }

  return avgDelta
}

requestAnimationFrame(function animate (nowMsec) {
  // measure time
  let avgDelta = calculateAverageDelta(nowMsec)

  // render the animation frame for each object by calling each object's update function
  stats.begin()
  if (window.stage) {
    window.stage.render(avgDelta)
  }
  stats.end()

  // keep looping
  requestAnimationFrame(animate)
})

/// ///////////////////////////////////////////////////////////////////////////////
//  Events
/// ///////////////////////////////////////////////////////////////////////////////


// Arrow Keys ONLY
const actionMap = {
  up: [38 /* up */],
  down: [40 /* down */],
  left: [37 /* left */],
  right: [39 /* right */],
  act: [32] // spacebar

}

function findActionFromKeyCode (keyCode) {
  for (const action in actionMap) {
    if (actionMap[action].includes(keyCode)) {
      return action
    }
  }
}

var canvasFocus = true

//Chris TODO
/*
function onKeyDown (event) {
  
	  event.stopPropagation()
	  const action = findActionFromKeyCode(event.keyCode)
	  if ((action && typingMode == false) || event.keyCode==38 || event.keyCode==40 || event.keyCode==37 || event.keyCode==39 ) {
		  controls[action] = true;
		  controls.guided = false;
		  var canvas = document.getElementById("csscanvas");
		  canvas.focus();  canvasFocus = true;
		  typingMode = false;
	  } else if ( event.keyCode != 32 && canvasFocus == true) {
		  controls[action] = false;
		  var inputArea = document.getElementById("input");
		  inputArea.focus();
		  typingMode = true;
	  }
  
}

function onKeyUp (event) {
  
	  event.stopPropagation()
	  const action = findActionFromKeyCode(event.keyCode)
	  if ((action && typingMode == false) || event.keyCode==38 || event.keyCode==40 || event.keyCode==37 || event.keyCode==39 ) {
		  controls[action] = false;
		  controls.guided = false;
		  var canvas = document.getElementById("csscanvas");
		  canvas.focus(); canvasFocus = true;
		  typingMode = false;
	  }	else if ( event.keyCode != 32 && canvasFocus == true) {
		  controls[action] = false;
		  var inputArea = document.getElementById("input");
		  inputArea.focus();
		  typingMode = true;
	  }
}  
*/

function focusOnCanvas() {
  var canvas = document.getElementById("glcanvas")
  if (canvas) {
    canvas.tabIndex = -1
    canvas.focus()
  }
}

function onKeyDown (event) {
  // console.log('activeElement', document.activeElement)
  if (document.activeElement.tagName === 'INPUT') {
    return
  }
  event.stopPropagation()
  const action = findActionFromKeyCode(event.keyCode)
  const movementKeyPressed = [37,38,39,40].includes(event.keyCode)
  if ((action && typingMode == false) || movementKeyPressed) {
    controls[action] = true
    controls.guided = false
    focusOnCanvas()
    typingMode = false
    // console.log("typing mode OFF (movement key pressed)")
  } else if ( event.keyCode != 32 ) {
    controls[action] = false
    var inputArea = document.getElementById("input")
    inputArea.focus()
    typingMode = true
    // console.log("typing mode ON (non-spacebar key pressed)")
  }
}

function onKeyUp (event) {
  if (document.activeElement.tagName === 'INPUT') {
    return
  }
  event.stopPropagation()
  const action = findActionFromKeyCode(event.keyCode)
  const movementKeyPressed = [37,38,39,40].includes(event.keyCode)
  if ((action && typingMode == false) || movementKeyPressed) {
    controls[action] = false
    controls.guided = false
    focusOnCanvas()
    typingMode = false
  }	else if ( event.keyCode != 32 ) {
    controls[action] = false
    var inputArea = document.getElementById("input")
    inputArea.focus()
    typingMode = true
  }
}

document.addEventListener('keydown', onKeyDown, false)
document.addEventListener('keyup', onKeyUp, false)

withSelection("#control-button", (button) => {
  addButtonEffect(button, {
    onPress: (_) => { controls.act = true; },
    onRelease: (_) => { controls.act = false; },
  });
});

withSelection("#control-pad", (button) => {
    addButtonEffect(button, {
        // TODO: Don't simulate keys, just pass the x/y values through to InputState.xaxis/yaxis
        onPress: (e) => {
            var touch = e.targetTouches[0];
            var rect = button.getBoundingClientRect();
            var ratio = touch.clientX / touch.screenX;
            var x = touch.clientX + (touch.radiusX || 10) * ratio - (rect.x + rect.width / 2);
            var y = touch.clientY + (touch.radiusY || 10) * ratio - (rect.y + rect.height / 2);
            var radius = Math.sqrt(x * x + y * y);
            if (radius > rect.width/6) {

				//bring focus away from typing, back to 3D game
				var canvas = document.getElementById("csscanvas");
				canvas.focus(); canvasFocus = true;
				typingMode = false
				

/* Chris Merged Over Duane's Edit
                //bring focus away from typing, back to 3D game
                var canvas = document.getElementById("glcanvas");
                canvas.focus();
                typingMode = false
*/
                var angle = Math.atan2(y, x) * 180 / Math.PI;
                var cone = 110.0 / 2.0;
                var halfCone = 40.0 / 2.0;
                if (Math.abs(angle) >= 180 - cone) { // Left
                    controls.left = true;
                    if (Math.abs(angle) >= 180 - halfCone) {
                        controls.up = false;
                        controls.down = false;
                    }
                }
                if (angle >= -90 - cone && angle < -90 + cone) { // Up
                    controls.up = true;
                    if (angle >= -90 - halfCone && angle < -90 + halfCone) {
                        controls.left = false;
                        controls.right = false;
                    }
                }
                if (angle >= -cone && angle < cone) { // Right
                    controls.right = true;
                    if (angle >= -halfCone && angle < halfCone) { // Right
                        controls.up = false;
                        controls.down = false;
                    }
                }
                if (angle >= 90 - cone && angle < 90 + cone) { // Down
                    controls.down = true;
                    if (angle >= 90 - halfCone && angle < 90 + halfCone) { // Down
                        controls.left = false;
                        controls.right = false;
                    }
                }
            } else {
                controls.left = false;
                controls.up = false;
                controls.right = false;
                controls.down = false;
            }
        },
        onRelease: (e) => {
            controls.left = false;
            controls.up = false;
            controls.right = false;
            controls.down = false;
        },
    });
});


function withSelection(selector, myYield) {
  var myElement = document.querySelector(selector);
  if (myElement) {
      myYield(myElement);
  } else {
      console.error("Unable to find element:", selector);
  }
}

function addButtonEffect(myElement, listeners) {
  var setState = (pressed) => { myElement.classList[pressed ? 'add' : 'remove']('pressed'); };

  var press = (event) => {
      listeners.onPress && listeners.onPress(event);
      setState(true);
      event.preventDefault();
      event.stopPropagation();
      return false;
  };
  ["touchstart", "touchmove", "mousemove"].forEach((event) => myElement.addEventListener(event, press));

  var release = (event) => {
      listeners.onRelease && listeners.onRelease(event);
      setState(false);
      event.preventDefault();
      event.stopPropagation();
      return false;
  };
  ["touchend", "touchcancel", "mouseup", "mouseleave"].forEach((event) => myElement.addEventListener(event, release));
  
  myElement.setAttribute("draggable", false);
}

var typingMode = false
document.getElementById("input").addEventListener("focus", (e) => {
            // console.log(e);
			typingMode = true
			canvasFocus = false

        });

//input your name		
//Doesn't work because DOM isn't loaded
/*document.getElementById("standard-basic").addEventListener("focus", (e) => {
            // console.log(e);
			typingMode = true
			canvasFocus = true
			nameInputFocus = true

        });		
*/		

	
		
//glcanvas doesn't work for focus events because we are using CSS renderer
/*document.getElementById("glcanvas").addEventListener("focus", (e) => {
            console.log("back to glcanvas: ",e);
			canvasFocus = true;
			typingMode = false;
			nameInputFocus = false

        });	*/

//allow tpying in various elements by detecting when game world focus is lost		

function setupTyping () {
  const cssCanvas = document.getElementById("csscanvas")
  const glCanvas = document.getElementById("glcanvas")
  const typingInput = document.getElementById("input")

  cssCanvas.addEventListener("focusout", (e) => {
    // console.log("Leaving csscanvas: ",e)
    canvasFocus = false
    typingMode = true //assume we are leaving game world to try to type
  });
  
  cssCanvas.addEventListener("focus", (e) => {
    console.log("Back to csscanvas: ",e)
    canvasFocus = true
    typingMode = false
  });

  glCanvas.addEventListener("focus", (e) => {
    // console.log("typing mode OFF (canvas focus)")
    typingMode = false
  })

  typingInput.addEventListener("focus", (e) => {
    // console.log("typing mode ON (input focus)")
    typingMode = true
  })

  typingInput.addEventListener("keydown", (e) => {
    if (e.key == 'Enter') {
      var typing = document.getElementById('typing');
      typing.classList.add('hidden');

      var input = document.getElementById('input')
      addMessage(input.value)
      input.value = ""

      const intervalId = setInterval(() => {
        console.log("Moving focus away from typing input")
        if (document.activeElement == typingInput) {
          focusOnCanvas()
        } else {
          clearInterval(intervalId)
        }
      }, 50)
      typingMode = false
    }
  })
}


function findNearestChatpost (position, maxDistance) {
  let nearestChatpost = null
  let shortestDistanceSoFar = 10000000

  for (let cp in chatposts) {
    let distance = chatposts[cp].root.position.distanceTo(position)
    if (distance < shortestDistanceSoFar && distance < maxDistance) {
      shortestDistanceSoFar = distance
      nearestChatpost = chatposts[cp]
    }
  }

  return nearestChatpost
}
window.findNearestChatpost = findNearestChatpost

function addMessage(msg) {
  localPlayer().setThought(msg)
  network.broadcastPlayerThought(msg)
}

// Creates a sign post here, and if one already exists, adds to it by making a chat pole
function addMessageToChatpost(msg) {
  const player = players.local
  let chatpost = findNearestChatpost(player.root.position, 200)
  
  let cposts

  if (!chatpost) {
    chatpost = new Chatpost(
      player.root.position,
      window.stage,
      window.rsrc, {
        onDestroy: (chatpost) => {
          let cposts = bus.fetch('/chatposts')
          console.log("Destroying", chatpost.uuid)
          delete cposts.hashmap[chatpost.uuid]
          bus.save(cposts)
        }
      }
    )
    window.stage.addEntity(chatpost)  
    // Save local cache of Chatpost objects
    chatposts[chatpost.uuid] = chatpost

    // Broadcast creation of chatpost to network
    cposts = bus.fetch('/chatposts')
    if (!cposts.hashmap) { cposts.hashmap = {} }
    cposts.hashmap[chatpost.uuid] = {
      position: player.root.position,
      messages: []
    }
    bus.save(cposts)
  }
  
  chatpost.addMessage(player.opts.name, msg)

  // Broadcast message to network
  cposts = bus.fetch('/chatposts')
  cposts.hashmap[chatpost.uuid].messages.push({
    name: player.opts.name,
    text: msg
  })
  bus.save(cposts)
}

