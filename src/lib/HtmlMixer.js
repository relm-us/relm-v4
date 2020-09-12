import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from './CSS3DRenderer.js'

const HtmlMixer = {
  /**
   * define a context for HtmlMixer
   *
   * @param  {THREE.WebGLRenderer|THREE.CanvasRenderer} rendererWebgl the renderer in front
   * @param  {THREE.Camera} camera the camera used for the last view
   */
  Context: function (rendererWebgl, camera) {
    // update functions
    var updateFuncs = []
    this.update = () => {
      for (const fn of updateFuncs) {
        fn()
      }
    }

    // build cssFactor to workaround bug due to no display
    var cssFactor = 1000
    this.cssFactor = cssFactor

    /// ///////////////////////////////////////////////////////////////////////////////
    //    update renderer
    /// ///////////////////////////////////////////////////////////////////////////////

    var rendererCss = new CSS3DRenderer()
    this.rendererCss = rendererCss

    this.rendererWebgl = rendererWebgl

    /// ///////////////////////////////////////////////////////////////////////////////
    //    Handle Camera
    /// ///////////////////////////////////////////////////////////////////////////////

    var cssCamera = new THREE.PerspectiveCamera(
      camera.fov,
      camera.aspect,
      camera.near * cssFactor,
      camera.far * cssFactor
    )
    this.cssCamera = cssCamera
    cssCamera.zoom = camera.zoom

    this.setSizeWithCamera = (width, height, camera) => {
      rendererCss.setSize(width, height)
      cssCamera.aspect = camera.aspect
      cssCamera.fov = camera.fov
      cssCamera.zoom = camera.zoom
      cssCamera.updateProjectionMatrix()
    }

    updateFuncs.push(function () {
      cssCamera.quaternion.copy(camera.quaternion)
      // console.log('cssCamera.rotation', cssCamera.rotation);

      camera.getWorldPosition(cssCamera.position)
      // console.log('cssCamera.position', cssCamera.position);
      cssCamera.position.multiplyScalar(cssFactor)
      // console.log('cssCamera.position x cssFactor', cssCamera.position);

      cssCamera.fov = camera.fov
      cssCamera.zoom = camera.zoom

      // cssCamera.position.x = (camera.position.x + gyro.position.x) * cssFactor;
      // cssCamera.position.y = (camera.position.y + gyro.position.y) * cssFactor;
      // cssCamera.position.z = (camera.position.z + gyro.position.z) * cssFactor;
    })

    // create a new scene to hold CSS
    var cssScene = new THREE.Scene()
    this.cssScene = cssScene

    /// ///////////////////////////////////////////////////////////////////////////////
    //    Auto update objects
    /// ///////////////////////////////////////////////////////////////////////////////

    this.autoUpdateObjects = true
    updateFuncs.push(
      function () {
        if (this.autoUpdateObjects !== true) return
        cssScene.traverse(function (cssObject) {
          if (cssObject instanceof THREE.Scene === true) return
          var mixerPlane = cssObject.userData.mixerPlane
          if (mixerPlane === undefined) return
          mixerPlane.update()
        })
      }.bind(this)
    )

    /// ///////////////////////////////////////////////////////////////////////////////
    //    Render cssScene
    /// ///////////////////////////////////////////////////////////////////////////////
    updateFuncs.push(function (delta, now) {
      rendererCss.render(cssScene, cssCamera)
    })
  },

  /**
   * define plane in HtmlMixer
   *
   * @param  {HtmlMixer.Context} mixerContext context
   * @param  {HTMLElement} domElement   the dom element to mix
   * @param  {Object} opts         options to set
   */
  Plane: function (mixerContext, domElement, opts) {
    opts = opts || {}
    opts.elementW = opts.elementW !== undefined ? opts.elementW : 1024
    opts.planeW = opts.planeW !== undefined ? opts.planeW : 1
    opts.planeH = opts.planeH !== undefined ? opts.planeH : 3 / 4
    opts.object3d = opts.object3d !== undefined ? opts.object3d : null
    this.domElement = domElement

    // update functions
    var updateFuncs = []
    this.update = function () {
      updateFuncs.forEach(function (updateFct) {
        updateFct()
      })
    }

    var planeW = opts.planeW
    var planeH = opts.planeH
    var object3d
    if (opts.object3d === null) {
      var planeMaterial = new THREE.MeshBasicMaterial({
        opacity: 0,
        color: new THREE.Color('black'),
        blending: THREE.NoBlending,
        side: THREE.DoubleSide,
      })
      var geometry = new THREE.PlaneGeometry(opts.planeW, opts.planeH)
      object3d = new THREE.Mesh(geometry, planeMaterial)
    } else {
      object3d = opts.object3d
    }

    this.object3d = object3d

    // width of iframe in pixels
    var aspectRatio = planeH / planeW
    var elementWidth = opts.elementW
    var elementHeight = elementWidth * aspectRatio

    this.setDomElement = function (newDomElement) {
      console.log('setDomElement: newDomElement', newDomElement)
      // remove the oldDomElement
      var oldDomElement = domElement
      if (oldDomElement.parentNode) {
        oldDomElement.parentNode.removeChild(oldDomElement)
      }
      // update local variables
      this.domElement = domElement = newDomElement
      // update cssObject
      cssObject.element = domElement
      // reset the size of the domElement
      setDomElementSize()
    }
    function setDomElementSize() {
      domElement.style.width = elementWidth + 'px'
      domElement.style.height = elementHeight + 'px'
    }
    setDomElementSize()

    // create a CSS3DObject to display element
    var cssObject = new CSS3DObject(domElement)
    this.cssObject = cssObject
    cssObject.scale
      .set(1, 1, 1)
      .multiplyScalar(mixerContext.cssFactor / (elementWidth / planeW))

    // hook cssObject to mixerPlane
    cssObject.userData.mixerPlane = this

    // hook event so cssObject is attached to cssScene when object3d is added/removed
    object3d.addEventListener('added', function (event) {
      mixerContext.cssScene.add(cssObject)
    })
    object3d.addEventListener('removed', function (event) {
      mixerContext.cssScene.remove(cssObject)
    })

    updateFuncs.push(function () {
      // get world position
      object3d.updateMatrixWorld()
      var worldMatrix = object3d.matrixWorld

      // get position/quaternion/scale of object3d
      var position = new THREE.Vector3()
      var scale = new THREE.Vector3()
      var quaternion = new THREE.Quaternion()
      worldMatrix.decompose(position, quaternion, scale)

      // handle quaternion
      cssObject.quaternion.copy(quaternion)

      // handle position
      cssObject.position.copy(position).multiplyScalar(mixerContext.cssFactor)
      // handle scale
      var scaleFactor =
        elementWidth / (object3d.geometry.parameters.width * scale.x)
      cssObject.scale
        .set(1, 1, 1)
        .multiplyScalar(mixerContext.cssFactor / scaleFactor)
    })
  },
}

