const pg = require('pg')

const { createDb, migrate } = require('postgres-migrations')

const { Client } = pg

const client = new Client()

async function setup() {
  await client.connect()
  await createDb(process.env.PGDATABASE, { client })
  await migrate({ client }, 'migrations')
}
  
async function teardown() {
  await client.end()
}

module.exports = {
  client,
  setup,
  teardown,
}
