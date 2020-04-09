const {
  Vector3,
  Quaternion
} = THREE

/**
 * The PlayerState is the data stored in LocalStorage, or passed between players via the network.
 * We use short keys in order to reduce network latency and overhead.
 * 
 * @typedef {Object} PlayerState
 * @property {string} id The UUID of the player, i.e. "playerId". This identifier is unique across browser tabs (but does not represent a credentialed user).
 * @property {string} nm The name the player has chosen.
 * @property {string} gn The gender the player has chosen. Currently must be 'm' or 'f' due to asset constraints.
 * @property {string} av The ID of the avatar the player has chosen, i.e. "avatarId".
 * @property {string} th The player's current 'thought', if any.
 * @property {number} px The position.x of the player.
 * @property {number} py The position.y of the player.
 * @property {number} pz The position.z of the player.
 * @property {number} qx The quaternion.x (direction) of the player.
 * @property {number} qy The quaternion.y (direction) of the player.
 * @property {number} qz The quaternion.z (direction) of the player.
 * @property {number} qw The quaternion.w (direction) of the player.
 */

/**
 * Essential information about the player's presence.
 * 
 * @typedef {Object} PlayerModel
 * @property {string} playerId The UUID of the player.
 * @property {string} name The name of the player.
 * @property {string} gender The gender of the player.
 * @property {string} avatarId The string ID of the avatar the player has chosen.
 * @property {string} thought The player's current thought, if any.
 * @property {Vector3} position The position of the player.
 * @property {Quaternion} quaternion The quaternion (direction) of the player.
 */

function defaultPlayerModel() {
  return {
    playerId: undefined,
    name: undefined,
    gender: undefined,
    avatarId: undefined,
    thought: undefined,
    opacity: 1.0,
    position: new Vector3(0, 0, 0),
    quaternion: new Quaternion(0, 0, 0, 0),
  }
}
/**
 * Converts from PlayerState to PlayerModel.
 * 
 * @param {PlayerState} state 
 * @returns {PlayerModel}
 */
function playerStateToModel(state) {
  return {
    playerId: state.id,
    name: state.nm,
    gender: state.gn,
    avatarId: state.av,
    thought: state.th,
    opacity: state.op,
    position: new Vector3(state.px, state.py, state.pz),
    quaternion: new Quaternion(state.qx, state.qy, state.qz, state.qw),
  }
}

/**
 * Converts from PlayerModel to PlayerState.
 * 
 * @param {PlayerModel} model 
 * @returns {PlayerState}
 */
function playerModelToState(model) {
  return {
    id: model.playerId,
    nm: model.name,
    gn: model.gender,
    av: model.avatarId,
    th: model.thought,
    op: model.opacity,
    px: model.position.x,
    py: model.position.y,
    pz: model.position.z,
    qx: model.quaternion.x,
    qy: model.quaternion.y,
    qz: model.quaternion.z,
    qw: model.quaternion.w,
  }
}

function playerStateRandomPosition () {
  return {
    px: Math.random() * 100 - 50,
    py: 0,
    pz: Math.random() * 100 - 50
  }
}

function playerStateDefaultQuaternion () {
  return {
    x: 0, y: 1, z: 0, w: 0
  }
}

export {
  defaultPlayerModel,
  playerStateToModel,
  playerModelToState,
  playerStateRandomPosition,
  playerStateDefaultQuaternion,
}