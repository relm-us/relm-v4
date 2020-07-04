const pg = require('pg')
const moment = require('moment')
const { createDb, migrate } = require('postgres-migrations')

const config = require('../config.js')

const Player = require('./player.js')
const Invitation = require('./invitation.js')
const Permission = require('./permission.js')

// see https://node-postgres.com/features/connecting
const { Pool } = pg
const pool = new Pool({
  database: config.DBNAME
})
 
// https://github.com/brianc/node-postgres/issues/818
function patchPgUseUTC() {
  const parseDate = val =>
    val === null ? null : moment(val).format("YYYY-MM-DD")
  const DATATYPE_DATE = 1082
  pg.types.setTypeParser(DATATYPE_DATE, val => {
    return val === null ? null : parseDate(val)
  })
}


async function init() {
  patchPgUseUTC()
  
  const client = await pool.connect()
  
  try {
    // Migrate database; see https://www.npmjs.com/package/postgres-migrations
    await createDb(config.DBNAME, { client })
    await migrate({ client }, 'migrations')
  } finally {
    // Make sure to release the client before any error handling,
    // just in case the error handling itself throws an error.
    client.release()
  }
}


async function useToken(client, {
  token,
  relm,
  playerId,
}) {
  if (token && token.length <= config.MAX_TOKEN_LENGTH) {
      
    const invite = await Invitation.useInvitation(client, { token, relm, playerId })

    // Convert invitation to permissions
    await Permission.setPermissions(client, {
      playerId,
      relm: invite.relm,
      permits: invite.permits
    })
    
    return invite

  }
  
  return null
}


module.exports = {
  pool,
  init,
  useToken,
  
  Player,
  Invitation,
  Permission,
}
