import { Goal, Equality } from './goal.js'

import * as Y from 'yjs'

describe('Goal with Y.Map', () => {
  let ydoc
  let goal
  
  beforeEach(() => {
    // Embed the goal in a Y.Doc so that we can `get` values immediately after `set`
    ydoc = new Y.Doc()
    const ymap = ydoc.getMap('goals')
    
    goal = Goal({
      name: 'position',
      defaults: {
        x: 1.0,
        y: 2.0,
        z: 3.0
      },
      map: ymap
    })
    
  })
  
  it('initializes', () => {
    expect(goal.name).toEqual('position')
  })

  it('gets defaults', () => {
    expect(goal.get('x')).toEqual(1)
    expect(goal.get('y')).toEqual(2)
    expect(goal.get('z')).toEqual(3)
  })
  
  it('tests equality', () => {
    const other = new Map()
    other.set('x', 1)
    other.set('y', 2)
    other.set('z', 3)
    expect(goal.equals(other)).toBe(true)
    other.set('x', 0)
    expect(goal.equals(other)).toBe(false)
  })
  
  it('setting same state does not affect achieved flag', () => {
    goal.markAchieved()
    goal.update({ x: 1, y: 2, z: 3 })
    expect(goal.achieved).toBe(true)
  })
  
  it('setting different state affects achieved flag', () => {
    goal.markAchieved()
    goal.update({ x: 1, y: 2, z: 10 })
    expect(goal.achieved).toBe(false)
  })
  
  it('converts to JSON', () => {
    const json = goal.toJSON()
    expect(json).toEqual({x: 1, y: 2, z: 3, '@due': 0})
  })
})

describe('Goal with Map', () => {
  let goal
  
  beforeEach(() => {
    goal = Goal({
      name: 'position',
      defaults: {
        x: 1.0,
        y: 2.0,
        z: 3.0
      },
      map: new Map()
    })
    
  })
  
  it('initializes', () => {
    expect(goal.name).toEqual('position')
  })

  it('gets defaults', () => {
    expect(goal.get('x')).toEqual(1)
    expect(goal.get('y')).toEqual(2)
    expect(goal.get('z')).toEqual(3)
  })
  
  it('tests equality', () => {
    const other = new Map()
    other.set('x', 1)
    other.set('y', 2)
    other.set('z', 3)
    expect(goal.equals(other)).toBe(true)
    other.set('x', 0)
    expect(goal.equals(other)).toBe(false)
  })
  
  it('setting same state does not affect achieved flag', () => {
    goal.markAchieved()
    goal.update({ x: 1, y: 2, z: 3 })
    expect(goal.achieved).toBe(true)
  })
  
  it('setting different state affects achieved flag', () => {
    goal.markAchieved()
    goal.update({ x: 1, y: 2, z: 10 })
    expect(goal.achieved).toBe(false)
  })
  
  it('converts to JSON', () => {
    const json = goal.toJSON()
    expect(json).toEqual({x: 1, y: 2, z: 3, '@due': 0})
  })
})

describe('Equality', () => {
  it('Distance', () => {
    const equals = Equality.Distance(0.01)
    const p1 = new Map(Object.entries({ x: 1, y: 2, z: 3}))
    const p2 = new Map(Object.entries({ x: 4, y: 5, z: 6}))
    expect(equals(p1, p2)).toBe(false)
    const p3 = new Map(Object.entries({ x: 1, y: 2, z: 3.01}))
    expect(equals(p1, p3)).toBe(true)
  })
  
  it('Map (compares built-in Map)', () => {
    const equals = Equality.Map()
    const p1 = new Map(Object.entries({ x: 1, y: 2, z: 3}))
    const p2 = new Map(Object.entries({ x: 1, y: 2, z: 4}))
    expect(equals(p1, p2)).toBe(false)
    p2.set('z', 3)
    expect(equals(p1, p2)).toBe(true)
  })
  
  it('Map (compares Y.Map)', () => {
    const equals = Equality.Map()
    const ydoc = new Y.Doc()
    
    const p1 = new Y.Map()
    p1.set('x', 1); p1.set('y', 2); p1.set('z', 3)
    ydoc.getMap('map').set('p1', p1)
    
    const p2 = new Y.Map()
    p2.set('x', 1); p2.set('y', 2); p2.set('z', 4)
    ydoc.getMap('map').set('p2', p2)
    
    expect(equals(p1, p2)).toBe(false)
    
    p2.set('z', 3)
    expect(equals(p1, p2)).toBe(true)
  })

  it ('Delta', () => {
    const equals = Equality.Delta('value', 0.1)
    const m1 = new Map(Object.entries({ meta: null, value: 1 }))
    const m2 = new Map(Object.entries({ meta: null, value: 1.2 }))
    expect(equals(m1, m2)).toBe(false)
    m2.set('value', 1.09)
    expect(equals(m1, m2)).toBe(true)
  })
})
