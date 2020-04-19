const level = require('level')

const db = level(process.env.DBNAME || 'relm-db')

db.createReadStream()
  .on('data', (data) => {
    console.log(data.key,'=',data.value)
  })
  .on('error', (err) => {
    console.log('error', err)
  })
  .on('close', () => {
    console.log('stream closed')
  })
  .on('end', () => {
    console.log('stream ended')
  })
