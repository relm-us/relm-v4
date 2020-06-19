import { showToast } from './lib/Toast.js'
import { showInfoAboutObject } from './show_info_about_object.js'

import { relmExport } from './lib/relmExport.js'
import { muteAudio, unmuteAudio } from './avchat.js'
import { avatarOptionsOfGender } from './avatars.js'
import { teleportToOtherRelm } from './teleportal.js'

import {
  take,
  takeOne,
  joinAll,
  parseCommandString,
  actionToEachObject,
  numberOfObjects,
} from './command_utils.js'

/**
 * @typedef CommandEnv
 * @property {Network} network The network
 * @property {Stage} stage The stage
 * @property {Player} player The local player
 * @property {Array<any>} objects The selected objects to act on
 * @property {THREE.Vector3} position The position to act at
 */

function diamondCreate(message) {
  return (env) => {
    const position = new THREE.Vector3()
    position.copy(env.position)
    // Make it about head-height by default
    position.y += 130
    
    env.network.permanents.create({
      type: 'diamond',
      goals: {
        diamond: {
          text: message,
          open: true,
        },
        position: {
          x: position.x,
          y: position.y,
          z: position.z,
        }
      }
    })
  }
}

function diamondUpdate({ message, label }) {
  return actionToEachObject((entity, env) => {
    let updated = false
    if (message && entity.goals.diamond) {
      entity.goals.diamond.update({ text: message })
      updated = true
    }
    if (label && entity.goals.label) {
      entity.goals.label.update({
        text: label,
        ox: 0,
        oy: -60,
        oz: 0,
      })
      updated = true
    }
    return updated /* add to success count */
  })
}


function groundCreate(textureUrl) {
  return (env) => {
    env.network.permanents.create({
      type: 'ground',
      goals: {
        ground: {
          seed: Math.floor(Math.random() * 10000) + 100
        },
        position: {
          x: env.position.x,
          y: env.position.y,
          z: env.position.z,
        },
        asset: {
          url: textureUrl
        }
      }
    })    
  }
}

function groundUpdate({ type, size, repeat, seed }) {
  return actionToEachObject((entity, env) => {
    if (entity.type === 'ground') {
      entity.goals.ground.update({
          type: type || entity.goals.ground.get('type'),
          size: size || entity.goals.ground.get('size'),
          repeat: repeat || entity.goals.ground.get('repeat'),
          seed: seed || entity.goals.ground.get('seed'),
      })
      return true /* add to success count */
    }
  })
}

function portalCreate({ relm, x = null, y = null, z = null }) {
  return (env) => {
    env.network.permanents.create({
      type: 'teleportal',
      goals: {
        position: {
          x: env.position.x,
          y: env.position.y,
          z: env.position.z,
        },
        portal: {
          relm: relm,
          dx: x,
          dy: y,
          dz: z,
        }
      }
    })
  }
}

function portalUpdate({ relm, x = null, y = null, z = null }) {
  return actionToEachObject((entity, env) => {
    if (entity.type === 'teleportal') {
      entity.goals.portal.update({
          relm: relm,
          dx: x,
          dy: y,
          dz: z,
      })
      return true /* add to success count */
    }
  })
}

function portalSetRadius(radius) {
  const r = parseInt(radius, 10)
  if (r < 15) throw Error(`Portal radius needs to be at least 15`)
  return actionToEachObject((object, env) => {
    if (object.setRadius) {
      object.setRadius(r)
      env.network.setEntity(object)
      return true /* add to success count */
    }
  })
}

function objectScale(entity, { x, y, z }) {
  const scaleGoal = entity.goals.scale
  if (scaleGoal) {
    scaleGoal.update({
      x: x || scaleGoal.get('x'),
      y: y || scaleGoal.get('y'),
      z: z || scaleGoal.get('z'),
    }, Date.now() + 2000)
    return true /* add to success count */
  } else {
    showToast(`This object can't be scaled`)
  }
}

