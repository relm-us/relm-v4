const Relm = require('./relm.js')

const { setup, teardown } = require('./test_helper.js')
const { uuidv4, UUID_RE } = require('../util.js')

describe('Relm model tests', () => {
  beforeAll(setup)
  afterAll(teardown)

  it('Creates a relm with defaults', async () => {
    const relmName = 'relm-being-created'
    const relm = await Relm.createRelm({ relmName })
    expect(relm).toEqual({
      relmId: expect.stringMatching(UUID_RE),
      relmName: 'relm-being-created',
      isPublic: false,
      defaultEntrywayId: null,
      createdBy: null,
      createdAt: expect.any(Date),
      transientDocId: expect.stringMatching(UUID_RE),
      permanentDocId: expect.stringMatching(UUID_RE),
    })
  })

  it('Gets a relm by relmName', async () => {
    const relmName = 'relm-with-name'
    await Relm.createRelm({ relmName })
    const relm = await Relm.getRelm({ relmName })
    expect(relm.relmName).toEqual(relmName)
    expect(relm.transientDocId).toBeDefined()
    expect(relm.permanentDocId).toBeDefined()
  })

  it('Gets a relm by relmId', async () => {
    const relmId = uuidv4()
    const relmName = 'relm-with-id'
    await Relm.createRelm({ relmId, relmName })
    const relm = await Relm.getRelm({ relmId })
    expect(relm.relmName).toEqual(relmName)
  })

  it('Updates a relm', async () => {
    const relmName = 'relm-being-updated'
    const createdRelm = await Relm.createRelm({ relmName })

    const relm = await Relm.updateRelm({
      relmId: createdRelm.relmId,
      relmName: 'relm-has-been-updated',
      isPublic: true,
    })

    expect(relm.isPublic).toBe(true)
    expect(relm.relmName).toEqual('relm-has-been-updated')
  })
})
