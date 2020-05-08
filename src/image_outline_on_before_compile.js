// TODO: use this shader to show an outline around selected images
// see https://jsfiddle.net/c78evfx4/5/ and https://discourse.threejs.org/t/how-to-create-a-simple-outline-around-a-png-sprite/6921/3
const imageOutlineOnBeforeCompile = (outlineColor, outlineThickness) => (shader) => {
	// code based on: https://www.daniel-buckley.com/blog/2017/12/6/dev-diary-research-report-2d-sprite-outline-shaders

  var width = window.innerWidth
  var height = window.innerHeight

  shader.uniforms.outlineColor = { value: outlineColor }
  shader.uniforms.outlineThickness = { value: outlineThickness }
  shader.uniforms.resolution = { value: new THREE.Vector2( width, height ) }

  shader.fragmentShader = 'uniform vec3 outlineColor;\n' + shader.fragmentShader
  shader.fragmentShader = 'uniform float outlineThickness;\n' + shader.fragmentShader
  shader.fragmentShader = 'uniform vec2 resolution;\n' + shader.fragmentShader
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    [
      '#ifdef USE_MAP',

      '	vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );',

      '	texelColor = mapTexelToLinear( texelColor );',

      ' vec2 texel = vec2( 1.0 / resolution.y, 1.0 / resolution.y );',
      
      ' #define OFFSET_COUNT 8',
      ' vec2 offsets[OFFSET_COUNT];',
      ' offsets[0] = vec2( 0, 1 );',
      ' offsets[1] = vec2( 0, -1 );',
			' offsets[2] = vec2( 1, 0 );',
			' offsets[3] = vec2( -1, 0 );',
      ' offsets[4] = vec2( -1, 1 );',
      ' offsets[5] = vec2( 1, -1 );',
			' offsets[6] = vec2( 1, 1 );',      
			' offsets[7] = vec2( -1, -1 );',
      
      '#ifdef INSET_OUTLINE',
      
      ' float a = 1.0;',
      ' for( int i = 0; i < OFFSET_COUNT; i ++ ) {',
      '  float val = texture2D( map, vUv + texel * offsets[i] * outlineThickness ).a;',
      '  a *= val;',
      ' }',

      ' texelColor.rgb = mix( outlineColor, texelColor.rgb, a );',
      '#else',
      
      ' float a = 0.0;',
      ' for( int i = 0; i < OFFSET_COUNT; i ++ ) {',
      '  float val = texture2D( map, vUv + texel * offsets[i] * outlineThickness ).a;',
      '  a = max(a, val);',
      ' }',
      ' texelColor = mix( vec4(outlineColor, a), texelColor, texelColor.a );',
      '#endif',
      
      '	diffuseColor *= texelColor;',
      
      '#endif'
    ].join( '\n' )
  )
}

export { imageOutlineOnBeforeCompile }