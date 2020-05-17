
/**
 * Shader code from view-source:http://stemkoski.github.io/Three.js/Shader-Halo.html
 */

const vertexShader = [
  'varying vec3 vNormal;',
  'void main()',
  '{',
  '    vNormal = normalize( normalMatrix * normal );',
  '    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
  '}'
].join('\n')

const fragmentShader = [
  'varying vec3 vNormal;',
  'void main()', 
  '{',
  '  float intensityBot = pow( 0.1 - dot( vNormal, vec3( 0.0, -1.0, 0.0 ) ), 2.0 ) + 0.2;',
  '  float intensityTop = pow( 0.2 - dot( vNormal, vec3( 0.0, 1.0, 0.0 ) ), 2.0 );',
  '    gl_FragColor = vec4( 0.75, 0.75, 0.75, 0.75 ) * intensityBot +',
  '                   vec4( 1.0, 0.25, 0.0, 0.75 ) * intensityTop;',
  '}'
].join('\n')

// See https://threejs.org/docs/#api/en/materials/ShaderMaterial

const GlowMaterial = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader,
  fragmentShader,
  side: THREE.BothSide,
  blending: THREE.AdditiveBlending,
  transparent: true
})

export { GlowMaterial }
