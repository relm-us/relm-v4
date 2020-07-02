const set = require('../set.js')


const Permission = module.exports = {

  ADMIN: 'admin',
  ACCESS: 'access',
  INVITE: 'invite',
  
  /**
   * @param {Client} client - the postgresql db client
   * @param {UUID} playerId - the UUID of the player to set permissions for
   * @param {string} relm - the relm to which the permissions pertain, or '*' if for all relms
   * @param {Array<PERMISSIONS>} permits - an array-like containing a list of permissions, e.g. PERMISSIONS.ACCESS
   */
  setPermissions: async (client, {
    playerId,
    relm = '*',
    permits = [Permission.ACCESS],
  }) => {
    await client.query(`
      INSERT INTO permissions (relm, player_id, permits)
      VALUES ($1, $2, $3)
    `, [relm, playerId, JSON.stringify([...permits])])
    return true
  },
  
  
  getPermissions: async (client, { playerId, relm }) => {
    const res = await client.query(`
      SELECT relm, permits
      FROM permissions
      WHERE player_id = $1
        AND (
          relm = $2 OR relm = '*'
        )
    `, [playerId, relm])
    
    // union of all permissions
    let permits = new Set()
    for (const row of res.rows) {
      const _permits = new Set(row.permits)
      permits = set.union(permits, _permits)
    }
    return permits
  }
}

