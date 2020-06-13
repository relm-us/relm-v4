import stampit from 'stampit'
import * as Y from 'yjs'
import { Equality } from './goals/goal'

const A = stampit({
  conf: {
    stage: null,
    resources: null,
  },
  init({}, { stamp }) {
    this.stage = stamp.compose.configuration.stage
    this.resources = stamp.compose.configuration.resources
  },
}).conf({ stage: 1, resources: 2 })

const B = stampit({
  conf: {
    network: null
  },
  init({}, { stamp }) {
    this.network = stamp.compose.configuration.network
  },
}).conf({ network: 3 })

const Together = stampit(A, B)

const t = Together()

console.log(t.stage, t.resources, t.network)