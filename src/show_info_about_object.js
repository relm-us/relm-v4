import { showToast } from './lib/Toast.js'

const showInfoAboutObject = (entity) => {
  if (!entity) { return }
  const p = entity.object.position
  const infos = [
    `type: ${entity.type}`,
    `uuid: ${entity.uuid}`,
    `position: {x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)}, z: ${p.y.toFixed(1)}}`,
  ]
  
  if (entity.state.url) {
    // portals have url
    const url = entity.state.url.now
    infos.push(`url: <a href="${url}" style="color:white">${url}</a>`)
  } else if (entity.state.asset) {
    const url = entity.state.asset.now.url
    infos.push(`url: <a href="${url}" style="color:white">${url}</a>`)
  } else if (entity.state.link) {
    const url = entity.state.link.now || '[not set]'
    infos.push(`url: <a href="${url}" style="color:white">${url}</a>`)
  }
  
  if (entity.getScale) {
    const scale = entity.getScale()
    infos.push(`scale: ${scale.toFixed(1)}`)
  }
  
  if (entity.getRotation) {
    const rotation = entity.getRotation() / -THREE.Math.DEG2RAD
    infos.push(`rotation: ${rotation.toFixed(1)}`)
  }
  
  const isLockable = !!entity.isUiLocked
  if (isLockable) {
    const locked = entity.isUiLocked() ? 'locked' : 'unlocked'
    infos.push(`locked: ${locked}`)
  }
  
  showToast(infos.join('<br>'))
}

export { showInfoAboutObject }
