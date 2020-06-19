/**
 * @author benaadams / https://twitter.com/ben_a_adams
 * @author Mugen87 / https://github.com/Mugen87
 * @author hughes
 */

const { Geometry, BufferGeometry, Float32BufferAttribute, Vector2, Vector3 } = THREE

import { create, real53 } from 'lib0/prng'

// RoughCircleGeometry

function RoughCircleGeometry( radius, segments, borderRadiusVariance, randomSeed, thetaStart, thetaLength ) {

	Geometry.call( this );

	this.type = 'CircleGeometry';

	this.parameters = {
    radius: radius,
    borderRadiusVariance: borderRadiusVariance,
		segments: segments,
		thetaStart: thetaStart,
		thetaLength: thetaLength
	};

	this.fromBufferGeometry( new RoughCircleBufferGeometry( radius, segments, borderRadiusVariance, randomSeed, thetaStart, thetaLength ) );
	this.mergeVertices();

}

RoughCircleGeometry.prototype = Object.create( Geometry.prototype );
RoughCircleGeometry.prototype.constructor = RoughCircleGeometry;

// RoughCircleBufferGeometry

function RoughCircleBufferGeometry( radius, segments, borderRadiusVariance, randomSeed, thetaStart, thetaLength ) {

	BufferGeometry.call( this );

	this.type = 'RoughCircleBufferGeometry';

	this.parameters = {
    radius: radius,
    borderRadiusVariance: borderRadiusVariance,
		segments: segments,
		thetaStart: thetaStart,
		thetaLength: thetaLength
	};

	radius = radius || 1;
	segments = segments !== undefined ? Math.max( 3, segments ) : 8;

	thetaStart = thetaStart !== undefined ? thetaStart : 0;
	thetaLength = thetaLength !== undefined ? thetaLength : Math.PI * 2;

  var prng = create(randomSeed)
	// buffers

	var indices = [];
	var vertices = [];
	var normals = [];
	var uvs = [];

	// helper variables

	var i, s;
	var vertex = new Vector3();
	var uv = new Vector2();

	// center point

	vertices.push( 0, 0, 0 );
	normals.push( 0, 0, 1 );
	uvs.push( 0.5, 0.5 );

	for ( s = 0, i = 3; s <= segments; s ++, i += 3 ) {

		var segment = thetaStart + s / segments * thetaLength;

		// vertex

    const rnd = real53(prng) - 0.5
    const variance = (rnd * borderRadiusVariance)
		vertex.x = (radius + variance) * Math.cos( segment );
		vertex.y = (radius + variance) * Math.sin( segment );

		vertices.push( vertex.x, vertex.y, vertex.z );

		// normal

		normals.push( 0, 0, 1 );

		// uvs

		uv.x = ( vertices[ i ] / (radius) + 1 ) / 2;
		uv.y = ( vertices[ i + 1 ] / (radius) + 1 ) / 2;

		uvs.push( uv.x, uv.y );

	}

	// indices

	for ( i = 1; i <= segments; i ++ ) {

		indices.push( i, i + 1, 0 );

	}

	// build geometry

	this.setIndex( indices );
	this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
	this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

}

RoughCircleBufferGeometry.prototype = Object.create( BufferGeometry.prototype );
RoughCircleBufferGeometry.prototype.constructor = RoughCircleBufferGeometry;


export { RoughCircleGeometry, RoughCircleBufferGeometry };
