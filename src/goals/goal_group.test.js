import { GoalGroup } from './goal_group.js'

import * as Y from 'yjs'
import * as R from '../rmap.js'

[
  { name: 'Map', makeMap: () => { return new Map() }},
  { name: 'R.Map', makeMap: () => { return new R.Map() }},
  { name: 'Y.Map', makeMap: () => { return new Y.Doc().getMap('map') }},
].forEach(run => {
  describe(`GoalGroup with ${run.name}`, () => {
    const uuid = '00dad9fd-ae24-4b8f-a159-78b9b53c2a60'
    const type = 'test'
    
    let ydoc
    let goals

    beforeEach(() => {
      const map = run.makeMap()
      
      goals = GoalGroup({ map })
      goals.uuid = uuid
      goals.type = type
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
})

describe('GoalMap jsonToMap', () => {
  it('creates map from JSON', () => {
    const stateMap = GoalGroup.goalsDescToMap(R.Map, 'mytype', 'uuid123', {
      position: { x: 1, y: 1, z: 5 }
    })
    expect(stateMap.get('@id')).toEqual('uuid123')
    expect(stateMap.get('@type')).toEqual('mytype')
    expect(stateMap.get('p').get('@due')).toEqual(0)
    expect(stateMap.get('p').get('x')).toEqual(1)
    expect(stateMap.get('p').get('y')).toEqual(1)
    expect(stateMap.get('p').get('z')).toEqual(5)
  })
})
