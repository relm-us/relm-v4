
const level = require('level')

const config = require('./config.js')

const dbname = process.env.DBNAME || 'relm-db'

const db = level(dbname)

/**
 * If this is the first-time creation of the leveldb, add
 * a setup token that allows the first user in to Relm.
 */
async function setupDatabase(db) {
  const token = config.SETUP_TOKEN
  const oneTimeKey = `${config.INVITE_PREFIX}.${token}`
  try {
    await db.get(oneTimeKey)
  } catch (err) {
    if (err instanceof level.errors.NotFoundError) {
      try {
        await db.put(oneTimeKey, config.SETUP_TOKEN_COUNTER)
        console.log(`First-time setup: "${token}" token created (uses: ${config.SETUP_TOKEN_COUNTER})`)
        console.log(`Visit e.g. https://relm.us/?t=${token} to authorize for the first time`)
      } catch(err) {
        console.error(`unable to set "${token}" setup token`, err)
      }
    }
  }
}

setupDatabase(db)

module.exports = db
