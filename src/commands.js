import { Vector3, Math as ThreeMath } from 'three'

import { showToast } from './lib/Toast.js'
import { showInfoAboutObject } from './show_info_about_object.js'

import State from './svelte/stores.js'
import { avatarOptionsOfGender } from './avatars.js'
import { teleportToOtherRelm } from './teleportal.js'
import { createRelm, truncateRelm, getRelmMetadata } from './api/admin.js'
import { muteAudio, unmuteAudio } from './audiovideo/chat.js'
import { toggleScreenShare } from './audiovideo/screenshare.js'

import {
  take,
  takeOne,
  joinAll,
  parseCommandString,
  actionToEachObject,
  numberOfObjects,
} from './command_utils.js'

const { DEG2RAD } = ThreeMath

/**
 * @typedef CommandEnv
 * @property {Network} network The network
 * @property {Stage} stage The stage
 * @property {Player} player The local player
 * @property {Array<any>} objects The selected objects to act on
 * @property {THREE.Vector3} position The position to act at
 */

function triggerCreate(json) {
  return (env) => {
    env.network.permanents.create({
      type: 'trigger',
      goals: {
        trigger: { json },
        position: {
          x: env.position.x,
          y: env.position.y,
          z: env.position.z,
        },
      },
    })
  }
}

function triggerUpdate(json) {
  return actionToEachObject((entity, env) => {
    if (json && entity.goals.trigger) {
      entity.goals.trigger.update({ json })
      return true /* add to success count */
    }
  })
}

function diamondCreate(message) {
  return (env) => {
    const position = new Vector3()
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
        },
      },
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
          seed: Math.floor(Math.random() * 10000) + 100,
        },
        position: {
          x: env.position.x,
          y: env.position.y,
          z: env.position.z,
        },
        asset: {
          url: textureUrl,
        },
      },
    })
  }
}

function groundUpdate({ url, color, type, size, repeat, seed }) {
  return actionToEachObject((entity, env) => {
    let updated = false
    if (entity.type === 'ground') {
      if (type || color || size || repeat || seed) {
        const grg = entity.goals.ground
        entity.goals.ground.update({
          type: type || grg.get('type'),
          color: color || grg.get('color'),
          size: size || grg.get('size'),
          repeat: repeat || grg.get('repeat'),
          seed: seed || grg.get('seed'),
        })
        updated = true
      }
      if (url !== undefined) {
        entity.goals.asset.update({ url })
        updated = true
      }
    }
    return updated /* add to success count */
  })
}

function portalCreate(
  { relm, x = null, y = null, z = null } = { x: 0, y: 0, z: 0 }
) {
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
        },
      },
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

function objectScale(entity, { x, y, z }) {
  const scaleGoal = entity.goals.scale
  if (scaleGoal) {
    scaleGoal.update(
      {
        x: x || scaleGoal.get('x'),
        y: y || scaleGoal.get('y'),
        z: z || scaleGoal.get('z'),
      },
      Date.now() + 2000
    )
    return true /* add to success count */
  } else {
    showToast(`This object can't be scaled`)
  }
}

