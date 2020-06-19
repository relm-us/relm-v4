import stampit from 'stampit'
import { equals } from './util_equals.js'

const a = {a:{b:1}}
const b = {a:{b:1}}

console.log('equals', a, b, equals(a, b))