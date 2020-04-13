import { ParticlesSystem, Randomizers, Emitter } from 'partykals'
import { SkeletonUtils } from './lib/SkeletonUtils.js'

import { Label } from './label.js'
import { DummyObject } from './dummy_object.js'
import { Entity } from './entity.js'
import { ThoughtBubble } from './thought_bubble.js'
import { cameraIdealPosition } from './stage.js'
import { defaultPlayerModel } from './player_model.js'

const {
  AnimationClip, 
  AnimationMixer, 
  MathUtils, 
  Mesh, 
  RingGeometry, 
  MeshBasicMaterial, 
  DoubleSide, 
  Vector3, 
  Raycaster, 
  Object3D, 
  ArrowHelper,
  AnimationUtils
} = THREE

const SKYREALM_HEIGHT = 5000
const CAMERA_SKYREALM_ZOOMOUT = 1000
const TELEPORT_ARRIVED_DISTANCE = 5.0
const MoveMode = {
  moveSelf: 0,
  teleportUp: 1,
  teleportDown: 2
}



class Player extends Entity {
  constructor (stage, rsrc, model, opts) {
    super(opts)

    this.stage = stage
    this.rsrc = rsrc
    this.clips = {}
    this.opts = Object.assign({
      debug: false,
      onActionThought: () => {},
      onCloseThought: () => {}
    }, opts)

    /**
     * The `model` holds values of what/where the Player IS.
     * 
     * @type {PlayerModel}
     */
    this.model = this.defaultModel(model.playerId)

    /**
     * The `modelTarget` holds values of what/where the Player WILL be.
     * 
     * @type {PlayerModel}
     */
    this.modelTarget = this.defaultModel(model.playerId)

    this.setModel(model, true)

    this.ground = stage.ground

    this.raycaster = new Raycaster()
    this.raycaster.layers.set(1)
    this.raycasterHelper1 = new ArrowHelper()
    this.stage.scene.add(this.raycasterHelper1)
    this.raycasterHelper2 = new ArrowHelper()
    this.stage.scene.add(this.raycasterHelper2)
    this.raycasterSource = new DummyObject({ visible: this.opts.debug, w: 50, h: 50, l: 50})
    this.raycasterPos = new Vector3()
    this.raycasterRot = new Vector3()

    this.moveMode = MoveMode.moveSelf

    this.createPersonalSpaceRing(200.0)

    this.stage.addEntity(this)
  }

  /**
   * Create a PlayerModel with playerId set.
   * 
   * @param {string} playerId 
   * @returns {PlayerModel}
   */
  defaultModel (playerId) {
    // set the read-only playerId model property
    return Object.assign( defaultPlayerModel(), { playerId } )
  }

  setModel (model, instantaneous = false) {
    if (!model) { console.trace('model is required') }

    this.setName(model.name)
    this.setGender(model.gender)
    this.setAvatarId(model.avatarId)
    this.setThought(model.thought)
    this.setPosition(model.position, instantaneous)
    this.setQuaternion(model.quaternion, instantaneous)
  }

  setupName () {
    this.nametag = new Label(this.root, stage.camera)
  }

  setName (name) {
    this.modelTarget.name = name
  }

  updateName (delta) {
    if (this.modelTarget.name && this.model.name !== this.modelTarget.name) {
      this.model.name = this.modelTarget.name
    }
    // Since nametags are just HTML and CSS we have to 'manually' project
    // their position on to the screen
    this.nametag.project(
      this.model.name,
      window.innerWidth,
      window.innerHeight,
      0,
      20
    )
  }

  teardownName () {
    this.nametag.destroyDomElement()
  }


  setGender (gender) {
    this.modelTarget.gender = gender
  }

  updateGender (delta) { }

  setThought (text) {
    this.modelTarget.thought = text
  }

  updateThought (delta) {
    if (this.modelTarget.thought && this.model.thought !== this.modelTarget.thought) {
      // Create the ThoughtBubble object if it doesn't exist yet
      if (!this.thought) {
        this.thought = new ThoughtBubble(stage.camera,
          (bubble, event) => {
            // Action callback
            this.opts.onActionThought(this, bubble)
          }, (bubble, event) => {
            // Close callback
            this.opts.onCloseThought(this)
            bubble.clearText()
          }
        )
      }

      const text = this.modelTarget.thought
      // Update current model to target model
      this.model.thought = text
      // Actually update the thought bubble on screen
      this.thought.setText(text)
    }
  }