function objectMove(entity, { x, y, z }) {
  const posGoal = entity.goals.position
  if (posGoal) {
    const newX = parseFloat(posGoal.get('x'))
    const newY = parseFloat(posGoal.get('y'))
    const newZ = parseFloat(posGoal.get('z'))
    const newPos = {
      x: newX + (x === undefined || x === null ? 0 : x),
      y: newY + (y === undefined || y === null ? 0 : y),
      z: newZ + (z === undefined || z === null ? 0 : z),
    }
    console.log('objectMove', newPos)
    posGoal.update(newPos, Date.now() + 2000)
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
    rotGoal.update(
      {
        x: x !== undefined ? x * -DEG2RAD : rotGoal.get('x'),
        y: y !== undefined ? y * -DEG2RAD : rotGoal.get('y'),
        z: z !== undefined ? z * -DEG2RAD : rotGoal.get('z'),
      },
      Date.now() + 2000
    )
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
    const [gender, avatar] = take(
      2,
      args,
      `Shouldn't there be a [GENDER] and [AVATAR] after '/character'? e.g. '/character f 4'`
    )
    const index = parseInt(avatar, 10)
    if (!['f', 'm'].includes(gender)) {
      throw Error(`Pick 'f' or 'm' for your character's gender`)
    } else if (avatar < 0 || avatar > 8) {
      throw Error(`Pick a number between 0 and 8 for your avatar`)
    } else {
      return (env) => {
        const avatarOptions = avatarOptionsOfGender(gender)
        env.player.goals.animationMesh.update({
          v: avatarOptions[index].avatarId,
        })
      }
    }
  },
  diamond: (args) => {
    const subCommand = takeOne(
      args,
      `Shouldn't there be a subcommand after '/diamond'? e.g. 'create', 'label', 'message'`
    )
    switch (subCommand) {
      case 'create':
        return diamondCreate(joinAll(args))
      case 'label':
        return diamondUpdate({ label: joinAll(args) })
      case 'message':
        return diamondUpdate({ message: joinAll(args) })
      default:
        throw Error(`Is ${subCommand} a '/diamond' subcommand?`)
    }
  },
  edit: (args) => {
    return (env) => {
      State.editModalVisible.update(() => true)
    }
  },
  go: (args) => {
    const coords = { x: 0, y: 0, z: 0 }
    switch (args.length) {
      case 0:
        break
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
    const subCommand = takeOne(
      args,
      `Shouldn't there be a subcommand after '/ground'? e.g. 'create', 'size', 'type'`
    )
    let url
    switch (subCommand) {
      case 'create':
        try {
          url = takeOne(args)
        } catch (e) {
          url = null
        }
        return groundCreate(url)
      case 'color':
        return groundUpdate({
          color: takeOne(args, `Need a [COLOR] (hex format, e.g. #facc28)`),
        })
      case 'texture':
        try {
          url = takeOne(args)
        } catch (e) {
          url = null
        }
        return groundUpdate({ url })
      case 'size':
        return groundUpdate({
          size: parseFloat(takeOne(args, `Need a [SIZE]`)),
        })
      case 'type':
        return groundUpdate({
          type: takeOne(
            args,
            `Need a [TYPE] (e.g. 'circle', 'square', 'rough')`
          ),
        })
      case 'repeat':
        return groundUpdate({
          repeat: parseFloat(
            takeOne(args, `Need a [REPEAT] (number, e.g. 2.0)`)
          ),
        })
      case 'random':
        let seed
        try {
          seed = parseFloat(takeOne(args))
        } catch (e) {
          seed = Math.floor(Math.random() * 10000) + 100
        }
        return groundUpdate({ type: 'rough', seed })
      default:
        throw Error(`Is ${subCommand} a '/ground' subcommand?`)
    }
  },
  identity: (args) => {
    return (env) => {
      State.identityModalVisible.update(() => true)
    }
  },
  mode: (args) => {
    const mode = takeOne(
      args,
      `There are a couple of modes: 'normal' and 'editor'`
    )
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
        default:
          new Error(`Is there a ${mode} mode? Try 'normal' or 'editor'`)
      }
    }
  },
  mute: (args) => {
    return (env) => {
      muteAudio()
      env.stage.player.videoBubble.object.enterMutedState()
    }
  },
  unmute: (args) => {
    return (env) => {
      unmuteAudio()
      env.stage.player.videoBubble.object.enterUnmutedState()
    }
  },
  name: (args) => {
    const name = takeOne(args, `Shouldn't there be a [NAME] after '/name'?`)
    return (env) => {
      env.player.goals.label.update({ text: name })
    }
  },
  object: (args) => {
    const subCommand = takeOne(
      args,
      `Shouldn't there be a subcommand after '/object'? e.g. 'clone', 'delete', 'scale'`
    )
    switch (subCommand) {
      case 'clone': {
        let count
        try {
          count = parseInt(takeOne(args), 10)
        } catch (e) {
          count = 1
        }
        if (count > 100) {
          throw Error("Can't clone more than 100")
        }
        return actionToEachObject((entity, env) => {
          const goalsDesc = entity.goals.toDesc()
          env.stage.selection.clearSelection()
          for (let i = 0; i < count; i++) {
            goalsDesc.position.x += 25
            goalsDesc.position.z += 25
            env.network.permanents.create({
              type: entity.goals.type,
              goals: goalsDesc,
              after: (entity) => {
                entity.once('mesh-updated', () => {
                  env.stage.selection.select([entity], '+')
                })
              },
            })
          }
          return true /* add to success count */
        })
      }

      case 'delete':
        return actionToEachObject((entity, env) => {
          env.network.permanents.remove(entity.uuid)
          return true /* add to success count */
        })

      case 'f':
      case 'fetch':
        return actionToEachObject((entity, env) => {
          entity.goals.position.update(
            {
              x: env.position.x,
              y: entity.goals.position.get('y'),
              z: env.position.z,
            },
            Date.now() + 4000
          )
          return true /* add to success count */
        })

      case 'flip': {
        let axis = 'x'
        try {
          axis = takeOne(args) == 'y' ? 'y' : 'x'
        } catch (e) {}
        return actionToEachObject((entity, env) => {
          const flipGoal = entity.goals.flip
          if (flipGoal) {
            flipGoal.update(
              {
                x: axis === 'x' ? !flipGoal.get('x') : flipGoal.get('x'),
                y: axis === 'y' ? !flipGoal.get('y') : flipGoal.get('y'),
              },
              Date.now() + 2000
            )
            return true /* add to success count */
          } else {
            throw Error(`This object isn't flippable`)
          }
        })
      }

      case 'fold': {
        const value = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [FOLD] value after '/object fold'?`
          )
        )
        if (value < 0 || value > 1) {
          throw Error('The fold value should be between 0 and 1')
        }
        return actionToEachObject((entity, env) => {
          const foldGoal = entity.goals.fold
          if (foldGoal) {
            foldGoal.update({ v: value }, Date.now() + 2000)
            return true /* add to success count */
          } else {
            throw Error(`This object isn't foldable`)
          }
        })
      }

      case 'i':
      case 'info':
        return actionToEachObject((entity, env) => {
          showInfoAboutObject(entity)
          return true /* add to success count */
        })

      case 'lock':
        return actionToEachObject(
          (object, env) => {
            if (object.uiLock) {
              object.uiLock()
              env.stage.selection.select([object], '-')
              return true /* add to success count */
            }
          },
          (count) => {
            showToast(`Locked ${numberOfObjects(count)}`)
          }
        )

      case 'unlock':
        return actionToEachObject(
          (object, env) => {
            if (object.uiUnlock) {
              object.uiUnlock()
              env.stage.selection.select([object], '-')
              return true /* add to success count */
            }
          },
          (count) => {
            showToast(`Unlocked ${numberOfObjects(count)}`)
          }
        )

      case 'mat':
      case 'material': {
        const newType = takeOne(
          args,
          `Shouldn't there be a material type after '/object material'? e.g. 'default' or 'photo'`
        )
        return actionToEachObject(
          (entity, env) => {
            const matGoal = entity.goals.material
            if (matGoal && matGoal.get('type') !== newType) {
              matGoal.update({ type: newType })
              return true /* add to success count */
            }
          },
          (count) => {
            showToast(`Changed material for ${numberOfObjects(count)}`)
          }
        )
      }

      case 'layer': {
        const layer = takeOne(
          args,
          `Shouldn't there be a number after '/object layer'? e.g. 0, 1, ... 100`
        )
        return actionToEachObject(
          (entity, env) => {
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
          },
          (count) => {
            showToast(`Changed layer for ${numberOfObjects(count)}`)
          }
        )
      }

      case 'orient': {
        const subCommand = takeOne(
          args,
          `Shouldn't there be a subcommand after '/object orient'? e.g. 'up' or 'down'`
        )
        return actionToEachObject((entity, env) => {
          switch (subCommand) {
            case 'up':
              entity.goals.rotation.update(
                { x: 0, y: 0, z: 0 },
                Date.now() + 2000
              )
              entity.goals.renderOrder.update({ v: 100 })
              break
            case 'down':
              entity.goals.rotation.update(
                { x: 90 * -DEG2RAD, y: 0, z: 0 },
                Date.now() + 2000
              )
              const y = entity.goals.position.get('y')
              let layer = y >= 0 && y < 1.0 ? Math.floor(y * 100) : 100
              entity.goals.renderOrder.update({ v: layer })
              break
            case 'left':
              entity.goals.rotation.update(
                { x: 0, y: -45 * -DEG2RAD, z: 0 },
                Date.now() + 2000
              )
              entity.goals.renderOrder.update({ v: 100 })
              break
            case 'right':
              entity.goals.rotation.update(
                { x: 0, y: 45 * -DEG2RAD, z: 0 },
                Date.now() + 2000
              )
              entity.goals.renderOrder.update({ v: 100 })
              break
            default:
              throw Error(`Is ${subCommand} an '/orient' subcommand?`)
          }
          return true /* add to success count */
        })
      }

      case 'rx':
      case 'rotatex': {
        const degrees = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [DEG] value after '/object rotatex'?`
          )
        )
        return actionToEachObject((entity, env) => {
          return objectRotate(entity, { x: degrees })
        })
      }

      case 'r':
      case 'ry':
      case 'rotate': // for backwards compat
      case 'rotatey': {
        const degrees = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [DEG] value after '/object rotatey'?`
          )
        )
        return actionToEachObject((entity, env) => {
          return objectRotate(entity, { y: degrees })
        })
      }

      case 'rz':
      case 'rotatez': {
        const degrees = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [DEG] value after '/object rotatez'?`
          )
        )
        return actionToEachObject((entity, env) => {
          return objectRotate(entity, { z: degrees })
        })
      }

      case 's':
      case 'scale': {
        const scale = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [SCALE] value after '/object scale'?`
          )
        )
        return actionToEachObject((entity, env) => {
          return objectScale(entity, { x: scale, y: scale, z: scale })
        })
      }

      case 'sx':
      case 'scalex': {
        const scale = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [SCALE] value after '/object scalex'?`
          )
        )
        return actionToEachObject((entity, env) => {
          return objectScale(entity, { x: scale })
        })
      }

      case 'sy':
      case 'scaley': {
        const scale = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [SCALE] value after '/object scaley'?`
          )
        )
        return actionToEachObject((entity, env) => {
          return objectScale(entity, { y: scale })
        })
      }

      case 'sz':
      case 'scalez': {
        const scale = parseFloat(
          takeOne(
            args,
            `Shouldn't there be a [SCALE] value after '/object scalez'?`
          )
        )
        return actionToEachObject((entity, env) => {
          return objectScale(entity, { z: scale })
        })
      }

      case 'to': {
        const x = parseFloat(takeOne(args, 'Requires [X] [Y] [Z]'))
        const y = parseFloat(takeOne(args, 'Requires [X] [Y] [Z]'))
        const z = parseFloat(takeOne(args, 'Requires [X] [Y] [Z]'))
        return actionToEachObject((entity, env) => {
          const posGoal = entity.goals.position
          if (posGoal) {
            const newPos = { x, y, z }
            console.log('to', newPos)
            posGoal.update(newPos, Date.now() + 2000)
            return true /* add to success count */
          } else {
            showToast(`This object can't be moved`)
          }
        })
      }

      case 'x': {
        const delta = parseFloat(
          takeOne(args, `Shouldn't there be an [X] value after '/object x'?`)
        )
        return actionToEachObject((entity, env) => {
          return objectMove(entity, { x: delta })
        })
      }

      case 'y': {
        const delta = parseFloat(
          takeOne(args, `Shouldn't there be a [Y] value after '/object y'?`)
        )
        return actionToEachObject((entity, env) => {
          return objectMove(entity, { y: delta })
        })
      }

      case 'z': {
        const delta = parseFloat(
          takeOne(args, `Shouldn't there be a [Z] value after '/object z'?`)
        )
        return actionToEachObject((entity, env) => {
          return objectMove(entity, { z: delta })
        })
      }

      default:
        throw Error(`Is ${subCommand} a '/object' subcommand?`)
    }
  },
  relm: (args) => {
    const subCommand = takeOne(
      args,
      `Shouldn't there be a subcommand after '/relm'? e.g. 'create'`
    )
    console.log('relm command:', subCommand)
    switch (subCommand) {
      case 'info':
        return (env) => {
          getRelmMetadata(env.player.uuid, env.config.ROOM)
            .then((md) => {
              showToast(`
                <b>Public?</b>: ${md.isPublic}<br>
                <b>Size (in bytes)</b>: ${md.permanentDocSize}<br>
              `)
            })
            .catch((err) => {
              showToast(err)
            })
        }
      case 'create':
        return (env) => {
          const relmName = takeOne(
            args,
            `Shouldn't there be a relm name after '/relm create'?`
          )
          createRelm(env.player.uuid, relmName)
            .then(() => {
              showToast(`Created relm named '${relmName}'.`)
            })
            .catch((err) => {
              showToast(err)
            })
        }
      case 'truncate':
        return (env) => {
          const relmName = env.config.ROOM
          truncateRelm(env.player.uuid, relmName)
            .then(() => {
              showToast(`History truncated for relm '${relmName}'.`)
            })
            .catch((err) => {
              showToast(err)
            })
        }
      default:
        throw Error(`Is ${subCommand} a '/relm' subcommand?`)
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
    const subCommand = takeOne(
      args,
      `Shouldn't there be a subcommand after '/select'? e.g. 'all'`
    )
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
      case 'all':
        return conditionallySelectAll(
          '+',
          (entity) => !entity.isEffectivelyUiLocked()
        )
      case 'none':
        return conditionallySelectAll(
          '-',
          (entity) => !entity.isEffectivelyUiLocked()
        )
      case 'locked':
        return conditionallySelectAll('+', (entity) => entity.isUiLocked())
      case 'unlocked':
        return conditionallySelectAll('+', (entity) => !entity.isUiLocked())
      case 'copy':
        return (env) => {
          env.stage.selection.copy()
        }
      case 'paste':
        return (env) => {
          env.stage.selection.paste(env.network.permanents, env.position)
        }
      default:
        throw Error(`Is ${subCommand} a '/sign' subcommand?`)
    }
  },
  share: (args) => {
    return (env) => {
      toggleScreenShare(env.stage)
    }
  },
  skybox: (args) => {
    const url = takeOne(args, `Shouldn't there be a [URL] after '/skybox'?`)
    return (env) => {
      let updated = false
      // A skybox can't be selected like other objects, so we iterate all and hope to find the one skybox
      env.stage.forEachEntityOfType('skybox', (entity) => {
        entity.goals.asset.update({ url })
        updated = true
      })
      // If not found, then we need to create it
      if (!updated) {
        env.network.permanents.create({
          type: 'skybox',
          goals: { asset: { url } },
        })
      }
    }
  },
  snap: (args) => {
    const size = takeOne(
      args,
      `Shouldn't there be a [SIZE] after '/snap'? or 'off'?`
    )
    let offsetX = 0
    let offsetZ = 0
    if (args.length === 2) {
      offsetX = takeOne(args)
      offsetZ = takeOne(args)
    }
    return (env) => {
      if (size === 'off') {
        stage.setGridSnap(null)
      } else {
        stage.setGridSnap(
          parseFloat(size),
          parseFloat(offsetX),
          parseFloat(offsetZ)
        )
      }
    }
  },
  stop: (args) => {
    return (env) => {
      env.stage.continueRendering = false
    }
  },
  trigger: (args) => {
    const subCommand = takeOne(
      args,
      `Shouldn't there be a subcommand after '/trigger'? e.g. 'create', 'update'`
    )
    switch (subCommand) {
      case 'create':
        return triggerCreate(joinAll(args))
      case 'update':
        return triggerUpdate(joinAll(args))
      default:
        throw Error(`Is ${subCommand} a '/trigger' subcommand?`)
    }
  },
  portal: (args) => {
    const subCommand = takeOne(
      args,
      `Shouldn't there be a subcommand after '/portal'? e.g. 'create', 'url', 'radius'`
    )
    switch (subCommand) {
      case 'create':
        switch (args.length) {
          case 0:
            return portalCreate()
          case 1:
            return portalCreate({
              relm: takeOne(args),
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
            throw Error(
              'Creating a portal can have one of: [RELM], or [X] [Z], or [RELM] [X] [Z]'
            )
        }
      case 'update':
        switch (args.length) {
          case 1:
            return portalUpdate({
              relm: takeOne(args),
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
            throw Error(
              'Updating a portal can have one of: [RELM], or [X] [Z], or [RELM] [X] [Z]'
            )
        }
      default:
        throw Error(`Is ${subCommand} a '/portal' subcommand?`)
    }
  },
  whereami: (args) => {
    return (env) => {
      const pos = env.position
      showToast(
        `You are at x: ${parseInt(pos.x, 10)}, y: ${parseInt(
          pos.y,
          10
        )}, z: ${parseInt(pos.z, 10)}`
      )
    }
  },
}

// Shortcut commands
commands.dia = commands.diamond
commands.o = commands.obj = commands.object
commands.p = commands.portal

const parseCommand = (commandString) => {
  const [command, args] = parseCommandString(commandString)
  if (!command) {
    return null
  }

  if (commands[command]) {
    return commands[command](args)
  } else {
    throw Error(`Is '${command}' a command?`)
  }
}

const runCommand = (text, { network, stage, config, position }) => {
  try {
    const command = parseCommand(text)
    const objects = stage.selection.getAllEntities()
    const player = stage.player
    if (command) {
      command({
        network,
        stage,
        player,
        objects,
        position: position || stage.player.object.position,
        config,
      })
    } else {
      showToast('Should there be a command after the `/`?')
    }
  } catch (err) {
    console.trace(err)
    showToast(err.message)
  }
}

export { runCommand, parseCommand }
