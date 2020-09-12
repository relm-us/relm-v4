import { MathUtils } from 'three'

const PIXEL_STEP = 1
const LINE_HEIGHT = 8
const PAGE_HEIGHT = 80

const DELTA_MODE_PIXEL = 0
const DELTA_MODE_LINE = 1
const DELTA_MODE_PAGE = 2

function normalizeWheel(event) {
  let pixelY
  switch (event.deltaMode) {
    case DELTA_MODE_PIXEL:
      pixelY = MathUtils.clamp(event.deltaY * PIXEL_STEP, -20, 20)
      break
    case DELTA_MODE_LINE:
      pixelY = MathUtils.clamp(event.deltaY * PIXEL_STEP, -20, 20)
      break
    case DELTA_MODE_PAGE:
      pixelY = MathUtils.clamp(event.deltaY * PIXEL_STEP, -20, 20)
      break
  }
  return pixelY
}

export { normalizeWheel }
