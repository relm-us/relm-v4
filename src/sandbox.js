import stampit from 'stampit'
import InstanceOf from '@stamp/instanceof'



const take = (args, n, errorMessage) => {
  if (n < 1) {
    throw Error(`'take' must be called with n >= 1 (n = ${n})`)
  } else if (n > args.length) {
    throw Error(`'take' must be called with n <= args.length (args.length = ${args.length})`)
  } else if (args.length >= n) {
    const popped = []
    for (let i = 0; i < n; i++) {
      popped.push(args.shift())
    }
    return popped
  } else {
    throw Error(errorMessage)
  }
}

const args = [1, 2, 3, 4]
console.log(take(args, 1))
console.log(args)
/*
let Component = stampit({
  props: {
    componentName: 'joe'
  },
  init() {
    this.componentName = 'Joe'

  }
})

Component = Component.compose(InstanceOf).props({ componentName: 'john' })

const component = Component({ componentName: 'duane' })

console.log(component, component instanceof Component === true)
*/