const HtmlMixerHelpers = {
  /**
   * create domElement for a iframe to insert in a HtmlmixedPlane
   *
   * @param  {String} url  the url for the iframe
   */
  createIframeDomElement: function (url) {
    // create the iframe element
    var domElement = document.createElement('iframe')
    domElement.src = url
    domElement.style.border = 'none'

    // iOS workaround for iframe
    var onIos = navigator.platform.match(/iP(hone|od|ad)/) !== null
    if (onIos) {
      // - see the following post for explanation on this workaround
      // - http://dev.magnolia-cms.com/blog/2012/05/strategies-for-the-iframe-on-the-ipad-problem/
      domElement.style.width = '100%'
      domElement.style.height = '100%'
      var container = document.createElement('div')
      container.appendChild(domElement)
      container.style.overflow = 'scroll'
      container.style.webkitOverflowScrolling = 'touch'
      return container
    }
    return domElement
  },

  /**
   * set the iframe.src in a mixerPlane.
   * - Usefull as it handle IOS specificite
   */
  setIframeSrc: function (mixerPlane, url) {
    // handle HtmlMultipleMixer.Plane
    if (HtmlMultipleMixer && mixerPlane instanceof HtmlMultipleMixer.Plane) {
      mixerPlane.planes.forEach(function (plane) {
        HtmlMixerHelpers.setIframeSrc(plane, url)
      })
      return
    }

    // sanity check
    console.assert(mixerPlane instanceof HtmlMixer.Plane)
    // get the domElement
    var domElement = mixerPlane.domElement
    // handle IOS special case
    var onIos = navigator.platform.match(/iP(hone|od|ad)/) !== null
    if (onIos) {
      domElement = mixerPlane.domElement.firstChild
    }

    // sanity check
    console.assert(domElement instanceof HTMLIFrameElement)

    // actually set the iframe.src
    domElement.src = url
  },

  /**
   * create domElement for a image to insert in a HtmlmixedPlane
   *
   * @param  {String} url  the url for the iframe
   */
  createImageDomElement: function (url = '') {
    var domElement = document.createElement('img')
    domElement.src = url
    return domElement
  },

  /**
   * Make domElements full screen and attach to document
   *
   * @param {HTMLMixer.Context} mixerContext
   * @param {HTMLElement} parentNode    Probably document.body
   */
  attachDomElements: function (mixerContext, parentNode) {
    // set up rendererCss
    var css3dElement = mixerContext.rendererCss.domElement
    css3dElement.style.position = 'absolute'
    css3dElement.style.top = '0px'
    css3dElement.style.width = '100%'
    css3dElement.style.height = '100%'
    css3dElement.id = 'csscanvas'
    parentNode.appendChild(css3dElement)

    // set up rendererWebgl
    var webglCanvas = mixerContext.rendererWebgl.domElement
    webglCanvas.style.position = 'absolute'
    webglCanvas.style.top = '0px'
    webglCanvas.style.width = '100%'
    webglCanvas.style.height = '100%'
    webglCanvas.style.pointerEvents = 'none'
    css3dElement.appendChild(webglCanvas)
  },
}

export { HtmlMixer, HtmlMixerHelpers }