  setAvatarId (avatarId) {
    this.modelTarget.avatarId = avatarId
  }

  updateAvatarId (delta) {
    if (this.modelTarget.avatarId && this.model.avatarId !== this.modelTarget.avatarId) {
      this.model.avatarId = this.modelTarget.avatarId
      this.setupAvatar()
    }
  }

  setPosition (pos) {
    this.modelTarget.position.set(pos.x, pos.y, pos.z)
  }

  updatePosition (delta) {
    const distance = this.root.position.distanceTo(this.moveTarget.position)
    if (distance > 100) {
      this.root.position.set(pos.x, pos.y, pos.z)
    }
  }

  setQuaternion (qua) {
    this.modelTarget.quaternion.set(qua.x, qua.y, qua.z, qua.w)
  }

  updateQuaternion (delta) {
    // TODO: slerp
    this.root.quaternion.set(qua.x, qua.y, qua.z, qua.w)
  }

  setOpacity (value) {
    this.modelTarget.opacity = value
  }

  updateOpacity (delta) {
    if (this.modelTarget.avatarId && this.model.avatarId !== this.modelTarget.avatarId) {
      this.model.opacity = this.modelTarget.opacity
      // Traverse the player's SkinnedMesh and set opacity on any associated materials
      if (this.object3d) {
        this.object3d.traverse(o => {
          if (o.isMesh) { o.material.opacity = this.model.opacity }
        })
      }
    }
  }

  onAddEntity (stage) {
    super.onAddEntity(stage)
    stage.scene.add(this.moveTarget, this.turnTarget)
  }

  onRemoveEntity (stage) {
    super.onRemoveEntity(stage)
    if (this.nametag) {
    }
    if (this.thought) {
      this.thought.clearText()
    }
    stage.scene.remove(this.moveTarget, this.turnTarget)
  }

  initializeParticles () {
    this.particlesRoot = this.particlesRoot || new Object3D()
    this.particlesRoot.position.copy(this.root.position)
    this.particlesRoot.position.x -= 5 // center the particles better
    this.particlesRoot.position.y -= 50 // start emitting particles below the ground
    this.stage.scene.add(this.particlesRoot)

    this.particles = this.particles || new ParticlesSystem({
      container: this.particlesRoot,
      particles: {
        //size: new Randomizers.MinMaxRandomizer(300, 700),
        ttl: 2.1,
        offset: new Randomizers.SphereRandomizer(50),
        velocity: new Vector3(0, 300, 0),
        startAlpha: 0.0,
        endAlpha: 1,
		startSize: new Randomizers.MinMaxRandomizer(700, 1400),
		endSize: 0,
        startAlphaChangeAt: 0,
        blending: "additive",
        texture: this.rsrc.get('sparkle')
      },
      system: {
        particlesCount: 500,
        scale: 400,
        emitters: new Emitter({
          onInterval: new Randomizers.MinMaxRandomizer(4, 17),
          interval: new Randomizers.MinMaxRandomizer(0, 0.15)
        }),
        speed: 1.7
      }

    })
	
	this.particlesRoot.children[0].material.depthWrite = false;
	
    //this.particlesRoot2 = this.particlesRoot2 || new Object3D()
    //this.particlesRoot2.position.copy(this.root.position)
	//this.particlesRoot2.position.x -= 5 // center the particles better
	//this.particlesRoot2.position.y -= 50 // start emitting particles below the ground
    //this.stage.scene.add(this.particlesRoot2)

    this.particles2 = this.particles2 || new ParticlesSystem({
      container: this.particlesRoot,
      particles: {
        //size: new Randomizers.MinMaxRandomizer(300, 700),
        ttl: 0.4,
        offset: new Randomizers.SphereRandomizer(80),
        velocity: new Vector3(0, 300, 0),
        startAlpha: 0.10,
        endAlpha: 0.10,
		startSize: new Randomizers.MinMaxRandomizer(900, 1800),
		endSize: new Randomizers.MinMaxRandomizer(10, 25),
        startAlphaChangeAt: 0,
        blending: "additive",
        texture: this.rsrc.get('sparkle')
      },
      system: {
        particlesCount: 2500,
        scale: 400,
        emitters: new Emitter({
          onInterval: new Randomizers.MinMaxRandomizer(100, 200),
          interval: new Randomizers.MinMaxRandomizer(0, 0.15)
        }),
        speed: 0.3
      }

    })
	
	this.particlesRoot.children[1].material.depthWrite = false;
	//this.particlesRoot.children[1].material.depthTest = false;
	
  }

