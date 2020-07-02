const invitation = require('./invitation.js')

const { client, setup, teardown } = require('./test_helper.js')

describe('Invitation model tests', () => {
  beforeAll(setup)
  afterAll(teardown)
  
  
  it('creates invitation', async () => {
    const playerId = '547079ce-7346-4b54-9230-9f24a4998129'
    const token = 'join-now'
    const created = await invitation.createInvitation(client, {
      relm: 'welcome',
      permits: ['access'],
      token: token,
      createdBy: playerId
    })
    expect(created).toBe(true)
    
    // check that the invitation can be retrieved
    const invite = await invitation.getInvitation(client, { token, relm: 'welcome' })
    expect(invite.createdBy).toEqual(playerId)
    expect(invite.permits).toEqual(new Set(['access']))
    expect(invite.relm).toEqual('welcome')
    expect(invite.uses).toEqual(1)
    expect(invite.used).toEqual(0)
    
    // confirm we can't create another invitation with the same token
    await expect(invitation.createInvitation(client, { token })).rejects
      .toThrow(`duplicate key value violates unique constraint "invitations_pkey"`)
  })
  
  it('uses an invitation', async () => {
    const playerId = '547079ce-7346-4b54-9230-9f24a4998129'
    const token = 'use-me'
    const created = await invitation.createInvitation(client, {
      relm: 'welcome',
      permits: ['access'],
      token: token,
      createdBy: playerId
    })
    expect(created).toBe(true)

    // using it a 1st time should return the invitation
    const invite = await invitation.useInvitation(client, { token, relm: 'welcome' })
    expect(invite.uses).toEqual(1)
    expect(invite.used).toEqual(1)
    
    // using it a 2nd time should return throw
    await expect(invitation.useInvitation(client, { token, relm: 'welcome' })).rejects
      .toThrow('invitation no longer valid')
  })
})