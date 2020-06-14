import { showToast } from './lib/Toast.js'

const formatAttr = (attrType, key, value) => {
  switch (attrType) {
    case 'rotation': return value / -THREE.Math.DEG2RAD
    default:
      if (typeof value === 'number') {
        return value.toFixed(2)
      } else if (value.match && value.match(/^https?:/)) {
        return `<a href="${value}">${value}</a>`
      } else {
        return value
      }
  }

}

const makeAttrs = (attrType, attrs) => {
  let sortedKeys = Object.keys(attrs)
  sortedKeys.sort()

  const divs = sortedKeys.map((k) => {
    const v = attrs[k]
    return `
      <div class="info-attr-key">${k}:</div>
      <div class="info-attr-value">${formatAttr(attrType, k, v)}</div>
    `
  })
  return divs.map((div) => `<div class="info-attr">${div}</div>`).join('')
}

const makeGroup = (name, attrs) => {
  return `
    <div class="info-group">
      <div class="info-label">${name}</div>
      ${makeAttrs(name, attrs)}
    </div>
  `
}
const showInfoAboutObject = (entity) => {
  if (!entity) { return }
  const p = entity.object.position
  const infos = [
    `
      <div class="info-title">
        <div class="info-type">${entity.type}</div>
        <div class="info-uuid">${entity.uuid}</div>
      </div>
    `
  ]
  
  const json = entity.goals.toDesc()
  for (const name of entity.goals.definitionKeys()) {
    infos.push(makeGroup(name, json[name]))
  }
  
  showToast(infos.join(''))
}

export { showInfoAboutObject }