  removeParticles () {
	this.particles.dispose()
	this.particles2.dispose()
	this.stage.scene.remove(this.particlesRoot)
	//this.stage.scene.remove(this.particlesRoot2)
  }

  detectCollisions () {
    this.raycaster.far = 50;
    
    let pos = new Vector3()
    let dir = new Vector3()

    this.turnTarget.position.copy(this.root.position)
    this.turnTarget.position.y += 25
    pos.copy(this.moveTarget.position)
    pos.y += 25
    this.turnTarget.lookAt(pos)

    this.turnTarget.getWorldPosition(pos)
    this.turnTarget.getWorldDirection(dir)
    this.raycaster.set(pos, dir.normalize())

    // this.raycasterHelper1.position.copy(pos)
    // this.raycasterHelper1.setDirection(dir)
    // this.raycasterHelper1.setLength(100)
    
    let intersections = this.raycaster.intersectObjects(this.stage.scene.children, true)
    for (let isec of intersections) {
      isec.object.getWorldPosition(this.raycasterSource.position)
      // this.raycasterSource.position.y = this.root.position.y
      pos.copy(this.root.position)
      pos.y = isec.object.position.y
      this.raycasterSource.lookAt(pos)
      this.raycasterSource.getWorldDirection(dir)
      dir.y = 0
      this.root.position.addScaledVector(dir.normalize(), 5)

      // this.raycasterHelper2.position.copy(this.raycasterSource.position)
      // this.raycasterHelper2.setDirection(dir)
      // this.raycasterHelper2.setLength(300)
    }

  }

  setMeshDefaults (mesh) {
    mesh.castShadow = true
    mesh.receiveShadow = true
    if (mesh.material) {
      mesh.material.metalness = 0.0
      mesh.material.transparent = true
    }
    return mesh
  }

  getClonedAvatarFromPeopleResource (avatarId) {
    let object3d
    this.rsrc.get('people').scene.traverse(o1 => {
      if (o1.name === avatarId) { // Object3D, contains Bone & SkinnedMesh
        // Find mesh inside avatar container
        o1.traverse(o2 => {
          if (o2.isMesh) { this.setMeshDefaults(o2) }
        })
        object3d = SkeletonUtils.clone(o1)
      }
    })
    return object3d
  }

  setupAvatar () {
    const avatarId = this.model.avatarId
    // console.log('setupAvatar', this.model.avatarId)

    if (!avatarId) {
      console.trace('Player has no avatarId set', avatarId)
      return
    }
    const clonedObject3d = this.getClonedAvatarFromPeopleResource(avatarId)

    if (!clonedObject3d) {
      console.error('Unable to find avatar\'s mesh in GLTF scene', avatarId, this.rsrc.get('people'))
      return
    }
    
    if (this.object3d) {
      this.root.remove(this.object3d)
    }
    this.object3d = clonedObject3d
    this.object3d.scale.set(1, 1, 1)
    this.root.add(this.object3d)

    this.mixer = new AnimationMixer(this.object3d)
    for (const action of ['walking', 'falling']) {
      const animName = avatarId.replace('armature', action)
      const animation = AnimationClip.findByName(this.rsrc.get('people').animations, animName)
      // console.log("add animation", action, animName, animation)
      if (animation) {
        this.clips[action] = this.mixer.clipAction(animation)
        if (action === 'walking') {
          // This is a "poor man's" idling animation: basically we pick a frame inside
          // the walking animation and use that as the "neutral" pose. Not ideal, but
          // better than stopping the walking animation at any old pose.
          let idleClip = AnimationUtils.subclip(animation, 'idle', 10, 10);
          this.clips.idling = this.mixer.clipAction(idleClip)
        }
      } else {
        console.error('Unable to find animation clip', animName)
      }
    }
    // console.log('setupAvatar mixer', this.mixer)
  }

  createPersonalSpaceRing (radius) {
    var geometry = new RingGeometry(radius - 1.0, radius + 1.0, 64, 6)
    var material = new MeshBasicMaterial({
      color: 0xff9900,
      side: DoubleSide,
      wireframe: false,
      transparent: true,
      opacity: 0.6
    })
    this.personalSpace = new Mesh(geometry, material)
    this.personalSpace.position.y = 1
    this.personalSpace.rotation.x = -Math.PI * 0.5
    this.root.add(this.personalSpace)
  }

