const Permission = require('./permission.js')

const { uuidv4 } = require('../util.js')
const { client, setup, teardown } = require('./test_helper.js')

describe('Permission model tests', () => {
  beforeAll(setup)
  afterAll(teardown)

  it('filteredPermits', () => {
    expect(Permission.filteredPermits(['access', 'xyz'])).toEqual(
      new Set(['access'])
    )
    expect(
      Permission.filteredPermits(['admin', 'access', 'invite', 'edit'])
    ).toEqual(new Set(['admin', 'access', 'invite', 'edit']))
  })

  it('sets permissions', async () => {
    const playerId = uuidv4()
    await Permission.setPermissions({ playerId, relm: 'welcome' })

    const permits = await Permission.getPermissions({
      playerId,
      relm: 'welcome',
    })
    expect(permits).toEqual(new Set(['access']))
  })

  it('unions permissions', async () => {
    const playerId = uuidv4()
    await Permission.setPermissions({
      playerId,
      relm: '*',
      permits: ['access'],
    })
    await Permission.setPermissions({
      playerId,
      relm: 'welcome',
      permits: ['admin'],
    })

    const permits = await Permission.getPermissions({
      playerId,
      relm: 'welcome',
    })
    expect(permits).toEqual(new Set(['access', 'admin']))
  })
})
