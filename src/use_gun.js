const { Gun } = window

const gun = Gun("http://localhost:8080/gun")

const number = Math.floor(Math.random() * 100 + 1)
console.log('chose random number:', number)

gun.get('globals').on((data, key) => {
  console.log('I have been notified that globals.number =', data.number)
})

gun.get('globals').get('number').put(number, ack => {
  console.log('global.number set to:', number)
  console.log('ack', ack)
})

setTimeout(() => {
  const finalNumber = gun.get('globals').once((data) => {
    console.log('final number:', data.number)
  })
}, 1000)