  teleportUp () {
    console.log('teleportUp')
    console.log('this.root.position:', this.root.position)
    this.teleportTimer = 0
    this.moveMode = MoveMode.teleportUp
  }

  teleportDown () {
    console.log('teleportDown')
    this.teleportTimer = 0
    this.moveMode = MoveMode.teleportDown
  }

  isAutonomous () {
    return this.moveMode === MoveMode.moveSelf
  }

  getMoveTargetFromControls (controls, range = 100) {
    let x = this.root.position.x
    const y = this.root.position.y
    let z = this.root.position.z

    if (controls.up) {
      z += range
    } else if (controls.down) {
      z -= range
    }

    if (controls.left) {
      x += range
    } else if (controls.right) {
      x -= range
    }

    return { x, y, z }
  }

  setMoveTarget (target) {
    if (this.moveMode === MoveMode.moveSelf) {
      this.moveTarget.position.set(target.x, target.y, target.z)
      return true
    }
    return false
  }

  renderNameTag (delta) {
    if (this.nametag) {
    }
  }

  renderThoughtBubble (delta) {
    if (this.thought) {
      const walkCycleTime = this.clips.walking.time / this.clips.walking.getClip().duration
      const bounceMotion = Math.sin(walkCycleTime * Math.PI * 4 + Math.PI/8) * 2
      this.thought.position.copy(this.root.position)
      this.thought.position.y += 165 + bounceMotion
      this.thought.position.x -= 30
      this.thought.project(window.innerWidth, window.innerHeight)
    }
  }

