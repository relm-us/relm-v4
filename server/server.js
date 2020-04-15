const server = require('./ws-server.js')

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log(`http/ws server listening on ${port}`)
})