const util = require('../util.js')
const Permission = require('./permission.js')

function randomToken() {
  return util.uuidv4().split('-')[0]
}

function mkInvitation(json) {
  return {
    createdAt: json.created_at,
    createdBy: json.created_by,
    permits: new Set(json.permits),
    relm: json.relm,
    token: json.token,
    used: json.used,
    uses: json.uses,
  }
}

const Invitation = module.exports = {
  createInvitation: async (client, {
    token = randomToken(),
    relm = '*',
    uses = 1,
    permits = [Permission.ACCESS],
    createdBy = null,
  }) => {
    const res = await client.query(`
      INSERT INTO invitations (token, relm, uses, used, permits, created_by)
      VALUES ($1, $2, $3, 0, $4, $5)
    `, [token, relm, uses, JSON.stringify(permits), createdBy])
    return res.rowCount === 1
  },

  getInvitation: async (client, { token, relm }) => {
    const res = await client.query(`
      SELECT *
      FROM invitations
      WHERE token = $1
    `, [token])
    if (res.rowCount === 0) {
      return null
    } else if (res.rowCount === 1) {
      if (relm) {
        const invitationRelm = res.rows[0].relm
        if (invitationRelm === relm || invitationRelm === '*') {
          return mkInvitation(res.rows[0])
        } else {
          throw Error(`token not valid for relm '${relm}'`)
        }
      } else {
        return mkInvitation(res.rows[0])
      }
    } else {
      throw Error(`multiple results when only one expected (getInvitation: '${token}')`)
    }
  },

  useInvitation: async (client, { token, relm, playerId }) => {
    const invite = await Invitation.getInvitation(client, { token, relm })
    if (invite) {
      if (invite.used < invite.uses) {
        const res = await client.query(`
          UPDATE invitations
          SET used = $2
          WHERE token = $1
        `, [token, invite.used + 1])
        
        if (playerId) {
          const res = await client.query(`
            INSERT INTO invitation_uses (token, used_by, relm)
            VALUES ($1, $2, $3)
          `, [token, playerId, relm])
        }
        
        return Object.assign(invite, { used: invite.used + 1})
      } else {
        throw Error('invitation no longer valid')
      }
    } else {
      throw Error('invitation not found')
    }
  }
}
