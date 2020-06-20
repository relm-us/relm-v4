import stampit from 'stampit'

const FindIntersectionsFromScreenCoords = stampit({
  init({ stage }) {
    this.stage = stage

    this._screenCoords = {x: 0, y: 0}
    this._raycaster = new THREE.Raycaster()
    this._intersectsMany = []
    this._intersectsOne = []
  },

  methods: {
    clear() {
      this._intersectsMany.length = 0
      this._intersectsOne.length = 0
    },
    
    setScreenCoords(x, y) {
      this._screenCoords = {x, y}
    },
    
    _getNormalizedCoords() {
      return {
        x: (this._screenCoords.x / window.innerWidth) * 2 - 1,
        y: -(this._screenCoords.y / window.innerHeight) * 2 + 1
      }
    },

    getOneIntersection(object3d) {
      this._raycaster.setFromCamera(this._getNormalizedCoords(), this.stage.camera)
      this._intersectsOne.length = 0
      this._raycaster.intersectObject(object3d, true, this._intersectsOne)
      return this._intersectsOne.length === 0 ? null : this._intersectsOne[0]
    },
    
    getAllIntersectionsOnStage() {
      this._raycaster.setFromCamera(this._getNormalizedCoords(), this.stage.camera)

      // Using a list of entites that are currently on stage, filter for those 
      // that can receive mouse pointer, and return their Object3D.
      //
      // This `reduce` is equivalent to a `.map` and a `.filter`, combined for speed
      const objects = this.stage.entitiesOnStage.reduce((accum, entity) => {
        if (entity.receivesPointer) {
          accum.push(entity.object)
        }
        return accum
      }, [])
      
      // Reduce length to zero rather than garbage collect (speed optimization)
      this._intersectsMany.length = 0
      this._raycaster.intersectObjects(objects, true, this._intersectsMany)

      this._intersectsMany.forEach((intersection) => {
        const entity = findEntityForObject(this.stage.entitiesOnStage, intersection.object)
        intersection.entity = entity
      })
      
      return this._intersectsMany
    },

    getFirstIntersectionPoint(x, y) {
      this.setScreenCoords(x, y)
      let intersects = this.getAllIntersectionsOnStage()

      if (intersects.length > 0) {
        return intersects[0].point
      } else {
        intersects = this.getOneIntersection(this.stage.background.object)
        if (intersects) {
          return intersects.point
        }
      }
    }
  }
})


/**
 * Look for the Entity that owns an object, given that the object might be
 * a leaf in the scene graph.
 * 
 * @param {Array<Entity>} entities 
 * @param {Object3D} object 
 */
function findEntityForObject(entities, object) {
  if (!object.parent) {
    return null
  }
  
  let o = object
  // Entities that `HasObject` always have a 'dummy' object that contains
  // the real object, so we check for grandparent being null rather than parent
  while (o.parent.parent) {
    o = o.parent
  }
  
  for (let entity of entities) {
    if (entity.object == o) {
      return entity
    }
  }
  
  return null
}


export { FindIntersectionsFromScreenCoords }
