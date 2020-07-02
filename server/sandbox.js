const db = require('./db/db.js')
const { createDb, migrate } = require('postgres-migrations')

const config = {
  DBNAME: 'relm'
}

const playerId = '547079ce-7346-4b54-9230-9f24a4998129'

;(async (pool) => {
  const client = await pool.connect()
  
  try {
    await createDb(config.DBNAME, { client })
  
    await migrate({ client }, 'migrations')
    
    // const res = await db.invitation.createInvitation(client, { relm: 'welcome' })
    // const invitation = await db.invitation.getInvitation(client, { token: '19f44ff5' })
    // const use = await db.invitation.useInvitation(client, { token: '19f44ff5' })
    // console.log(use)
    
    // await db.permission.setPermission(client, { relm: 'welcome', playerId, permits: [db.permission.PERMISSIONS.ACCESS]})
    // await db.permission.setPermission(client, { relm: '*', playerId, permits: [db.permission.PERMISSIONS.ADMIN]})
    // const permits = await db.permission.getPermissions(client, { relm: 'welcome', playerId })
    // console.log('permissions', permits)

    const didSet = await db.player.setSecret(client, { playerId, secret: ['hello'] })
    console.log('set secret', didSet)
  } finally {
    // Make sure to release the client before any error handling,
    // just in case the error handling itself throws an error.
    client.release()
  }
})(db.pool).catch(err => console.log(err.stack))
