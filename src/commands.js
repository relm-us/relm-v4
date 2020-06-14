import { uuidv4 } from "./util"
import { showToast } from './lib/Toast.js'
import { showInfoAboutObject } from './show_info_about_object.js'

import { InteractionDiamond } from './interaction_diamond.js'
import { Teleportal } from './teleportal.js'
import { relmExport } from './lib/relmExport.js'
import { muteAudio, unmuteAudio } from './avchat.js'
import { avatarOptionsOfGender } from './avatars.js'

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

function signCreate(message) {
  return (env) => {
    const position = new THREE.Vector3()
    position.copy(env.position)
    // Make it about head-height by default
    position.y += 130
    
    const diamond = InteractionDiamond({
      uuid: uuidv4(),
      type: 'diamond',
      // TODO: `link` should be renamed to something like `message`
      link: message,
      position,
    })
    diamond.object.position.copy(position)
    env.network.setEntity(diamond)
  }
}

function signSetLabel(label) {
  return actionToEachObject((object, env) => {
    if (object.setLabel) {
      object.setLabel(label)
      env.network.setEntity(object)
      return true /* add to success count */
    }
  })
}

function signSetMessage(message) {
  return actionToEachObject((object, env) => {
    if (object.setMessage) {
      object.setMessage(message)
      env.network.setEntity(object)
      return true /* add to success count */
    }
  })
}

function portalCreate(url) {
  return (env) => {
    const portal = Teleportal({
      uuid: uuidv4(),
      type: 'teleportal',
      target: player,
      url: url,
      active: false,
      radius: 150,
      position: env.position,
      speed: 500,
    })
    portal.object.position.copy(env.position)
    env.network.setEntity(portal)
    env.stage.add(portal)
  }
}

function portalSetUrl(url) {
  return actionToEachObject((object, env) => {
    if (object.state.url) {
      object.state.url.target = url
      env.network.setEntity(object)
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
  home: (args) => {
    if (args.length > 0) { throw Error(`I hope it's ok to ignore ${args.join(' ')}!`) }
    else return (env) => {
      env.player.warpToPosition({ x: 0, y: 0, z: 0 })
    }
  },
  mode: (args) => {
    const mode = takeOne(args, `There are a couple of modes: 'normal' and 'editor'`)
    return (env) => {
    console.log('env', env)
      switch (mode) {
        case 'editor':
          env.stage.enableEditorMode()
          break
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
      env.player.setLabel(name)
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
      case 'fetch': return actionToEachObject((object, env) => {
        const destination = new THREE.Vector3()
        destination.copy(env.position)
        destination.y = object.state.position.now.y
        object.setPosition(destination)
        env.network.setEntity(object)
        return true /* add to success count */
      })
      case 'i':
      case 'info': return actionToEachObject((object, env) => {
        showInfoAboutObject(object)
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
  orient: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/orient'? e.g. 'up', 'down', 'left', 'right'`)
    switch (subCommand) {
      case 'up': return actionToEachObject((object, env) => {
        object.state.orientation.target = 0
        network.setEntity(object)
        return true /* add to success count */
      })
      case 'down': return actionToEachObject((object, env) => {
        object.state.orientation.target = 3
        network.setEntity(object)
        return true /* add to success count */
      })
      case 'left': return actionToEachObject((object, env) => {
        object.state.orientation.target = 1
        network.setEntity(object)
        return true /* add to success count */
      })
      case 'right': return actionToEachObject((object, env) => {
        object.state.orientation.target = 2
        network.setEntity(object)
        return true /* add to success count */
      })
      default: throw Error(`Is ${subCommand} an '/orient' subcommand?`)
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
  sign: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/sign'? e.g. 'create', 'label', 'message'`)
    switch (subCommand) {
      case 'create': return signCreate(joinAll(args))
      case 'label': return signSetLabel(joinAll(args))
      case 'message': return signSetMessage(joinAll(args))
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
  stop: (args) => {
    return (env) => {
      env.stage.continueRendering = false
    }
  },
  portal: (args) => {
    const subCommand = takeOne(args, `Shouldn't there be a subcommand after '/portal'? e.g. 'create', 'url', 'radius'`)
    switch (subCommand) {
      case 'create': return portalCreate(joinAll(args))
      case 'url': return portalSetUrl(takeOne(args, `Shouldn't there be a [URL] after '/portal url'?`))
      case 'radius': return portalSetRadius(takeOne(args, `Shouldn't there be a [RADIUS] after '/portal radius'?`))
      default: throw Error(`Is ${subCommand} a '/portal' subcommand?`)
    }
  },
  whereami: (args) => {
    return (env) => {
      const pos = env.player.object.position
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
