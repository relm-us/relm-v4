import { GoalGroup } from './goal_group.js'

import * as Y from 'yjs'

describe('GoalGroup with Y.Map', () => {
  const uuid = '00dad9fd-ae24-4b8f-a159-78b9b53c2a60'
  const type = 'test'
  
  let ydoc
  let goals

  beforeEach(() => {
    // Embed the goal group in a Y.Doc so that we can `get` values immediately after `set`
    ydoc = new Y.Doc()
    const map = ydoc.getMap('map')
    
    goals = GoalGroup({ uuid, type, map })
  })
  
  it('can add goal', () => {
    goals.add('position', { x: 1, y: 2, z: 3 })
    goals._goals.has('p')
    goals._map.has('p')
  })
  
  it('goals must be uniquely named', () => {
    expect(() => {
      goals.add('position', { x: 1, y: 2, z: 3 })
      goals.add('position', { value: 1 })
    }).toThrow('Goal already added')
  })
  
  it('can set goal, and get with abbreviation', () => {
    goals.add('position', { x: 1, y: 2, z: 3 })
    expect(goals.get('p').toJSON()).toEqual({ x: 1, y: 2, z: 3, '@due': 0 })
  })
  
  it('can set goal, and get using name', () => {
    goals.add('position', { x: 1, y: 2, z: 3 })
    expect(goals.position.toJSON()).toEqual({ x: 1, y: 2, z: 3, '@due': 0 })
  })
  
  it('converts to JSON', () => {
    const url = 'http://relm.us/image.png'
    goals.add('position', { x: 1, y: 2, z: 3 })
    goals.add('asset', { url })
    
    const json = goals.toJSON()
    
    expect(json).toEqual({
      '@id': uuid,
      '@type': type,
      p: { x: 1, y: 2, z: 3, '@due': 0 },
      ast: { url, '@due': 0 }
    })
  })
})

describe('GoalGroup with Map', () => {
  const uuid = '00dad9fd-ae24-4b8f-a159-78b9b53c2a60'
  const type = 'test'
  
  let goals

  beforeEach(() => {
    goals = GoalGroup({ uuid, type, map: new Map() })
  })
  
  it('can add goal', () => {
    goals.add('position', { x: 1, y: 2, z: 3 })
    goals._goals.has('p')
    goals._map.has('p')
  })
  
  it('goals must be uniquely named', () => {
    expect(() => {
      goals.add('position', { x: 1, y: 2, z: 3 })
      goals.add('position', { value: 1 })
    }).toThrow('Goal already added')
  })
  
  it('can set goal, and get with abbreviation', () => {
    goals.add('position', { x: 1, y: 2, z: 3 })
    expect(goals.get('p').toJSON()).toEqual({ x: 1, y: 2, z: 3, '@due': 0 })
  })
  
  it('can set goal, and get using name', () => {
    goals.add('position', { x: 1, y: 2, z: 3 })
    expect(goals.position.toJSON()).toEqual({ x: 1, y: 2, z: 3, '@due': 0 })
  })
  
  it('converts to JSON', () => {
    const url = 'http://relm.us/image.png'
    goals.add('position', { x: 1, y: 2, z: 3 })
    goals.add('asset', { url })
    
    const json = goals.toJSON()
    
    expect(json).toEqual({
      '@id': uuid,
      '@type': type,
      p: { x: 1, y: 2, z: 3, '@due': 0 },
      ast: { url, '@due': 0 }
    })
  })
})
