import { getRandomInt, sumString } from './util.js'

/**
 * A list of gender-specific avatar meshes & their accompanying animations
 * 
 * @typedef AvatarOption
 * @property {string} gender A string, either 'm' or 'f' at this time.
 * @property {string} avatarId An identifier that matches the glTF asset SkinnedMesh identifier
 */

/**
 * @type {Array<AvatarOption>} A list of personalized avatar settings
 */
const avatarOptions = [
  { gender: 'f', avatarId: 'fem-B-armature' },
  { gender: 'f', avatarId: 'fem-C-armature' },
  { gender: 'f', avatarId: 'fem-D-armature' },
  { gender: 'f', avatarId: 'fem-E-armature' },
  { gender: 'f', avatarId: 'fem-F-armature' },
  { gender: 'f', avatarId: 'fem-G-armature' },
  { gender: 'f', avatarId: 'fem-fA-armature' },
  { gender: 'f', avatarId: 'fem-fB-armature' },
  { gender: 'f', avatarId: 'fem-fC-armature' },

  { gender: 'm', avatarId: 'mal-A-armature' },
  { gender: 'm', avatarId: 'mal-B-armature' },
  { gender: 'm', avatarId: 'mal-C-armature' },
  { gender: 'm', avatarId: 'mal-D-armature' },
  { gender: 'm', avatarId: 'mal-E-armature' },
  { gender: 'm', avatarId: 'mal-F-armature' },
  { gender: 'm', avatarId: 'mal-G-armature' },
  { gender: 'm', avatarId: 'mal-fA-armature' },
  { gender: 'm', avatarId: 'mal-fB-armature' },
]

/**
 * Filter the avatarOptions for a given gender
 * 
 * @param {string} gender The gender to filter for, either null, 'm', or 'f'. If null, returns all avatarOptions.
 * @returns {Array<AvatarOption>}
 */
function avatarOptionsOfGender (gender) {
  if (gender === null) {
    return avatarOptions
  } else {
    return avatarOptions.filter(a => a.gender === gender)
  }
}

/**
 * Finds the index of an AvatarOption whose avatarId matches the `avatarId` param.
 * Note that if none is found, -1 is returned.
 * 
 * @param {string} avatarId The key to find among avatarOptions
 * @param {Array<AvatarOption>} avatarOptions The AvatarOption possibilities to choose from. Defaults to all avatarOptions.
 * @returns {number} The index of the AvatarOption with `avatarId`
 */
function indexOfAvatarOption(avatarId, avatarOptions = avatarOptions) {
  if (avatarId) {
    return qualifyingAvatars.findIndex(a => a.avatarId === avatarId)
  } else {
    // If avatarId is null, we choose -1 so that the subsequent increment will set it to 0
    return -1
  }
}

/**
 * Uses the playerId string to pseudo-randomly choose a gender.
 * 
 * @param {string} playerId The UUID of the player.
 * @returns {string} Either 'm' or 'f' at present.
 */
function genderFromPlayerId(playerId) {
  const pseudoRandom = sumLetters(playerId) % 2
  return (pseudoRandom === 0 ? 'm' : 'f')
}

/**
 * Uses the `playerId` string to pseudo-randomly choose an avatarId from 
 * the list of avatarOptions.
 * 
 * @param {string} playerId The UUID of the player.
 * @param {Array<AvatarOption>} avatarOptions The AvatarOption possibilities to choose from. Defaults to all avatarOptions.
 * @returns {AvatarOption} One of the AvatarOptions that was given in the avatarOptions array.
 */
function avatarOptionFromPlayerId(playerId, options = avatarOptions) {
  const pseudoRandom = sumString(playerId) % options.length
  return options[pseudoRandom]
}

/**
 * Gets the AvatarOption in a list of options that is after the one with `avatarId`.
 * 
 * @param {string} avatarId The unique string identifier of the avatarOption
 * @param {Array<AvatarOption>} avatarOptions A list of AvatarOptions. Must include one AvatarOption with `avatarId`.
 */
function getNextAvatarOption (avatarId, avatarOptions = avatarOptions) {
  let index = indexOfAvatarOption(avatarId, avatarOptions) + 1
  // Wrap around
  if (index >= avatarOptions.length) { index = 0 }
  return avatarOptions[index]
}

function getRandomAvatarOption (avatarOptions = avatarOptions) {
  let index = getRandomInt(avatarOptions.length)
  return avatarOptions[index]
}


export {
  avatarOptions,
  avatarOptionsOfGender,
  indexOfAvatarOption,
  avatarOptionFromPlayerId,
  getNextAvatarOption,
  getRandomAvatarOption,
}