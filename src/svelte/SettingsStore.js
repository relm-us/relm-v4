import { writable } from 'svelte-persistent-store/dist/local'

const name = writable('name', null)

// A string representing the selected avatar gender
// string ('f' | 'm')
const avatarGender = writable('avatarGender', null)

// An index representing the selected avatar variant
// integer between [0, 8]
const avatarVariant = writable('avatarVariant', null)

// The skintone UV coordinate shift values
// {x: integer [0, 4095], y: integer [0, 4095]}
const avatarSkintone = writable('avatarSkintone', null)

// The skintone ID (a named skintone preset)
// string ('pink' | 'black' | 'white' | 'asian' | 'tan')
const avatarSkintoneId = writable('avatarSkintoneId', null)

// The clothtone UV coordinate shift values
// {x: integer [0, 4095], y: integer [0, 4095]}
const avatarClothtone = writable('avatarClothtone', null)

// True if the user agrees to the Terms of Service
const agreeTos = writable('agreeTos', null)

// True if the user would like to skip the mic/cam setup screen in future
const skipCameraSetup = writable('skipCameraSetup', null)

window.resetSettings = () => {
  name.set(null)
  avatarGender.set(null)
  avatarVariant.set(null)
  avatarSkintone.set(null)
  avatarSkintone.set(null)
  avatarClothtone.set(null)
  agreeTos.set(null)
  skipCameraSetup.set(null)
}

export {
  name,
  avatarGender,
  avatarVariant,
  avatarSkintone,
  avatarSkintoneId,
  avatarClothtone,
  agreeTos,
  skipCameraSetup,
}
