import { onDestroy } from 'svelte'

export function onInterval(callback, milliseconds) {
  const interval = setInterval(callback, milliseconds)

  onDestroy(() => {
    clearInterval(interval)
  })
}

export function hasAncestor(element, ancestor) {
  if (element === null) {
    return false
  } else if (element === ancestor) {
    return true
  } else {
    return hasAncestor(element.parentNode, ancestor)
  }
}
