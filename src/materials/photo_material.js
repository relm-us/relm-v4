
/**
 * Shader code from https://bl.ocks.org/duhaime/c8375f1c313587ac629e04e0253481f9
 */

const vertexShader = [
  'varying vec2 vUv;',
  'void main() {',
  '  vUv = uv;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
  '}',
].join('\n')

const fragmentShader = [
  'precision highp float;',
  'uniform sampler2D texture;',
  'varying vec2 vUv;',
  'void main() {',
  '  gl_FragColor = texture2D(texture, vUv);',
  '}',
].join('\n')

// See https://threejs.org/docs/#api/en/materials/ShaderMaterial

const PhotoMaterial = ({ texture, blending = THREE.NormalBlending }) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      texture: {
        type: 't',
        value: texture
      }
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    blending,
    transparent: true
  })
}

export { PhotoMaterial }