function objectMove(entity, { x, y, z }) {
  const posGoal = entity.goals.position
  if (posGoal) {
    posGoal.update({
      x: posGoal.get('x') + (x || 0),
      y: posGoal.get('y') + (y || 0),
      z: posGoal.get('z') + (z || 0),
    }, Date.now() + 2000)
    return true /* add to success count */
  } else {
    showToast(`This object can't be moved`)
  }
}

/**
 * 
 * @param {EntityShared} entity 
 * @param {Object} axes - axes to rotate, in degrees 
 */
function objectRotate(entity, { x, y, z }) {
  const rotGoal = entity.goals.rotation
  if (rotGoal) {
    rotGoal.update({
      x: x !== undefined ? (x * -THREE.Math.DEG2RAD) : rotGoal.get('x'),
      y: y !== undefined ? (y * -THREE.Math.DEG2RAD) : rotGoal.get('y'),
      z: z !== undefined ? (z * -THREE.Math.DEG2RAD) : rotGoal.get('z'),
    }, Date.now() + 2000)
    return true /* add to success count */
  } else {
    throw Error(`This object can't rotate`)
  }
}
/**
 * List of commands, in alphabetical order. Each command is executed in the game's thought box by prefixing with '/'.
 * Command functions are passed `args` as a single argument, and return a function with the following type signature:
 * 
 * @param {Array<string>} args The optional arguments passed to the command
 * @returns { (env:CommandEnv) => void } The action that will be performed, given a CommandEnv
 */
