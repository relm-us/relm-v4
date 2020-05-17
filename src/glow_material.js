
/**
 * Shader code from view-source:http://stemkoski.github.io/Three.js/Shader-Halo.html
 */

const vertextShader = [
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
  '  float intensity = pow( 0.7 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), 4.0 );',
  '    gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
  '}'
].join('\n')

// See https://threejs.org/docs/#api/en/materials/ShaderMaterial

const GlowMaterial = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader,
  fragmentShader,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true
})

export { GlowMaterial }
