import { Goal, Equality } from './goal.js'

import * as Y from 'yjs'
import * as R from '../rmap.js'

[
  { name: 'Map', makeMap: () => { return new Map() }},
  { name: 'R.Map', makeMap: () => { return new R.Map() }},
  { name: 'Y.Map', makeMap: () => { return new Y.Doc().getMap('map') }},
].forEach(run => {
  describe(`Goal with ${run.name}`, () => {
    let ydoc
    let goal
    
    beforeEach(() => {
      const ymap = run.makeMap()
      
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
})