const commands = {
  character: (args) => {
    const [gender, avatar] = take(2, args, `Shouldn't there be a [GENDER] and [AVATAR] after '/character'? e.g. '/character f 4'`)
    const index = parseInt(avatar, 10)
    if (!['f', 'm'].includes(gender)) {
      throw Error(`Pick 'f' or 'm' for your character's gender`)
    } else if (avatar < 0 || avatar > 8) {
      throw Error(`Pick a number between 0 and 8 for your avatar`)
    } else {
      return (env) => {
        const avatarOptions = avatarOptionsOfGender(gender)
        env.player.goals.animationMesh.update({ v: avatarOptions[index].avatarId })
      }
    }
  },
  destroy: (args) => {
    const iAmSure = takeOne(args, `Are you sure?`)
    if (iAmSure === 'iamsure') {
      return (env) => {
        network.entitiesMap.forEach((_, uuid) => {
          network.permanents.remove(uuid)
        })
      }
    }
  },
  diamond: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/diamond'? e.g. 'create', 'label', 'message'`)
    switch (subCommand) {
      case 'create': return diamondCreate(joinAll(args))
      case 'label': return diamondUpdate({ label: joinAll(args) })
      case 'message': return diamondUpdate({ message: joinAll(args) })
      default: throw Error(`Is ${subCommand} a '/diamond' subcommand?`)
    }
  },
  export: (args) => {
    return (env) => {
      const importExport = document.getElementById('import-export')
      const importButton = document.getElementById('import-button')
      const checkboxWrapper = document.getElementById('export-only-selected')
      let checkbox = document.getElementById('export-only-selected-checkbox')
      const textarea = document.getElementById('import-export-data')
      importExport.classList.remove('hide')
      importButton.classList.add('hide')
      checkboxWrapper.classList.remove('hide')
      
      const exportToTextarea = (selectedOnly) => {
        const data = relmExport(env.stage, env.network, selectedOnly)
        textarea.value = JSON.stringify(data, null, 2)
      }
      
      // Ugly hack to remove all previous event listeners:
      {
        var newElement = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newElement, checkbox);
        checkbox = newElement
      }

      checkbox.addEventListener('change', (event) => {
        exportToTextarea(checkbox.checked)
      })
      
      checkbox.checked = false
      exportToTextarea(false)
    }
  },
  import: (args) => {
    return (env) => {
      const importExport = document.getElementById('import-export')
      const importButton = document.getElementById('import-button')
      const checkboxWrapper = document.getElementById('export-only-selected')
      const checkbox = document.getElementById('export-only-selected-checkbox')
      const textarea = document.getElementById('import-export-data')
      textarea.value = ''
      importExport.classList.remove('hide')
      importButton.classList.remove('hide')
      checkboxWrapper.classList.add('hide')
      setTimeout(() => { textarea.focus() } , 100)
    }
  },
  go: (args) => {
    const coords = { x: 0, y: 0, z: 0 }
    switch (args.length) {
      case 0: break
      case 1:
        teleportToOtherRelm({ relm: takeOne(args) })
        break
      case 2:
        coords.x = parseFloat(takeOne(args))
        coords.z = parseFloat(takeOne(args))
        break
      case 3:
        const relm = takeOne(args)
        const x = takeOne(args)
        const z = takeOne(args)
        teleportToOtherRelm({ relm, x, z })
        break
      default:
        throw Error(`Expecting x z coords or nothing (i.e. just '/home')`)
    }
    return (env) => {
      env.player.goals.position.update(coords)
    }
  },
  ground: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/ground'? e.g. 'create', 'size', 'type'`)
    switch (subCommand) {
      case 'create': return groundCreate(takeOne(args, `Need a [TEXTURE]`))
      case 'size': return groundUpdate({ size: parseFloat(takeOne(args, `Need a [SIZE]`)) })
      case 'type': return groundUpdate({ type: takeOne(args, `Need a [SIZE]`) })
      case 'repeat': return groundUpdate({ repeat: parseFloat(takeOne(args, `Need a [REPEAT]`)) })
      case 'random': return groundUpdate({ type: 'rough', seed: Math.floor(Math.random() * 10000) + 100 })
      default: throw Error(`Is ${subCommand} a '/ground' subcommand?`)
    }
  },
  mode: (args) => {
    const mode = takeOne(args, `There are a couple of modes: 'normal' and 'editor'`)
    return (env) => {
      switch (mode) {
        case 'e':
        case 'edit':
        case 'editor':
          env.stage.enableEditorMode()
          break
        case 'n':
        case 'normal':
          env.stage.disableEditorMode()
          break
        default: new Error(`Is there a ${mode} mode? Try 'normal' or 'editor'`)
      }
    }
  },
  mute: (args) => {
    return (env) => {
      muteAudio()
    }
  },
  unmute: (args) => {
    return (env) => {
      unmuteAudio()
    }
  },
  name: (args) => {
    const name = takeOne(args, `Shouldn't there be a [NAME] after '/name'?`)
    return (env) => {
      env.player.goals.label.update({ text: name })
    }
  },
  object: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/object'? e.g. 'clone', 'delete', 'scale'`)
    switch (subCommand) {
      case 'clone': return actionToEachObject((entity, env) => {
        let count
        try { count = parseInt(takeOne(args), 10) }
        catch (e) { count = 1 }
        const goalsDesc = entity.goals.toDesc()
        for (let i = 0; i < count; i++) {
          goalsDesc.position.x += 25
          goalsDesc.position.z += 25
          network.permanents.create({ type: entity.goals.type, goals: goalsDesc })
        }
        return true /* add to success count */
      })
      

      case 'delete': return actionToEachObject((entity, env) => {
        network.permanents.remove(entity.uuid)
        return true /* add to success count */
      })
      

      case 'f':
      case 'fetch': return actionToEachObject((entity, env) => {
        entity.goals.position.update({
          x: env.position.x,
          y: entity.goals.position.get('y'),
          z: env.position.z,
        }, Date.now() + 4000)
        return true /* add to success count */
      })
      
      
      case 'flip': return actionToEachObject((entity, env) => {
        let axis = 'x'
        try { axis = (takeOne(args) == 'y' ? 'y' : 'x') }
        catch (e) { }
        
        const flipGoal = entity.goals.flip
        if (flipGoal) {
          flipGoal.update({
            x: axis === 'x' ? (!flipGoal.get('x')) : flipGoal.get('x'),
            y: axis === 'y' ? (!flipGoal.get('y')) : flipGoal.get('y'),
          }, Date.now() + 2000)
          return true /* add to success count */
        } else {
          throw Error(`This object isn't flippable`)
        }
      })
      
      
      case 'fold': return actionToEachObject((entity, env) => {
        const value = parseFloat(takeOne(args, `Shouldn't there be a [FOLD] value after '/object fold'?`))
        if (value < 0 || value > 1) {
          throw Error('The fold value should be between 0 and 1')
        }
        const foldGoal = entity.goals.fold
        if (foldGoal) {
          foldGoal.update({ v: value }, Date.now() + 2000)
          return true /* add to success count */
        } else {
          throw Error(`This object isn't foldable`)
        }
      })
      
      
      case 'i':
      case 'info': return actionToEachObject((entity, env) => {
        showInfoAboutObject(entity)
        return true /* add to success count */
      })
      

      case 'locktoggle': 
        let lockCount = 0
        let unlockCount = 0
        return actionToEachObject((object, env) => {
          if (object.isUiLocked) {
            if (object.isUiLocked()) {
              object.uiUnlock()
              unlockCount++
              env.stage.selection.select([object], '-')
              network.setEntity(object)
            } else {
              object.uiLock()
              lockCount++
              env.stage.selection.select([object], '-')
              network.setEntity(object)
            }
            return true
          }
        }, () => {
          if (lockCount > 0 && unlockCount > 0) {
            showToast(`Locked ${numberOfObjects(lockCount)} and unlocked ${numberOfObjects(unlockCount)}`)
          } else if (lockCount > 0) {
            showToast(`Locked ${numberOfObjects(lockCount)}`)
          } else if (unlockCount > 0) {
            showToast(`Unlocked ${numberOfObjects(unlockCount)}`)
          }
        })
      
      case 'lock': return actionToEachObject((object, env) => {
        if (object.uiLock) {
          object.uiLock()
          env.stage.selection.select([object], '-')
          network.setEntity(object)
          return true /* add to success count */
        }
      }, (count) => { showToast(`Locked ${numberOfObjects(count)}`) })

      case 'unlock': return actionToEachObject((object, env) => {
        if (object.uiUnlock) {
          object.uiUnlock()
          env.stage.selection.select([object], '-')
          network.setEntity(object)
          return true /* add to success count */
        }
      }, (count) => { showToast(`Unlocked ${numberOfObjects(count)}`) })
      

      case 'mat':
      case 'material': return actionToEachObject((entity, env) => {
        const newType = takeOne(args, `Shouldn't there be a material type after '/object material'? e.g. 'default' or 'photo'`)
        const matGoal = entity.goals.material
        if (matGoal && matGoal.get('type') !== newType) {
          matGoal.update({ type: newType })
          return true /* add to success count */
        }
      }, (count) => { showToast(`Changed material for ${numberOfObjects(count)}`) })
      

      case 'layer': return actionToEachObject((entity, env) => {
        const layer = takeOne(args, `Shouldn't there be a number after '/object layer'? e.g. 0, 1, ... 100`)
        const orderGoal = entity.goals.renderOrder
        if (orderGoal) {
          orderGoal.update({ v: parseFloat(layer) })
          const posGoal = entity.goals.position
          const y = posGoal.get('y')
          if (y >= 0 && y < 1.0) {
            posGoal.update({ y: layer / 100 })
          }
          return true /* add to success count */
        }
      }, (count) => { showToast(`Changed layer for ${numberOfObjects(count)}`) })
      

      case 'orient': return actionToEachObject((entity, env) => {
        const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/object orient'? e.g. 'up' or 'down'`)
        switch (subCommand) {
          case 'up':
            entity.goals.rotation.update({ x: 0, y: 0, z: 0 }, Date.now() + 2000)
            entity.goals.renderOrder.update({ v: 100 })
            break
          case 'down':
            entity.goals.rotation.update({ x: 90 * -THREE.Math.DEG2RAD, y: 0, z: 0 }, Date.now() + 2000)
            const y = entity.goals.position.get('y')
            let layer = (y >= 0 && y < 1.0) ? Math.floor(y * 100) : 100
            entity.goals.renderOrder.update({ v: layer })
            break
          case 'left':
            entity.goals.rotation.update({ x: 0, y: -45 * -THREE.Math.DEG2RAD, z: 0 }, Date.now() + 2000)
            entity.goals.renderOrder.update({ v: 100 })
            break
          case 'right':
            entity.goals.rotation.update({ x: 0, y: 45 * -THREE.Math.DEG2RAD, z: 0 }, Date.now() + 2000)
            entity.goals.renderOrder.update({ v: 100 })
            break
          default:
            throw Error(`Is ${subCommand} an '/orient' subcommand?`)
        }
        return true /* add to success count */
      })
      

      case 'rx':
      case 'rotatex': return actionToEachObject((entity, env) => {
        const degrees = parseFloat(takeOne(args, `Shouldn't there be a [DEG] value after '/object rotatex'?`))
        return objectRotate(entity, { x: degrees })
      })
      
      case 'ry':
      case 'rotate': // for backwards compat
      case 'rotatey': return actionToEachObject((entity, env) => {
        const degrees = parseFloat(takeOne(args, `Shouldn't there be a [DEG] value after '/object rotatey'?`))
        return objectRotate(entity, { y: degrees })
      })
      
      case 'rz':
      case 'rotatez': return actionToEachObject((entity, env) => {
        const degrees = parseFloat(takeOne(args, `Shouldn't there be a [DEG] value after '/object rotatez'?`))
        return objectRotate(entity, { z: degrees })
      })
      
      

      case 's':
      case 'scale': return actionToEachObject((entity, env) => {
        const scale = parseFloat(takeOne(args, `Shouldn't there be a [SCALE] value after '/object scale'?`))
        return objectScale(entity, { x: scale, y: scale, z: scale })
      })
      
      case 'sx':
      case 'scalex': return actionToEachObject((entity, env) => {
        const scale = parseFloat(takeOne(args, `Shouldn't there be a [SCALE] value after '/object scalex'?`))
        return objectScale(entity, { x: scale })
      })
      
      case 'sy':
      case 'scaley': return actionToEachObject((entity, env) => {
        const scale = parseFloat(takeOne(args, `Shouldn't there be a [SCALE] value after '/object scaley'?`))
        return objectScale(entity, { y: scale })
      })
      
      case 'sz':
      case 'scalez': return actionToEachObject((entity, env) => {
        const scale = parseFloat(takeOne(args, `Shouldn't there be a [SCALE] value after '/object scalez'?`))
        return objectScale(entity, { z: scale })
      })
      
      
      case 'to': return actionToEachObject((entity, env) => {
        const x = takeOne(args, 'Requires [X] [Y] [Z]')
        const y = takeOne(args, 'Requires [X] [Y] [Z]')
        const z = takeOne(args, 'Requires [X] [Y] [Z]')
        const posGoal = entity.goals.position
        if (posGoal) {
          posGoal.update({ x, y, z }, Date.now() + 2000)
          return true /* add to success count */
        } else {
          showToast(`This object can't be moved`)
        }
      })
      

      case 'x': return actionToEachObject((entity, env) => {
        const delta = parseFloat(takeOne(args, `Shouldn't there be an [X] value after '/object x'?`))
        return objectMove(entity, { x: delta })
      })
      
      case 'y': return actionToEachObject((entity, env) => {
        const delta = parseFloat(takeOne(args, `Shouldn't there be a [Y] value after '/object y'?`))
        return objectMove(entity, { y: delta })
      })
      
      case 'z': return actionToEachObject((entity, env) => {
        const delta = parseFloat(takeOne(args, `Shouldn't there be a [Z] value after '/object z'?`))
        return objectMove(entity, { z: delta })
      })
      

      default: throw Error(`Is ${subCommand} a '/object' subcommand?`)
    }
  },
  reset: (args) => {
    return (env) => {
      env.stage.continueRendering = false
      setTimeout(() => {
        window.localStorage.clear()
        window.indexedDB.deleteDatabase('relm')
        window.location.reload()
      }, 100)
    }
  },
  select: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/select'? e.g. 'all'`)
    const conditionallySelectAll = (setOperation, condition) => {
      return (env) => {
        env.stage.forEachEntity((entity) => {
          if (entity.receivesPointer && condition(entity)) {
            env.stage.selection.select([entity], setOperation)
          }
        })
      }
    }
    switch (subCommand) {
      case 'all': return conditionallySelectAll('+', (entity) => !entity.isEffectivelyUiLocked())
      case 'none': return conditionallySelectAll('-', (entity) => !entity.isEffectivelyUiLocked())
      case 'locked': return conditionallySelectAll('+', (entity) => entity.isUiLocked())
      case 'unlocked': return conditionallySelectAll('+', (entity) => !entity.isUiLocked())
      default: throw Error(`Is ${subCommand} a '/sign' subcommand?`)
    }
  },
  snap: (args) => {
    const size = takeOne(args, `Shouldn't there be a [SIZE] after '/snap'? or 'off'?`)
    return (env) => {
      if (size === 'off') {
        stage.setGridSnap(null)
      } else {
        stage.setGridSnap(parseFloat(size))
      }
    }
  },
  stop: (args) => {
    return (env) => {
      env.stage.continueRendering = false
    }
  },
  portal: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/portal'? e.g. 'create', 'url', 'radius'`)
    switch (subCommand) {
      case 'create':
        switch (args.length) {
          case 0:
            return portalCreate()
          case 1:
            return portalCreate({
              relm: takeOne(args)
            })
          case 2:
            return portalCreate({
              x: parseFloat(takeOne(args)),
              z: parseFloat(takeOne(args)),
            })
          case 3:
            return portalCreate({
              relm: takeOne(args),
              x: parseFloat(takeOne(args)),
              z: parseFloat(takeOne(args)),
            })
          default:
            throw Error('Creating a portal can have one of: [RELM], or [X] [Z], or [RELM] [X] [Z]')
        }
      case 'update':
        switch (args.length) {
          case 1:
            return portalUpdate({
              relm: takeOne(args)
            })
          case 2:
            return portalUpdate({
              x: parseFloat(takeOne(args)),
              z: parseFloat(takeOne(args)),
            })
          case 3:
            return portalUpdate({
              relm: takeOne(args),
              x: parseFloat(takeOne(args)),
              z: parseFloat(takeOne(args)),
            })
          default:
            throw Error('Updating a portal can have one of: [RELM], or [X] [Z], or [RELM] [X] [Z]')
          
        }
      default: throw Error(`Is ${subCommand} a '/portal' subcommand?`)
    }
  },
  whereami: (args) => {
    return (env) => {
      const pos = env.position
      showToast(`You are at x: ${parseInt(pos.x, 10)}, y: ${parseInt(pos.y, 10)}, z: ${parseInt(pos.z, 10)}`)
    }
  }
}


// Shortcut commands
commands.o = commands.obj = commands.object
commands.p = commands.portal
commands.s = commands.sign


const parseCommand = (commandString) => {
  const [command, args] = parseCommandString(commandString)
  if (!command) { return null }
  
  if (commands[command]) {
    return commands[command](args)
  } else {
    throw Error(`Is '${command}' a command?`)
  }
}

export { parseCommand }
