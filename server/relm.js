const config = require('./config.js')

async function setupRelm(doc, db) {
  const invitations = doc.getMap('invitations')
  invitations.observe((event, t) => {
    console.log('observed invitation change')
    event.changes.keys.forEach(async ({ action }, key) => {
      const invitationKey = `${config.INVITE_PREFIX}.${key}`
      if (action === 'add') {
        console.log('observed invitation [ADD]', key, invitations.get(key))
        await db.put(invitationKey, invitations.get(key))
      } else if (action === 'delete') {
        console.log('observed invitation [DEL]', key)
        await db.del(invitationKey)
      }
    })
  })
}

module.exports = {
  setupRelm,
}