  render (delta) {
    this.renderNameTag(delta)
    this.renderThoughtBubble(delta)

    if (!this.mixer) {
      return
    }

    var myWalkSpeed = 1.7
    if (this.moveMode === MoveMode.moveSelf) {
      this.detectCollisions()
      // make character walk on terrain smoothly, using Step 1 + Step 2 below:
      if (this.root.position.y < SKYREALM_HEIGHT / 2) {
        var fastGroundCheckMode = true
        if (fastGroundCheckMode == true) {
          // Fast Ground Check (1/2): adjust the character's movetarget to sit on the terrain properly

          // setup ground variables if not already
          var groundSize = 12000
          var groundSizeHalved = groundSize / 2
          var groundArrayWidth = 70 - 1
          var groundArrayWidthHalved = groundArrayWidth / 2
          var groundOffset = -420
          var groundScaleVertical = 14
          var vertexScaleVertical = 10

          var fastXPosition = ((this.moveTarget.position.z / groundSizeHalved * -groundArrayWidthHalved) + groundArrayWidthHalved)
          var fastZPosition = ((this.moveTarget.position.x / groundSizeHalved * -groundArrayWidthHalved) + groundArrayWidthHalved)
          // console.log("Fast X: "+  fastXPosition  +" Z: "+  fastZPosition  );

          var x1 = Math.floor(fastXPosition) // left x scan
          var y1 = Math.floor(fastZPosition) // upper y scan
          // get 4 depth scans:
          var x1y1Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset
          var x2y1Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1 + 1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset
          var x1y2Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1 + 1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset
          var x2y2Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1 + 1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1 + 1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset

          var x1Strength = fastXPosition - Math.floor(fastXPosition)
          var y1Strength = fastZPosition - Math.floor(fastZPosition)

          var finalDepth = x1y1Scan * (1 - x1Strength) * (1 - y1Strength) +
              x2y1Scan * (0 + x1Strength) * (1 - y1Strength) +
              x1y2Scan * (1 - x1Strength) * (0 + y1Strength) +
              x2y2Scan * (0 + x1Strength) * (0 + y1Strength)

          // stop smashing feet, by adding a curved slope:
          var stairStepDepth = finalDepth / (groundScaleVertical * vertexScaleVertical)
          var stairStepDifferenceInverted = 1 - (stairStepDepth - Math.floor(stairStepDepth))
          var stairStepDifferenceSquared = 1 - (stairStepDifferenceInverted * stairStepDifferenceInverted)
          var stairStepDepthAddedBack = stairStepDifferenceSquared + Math.floor(stairStepDepth)
          var stairExponentialness = 0.08 // 0 = curved, 1 = straight
          finalDepth = (finalDepth * stairExponentialness)
                     + ((stairStepDepthAddedBack * (groundScaleVertical * vertexScaleVertical))*(1-stairExponentialness));
		  
          // console.log("Fast Depth (4Q):",finalDepth)
          // NOW TAKE ACTION and change the moveTarget to current depth:
          this.moveTarget.position.y = finalDepth

          // Fast Ground Check (2/2): adjust current character root position to move up or down a bit to stand on terrain properly (lerp to the position -- a bit like gravity and antigravity)

          var fastXPosition = ((this.root.position.z / groundSizeHalved * -groundArrayWidthHalved) + groundArrayWidthHalved)
          var fastZPosition = ((this.root.position.x / groundSizeHalved * -groundArrayWidthHalved) + groundArrayWidthHalved)
          // console.log("Fast X: "+  fastXPosition  +" Z: "+  fastZPosition  );

          var x1 = Math.floor(fastXPosition) // left x scan
          var y1 = Math.floor(fastZPosition) // upper y scan
          // get 4 depth scans:
          var x1y1Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset
          var x2y1Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1 + 1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset
          var x1y2Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1 + 1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset
          var x2y2Scan = this.ground.fastGroundCheckerArray[Math.floor(MathUtils.clamp(x1 + 1, 0, groundArrayWidth))][Math.floor(MathUtils.clamp(y1 + 1, 0, groundArrayWidth))] * groundScaleVertical + groundOffset

          var x1Strength = fastXPosition - Math.floor(fastXPosition)
          var y1Strength = fastZPosition - Math.floor(fastZPosition)
          var finalDepth = x1y1Scan * (1 - x1Strength) * (1 - y1Strength) +
              x2y1Scan * (0 + x1Strength) * (1 - y1Strength) +
              x1y2Scan * (1 - x1Strength) * (0 + y1Strength) +
              x2y2Scan * (0 + x1Strength) * (0 + y1Strength)

          // stop smashing feet, by adding a curved slope:
          var stairStepDepth = finalDepth / (groundScaleVertical * vertexScaleVertical)
          var stairStepDifferenceInverted = 1 - (stairStepDepth - Math.floor(stairStepDepth))
          var stairStepDifferenceSquared = 1 - (stairStepDifferenceInverted * stairStepDifferenceInverted)
          var stairStepDepthAddedBack = stairStepDifferenceSquared + Math.floor(stairStepDepth)
          var stairExponentialness = 0.08 // 0 = curved, 1 = straight
          finalDepth = (finalDepth * stairExponentialness)
                     + ((stairStepDepthAddedBack * (groundScaleVertical * vertexScaleVertical))*(1-stairExponentialness));

          // console.log("Fast Depth (4Q):",finalDepth)
          // NOW TAKE ACTION and Lerp:
          var moveVerticalDistance = finalDepth - this.root.position.y
          var lerpVerticalAlpha = MathUtils.clamp(Math.abs(50 / moveVerticalDistance) * delta * myWalkSpeed, 0, 0.5)
          this.root.position.y = this.root.position.y + (moveVerticalDistance * lerpVerticalAlpha)
        } else {
        // Do Slow Ground Check

          // Step 1 adjust the character's movetarget to sit on the terrain properly
          var verticalLineTop = new Vector3(0, 1000, 0)
          var verticalLineBottom = new Vector3(0, -1, 0) // must be normalized to length 1, ie .normalize ()
          verticalLineTop.add(this.moveTarget.position)

          var checkGroundRay = new Raycaster(verticalLineTop, verticalLineBottom, 0, SKYREALM_HEIGHT - 1)
          var checkGroundIntersects = checkGroundRay.intersectObject(this.ground)

          if (checkGroundIntersects.length > 0) {
            this.moveTarget.position.y = checkGroundIntersects[0].point.y
          }

          // step 2 adjust current character root position to move up or down a bit to stand on terrain properly (lerp to the position -- a bit like gravity and antigravity)
          // Slow Ground Check:
          var verticalLineTop = new Vector3(0, 1000, 0)
          var verticalLineBottom = new Vector3(0, -1, 0) // must be normalized to length 1, ie .normalize ()
          verticalLineTop.add(this.root.position)

          var checkGroundRay = new Raycaster(verticalLineTop, verticalLineBottom, 0, SKYREALM_HEIGHT - 1)
          var checkGroundIntersects = checkGroundRay.intersectObject(this.ground)

          if (checkGroundIntersects.length > 0) {
            var moveVerticalDistance = checkGroundIntersects[0].point.y - this.root.position.y
            var lerpVerticalAlpha = MathUtils.clamp(Math.abs(50 / moveVerticalDistance) * delta * myWalkSpeed, 0, 0.5)
            this.root.position.y = this.root.position.y + (moveVerticalDistance * lerpVerticalAlpha)
          }
        }
      }
      var tempVector = new Vector3()
      var distance = this.root.position.distanceTo(this.moveTarget.position)
      if (distance > 10) {
        // console.log("distance > 10", this.root.position, this.moveTarget.position)
        const lerpAlpha = MathUtils.clamp(1.2 * myWalkSpeed * delta / distance * 140, 0.00001, 0.5)
        this.root.position.lerp(this.moveTarget.position, lerpAlpha)

        this.turnTarget.position.copy(this.root.position)
        tempVector.copy(this.moveTarget.position) // get target position
        tempVector.y = this.root.position.y // move target's y position to be equal to current position so player lookAt remains level
        this.turnTarget.lookAt(tempVector)

        this.root.quaternion.slerp(this.turnTarget.quaternion, MathUtils.clamp(0.1 * delta * 60, 0.00001, 1))
        this.model.quaternion = this.root.quaternion

        if (!this.walkState) {
          this.walkState = true
          this.mixer.stopAllAction()
          this.clips.walking.play()
        }
      } else {
        if (this.walkState) {
          this.walkState = false
          this.clips.walking.halt(0.1).crossFadeTo(this.clips.idling, 0.5)
        }
      }
    } else if (this.moveMode === MoveMode.teleportUp) {
		var sparkleTimeDuration = 2.0
      if (!this.teleportTimer) {
        const tempVector = new Vector3()
        // console.log("a")
        this.teleportTimer = 1
        // this.clips.idle.reset().play()
        this.clips.walking.halt(0.5)
        this.turnTarget.position.copy(this.root.position)
        tempVector.copy(this.moveTarget.position) // get target position
        tempVector.z -= 100
        this.turnTarget.lookAt(tempVector)

        this.teleportReturn = new Vector3()
        this.teleportReturn.copy(this.root.position)

        this.initializeParticles()
      } else if (this.teleportTimer < sparkleTimeDuration) {
        // console.log("b")
        this.teleportTimer += 1.0 * delta
        this.root.quaternion.slerp(this.turnTarget.quaternion, 6 * delta)
        this.model.quaternion = this.root.quaternion

        // Set moveTarget to sky
        this.moveTarget.position.copy(this.root.position)
        this.moveTarget.position.y = SKYREALM_HEIGHT
        this.moveTarget.position.z -= 220
        this.moveTarget.position.x -= 350
        this.oldCameraIdealPosition = new Vector3()
        this.oldCameraIdealPosition.copy(cameraIdealPosition)
        this.newCameraIdealPosition = new Vector3(cameraIdealPosition.x, 2800, cameraIdealPosition.z - CAMERA_SKYREALM_ZOOMOUT)
      } else if (this.teleportTimer >= sparkleTimeDuration && this.root.position.distanceTo(this.moveTarget.position) >= TELEPORT_ARRIVED_DISTANCE) {
        this.teleportTimer += 1.0 * delta
        this.root.position.lerp(this.moveTarget.position, 3 * delta)
        //cameraIdealPosition.lerp(this.newCameraIdealPosition, 2 * delta)
      } else {
        this.removeParticles()

        this.root.position.copy(this.moveTarget.position)
        this.moveMode = MoveMode.moveSelf
        console.log('DONE teleport')
        // Done
      }
    } else if (this.moveMode === MoveMode.teleportDown) {
      if (!this.teleportTimer) {
        this.teleportTimer = 1
        this.clips.walking.halt(0.5)
        this.moveTarget.position.copy(this.teleportReturn)
        this.clips.walking.halt(0.5)
        this.clips.falling.reset().play()
      } else if (this.root.position.y > this.teleportReturn.y + TELEPORT_ARRIVED_DISTANCE) {
        this.teleportTimer += 1.0 * delta
        this.root.position.lerp(this.moveTarget.position, 3 * delta)
        //cameraIdealPosition.lerp(this.oldCameraIdealPosition, 2 * delta)
      } else {
        this.moveMode = MoveMode.moveSelf
        this.clips.falling.stop()
      }
    }

    // Particles
    if (this.particles) {
      this.particles.update()
    }
    if (this.particles2) {
      this.particles2.update()
    }
    // Animations
    if (this.mixer) {
      this.mixer.update(delta * myWalkSpeed)
    }
  }
}

 
export { Player }
