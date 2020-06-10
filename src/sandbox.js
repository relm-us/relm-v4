import stampit from 'stampit'

const A = stampit({
  init({ goals = {} }) {
    console.log("A", goals.a || "a")
  }
})

const B = stampit({
  init({ goals = {} }) {
    console.log("B", goals.b || "b")
  }
})

const Combined = stampit(A, B)

const c = Combined({
  goals: {
    a: "1",
    b: "2"
  }
})

