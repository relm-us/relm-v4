const level = require('level')
const config = require('./config.js')
const util = require('./util.js')
const permissions = require('./permissions.js')

function randomToken() {
  return util.uuidv4().split('-')[0]
}

function invitationKey(token) {
  return `${config.INVITE_PREFIX}.${token}`
}

// module.export = (db) => {
//   return {

//   }
// }
async function createInvitation(db, {
  relm = '*',
  uses = 1,
  permissions = [permissions.PERMISSIONS.ACCESS],
  token = randomToken(),
}) {
  console.log('PUT', invitationKey(token))
  await db.put(invitationKey(token), JSON.stringify({
    relm,
    uses,
    used: 0,
    permissions,
  }))
  
  return token
}

async function getInvitation(db, { token }) {
  let invitationJSON
  try {
    console.log('GET', invitationKey(token))
    invitationJSON = await db.get(invitationKey(token))
    return JSON.parse(invitationJSON)
  } catch (err) {
    if (err instanceof level.errors.NotFoundError) {
      return null
    } else {
      throw err
    }
  }
}

async function useInvitation(db, { token }) {
  const invite = await invitation.getInvitation(db, { token })
  
  if (invite.used < invite.uses) {
    await db.put(invitationKey(token), JSON.stringify({
      relm: invite.relm,
      uses: invite.used + 1,
      uses: invite.uses,
      permissions: invite.permissions,
    }))
    return true
  }
  
  return false
}

module.exports = {
  createInvitation,
  getInvitation,
  useInvitation,
}
