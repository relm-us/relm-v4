import * as R from './rmap.js'

describe('RMap', () => {
  it('initializes', () => {
    const map = new R.Map(Object.entries({ a: 1 }))
    expect(map.get('a')).toEqual(1)
  })
  
  it('converts to JSON', () => {
    const map = new R.Map()
    map.set('a', 1)
    map.set('b', 'hi')
    map.set('c', new R.Map(Object.entries({ x: 1, y: 2 })))
    expect(map.toJSON()).toEqual({ a: 1, b: 'hi', c: { x: 1, y: 2 } })
  })
  
  it('emits changed event when value changes', () => {
    const map = new R.Map()
    let observed = false
    map.observe(() => {
      observed = true
    })
    map.set('a', 1)
    expect(observed).toEqual(true)
  })
})