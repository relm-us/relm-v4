import Collision from '@stamp/collision';

/**
 * We tell stamps merged with Component that they can have multiple 'setup',
 * 'update' and 'teardown' methods. When multiple methods of the same name
 * are composed, they are ALL called (i.e. 'defered').
 * 
 * See https://stampit.js.org/ecosystem/stamp-collision
 */
const Component = Collision.collisionSetup({
  defer: ['setup', 'update', 'teardown']
})

export { Component }
