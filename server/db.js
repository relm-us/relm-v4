const fs = require('fs')
const pg = require('pg')
const moment = require('moment')
const config = require('./config.js')

const invitation = require('./invitation.js')
const permissions = require('./permissions.js')


 
// https://github.com/brianc/node-postgres/issues/818
function patchPgUseUTC() {
  const parseDate = val =>
    val === null ? null : moment(val).format("YYYY-MM-DD")
  const DATATYPE_DATE = 1082
  pg.types.setTypeParser(DATATYPE_DATE, val => {
    return val === null ? null : parseDate(val)
  })
}


const { Pool } = pg
const pool = new Pool()

patchPgUseUTC()

modules.export = pool



const dbname = process.env.DBNAME || 'relm-db'

// If database does not exist, we will need to set it up after creation
const needsSetup = !fs.existsSync(dbname)

const db = Object.assign(level(dbname), {
  /**
   * If this is the first-time creation of the leveldb, add
   * a setup token that allows the first (admin) user in to Relm.
   */
  firstTimeSetup: async () => {
    try {
      const token = await invitation.createInvitation(db, {
        relm: '*',
        uses: config.SETUP_TOKEN_COUNTER,
        permissions: [permissions.PERMISSIONS.ADMIN],
        token: config.SETUP_TOKEN
      })
      console.log(`First-time setup: "${token}" token created (uses: ${config.SETUP_TOKEN_COUNTER})`)
    } catch(err) {
      console.error(`Unable to create setup token`, err)
    }
  },
  
  getWithDefault: async (key, defaultValue) => {
    try {
      return await db.get(key)
    } catch (err) {
      if (err instanceof level.errors.NotFoundError) {
        await db.set(key, defaultValue)
        return defaultValue
      } else {
        throw err
      }
    }
  }
})


if (needsSetup) {
  db.firstTimeSetup()
}


module.exports = db
