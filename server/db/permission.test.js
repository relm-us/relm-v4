const permission = require('./permission.js')

const { client, setup, teardown } = require('./test_helper.js')

describe('Permission model tests', () => {
  beforeAll(setup)
  afterAll(teardown)
  
  
  it('sets permissions', async () => {
    const playerId = '603fd63b-aff3-49fc-a203-531fb0d5e09d'
    await permission.setPermissions(client, { playerId, relm: 'welcome' })
    
    const permits = await permission.getPermissions(client, { playerId, relm: 'welcome' })
    expect(permits).toEqual(new Set(['access']))
  })
  
  it('unions permissions', async () => {
    const playerId = '84df7712-f6df-4444-9823-66ac923defb8'
    await permission.setPermissions(client, { playerId, relm: '*', permits: ['access'] })
    await permission.setPermissions(client, { playerId, relm: 'welcome', permits: ['admin'] })
    
    const permits = await permission.getPermissions(client, { playerId, relm: 'welcome' })
    expect(permits).toEqual(new Set(['access', 'admin']))
  })
})