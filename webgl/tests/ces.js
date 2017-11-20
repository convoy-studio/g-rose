var sys       = require('pex-sys');
var glu       = require('pex-glu');
var materials = require('pex-materials');
var color     = require('pex-color');
var gen       = require('pex-gen');
var geom      = require('pex-geom');
var gui       = require('pex-gui');
var fx        = require('pex-fx');
var gui       = require('pex-gui');
var Q         = require('q');
var R         = require('ramda');
var Pocket    = require('../pkt');

var Box                 = gen.Box;
var Cube                = gen.Cube;
var Sphere              = gen.Sphere;
var Dodecahedron        = gen.Dodecahedron;
var Tetrahedron         = gen.Tetrahedron;
var Mesh                = glu.Mesh;
var PerspectiveCamera   = glu.PerspectiveCamera;
var Arcball             = glu.Arcball;
var Texture2D           = glu.Texture2D;
var TextureCube         = glu.TextureCube;
var ShowNormals         = materials.ShowNormals;
var SolidColor          = materials.SolidColor;
var TexturedCubeMap     = materials.TexturedCubeMap;
var ShowDepth           = materials.ShowDepth;
var Color               = color.Color;
var Platform            = sys.Platform;
var Window              = sys.Window;
var Time                = sys.Time;
var Vec3                = geom.Vec3;
var Quat                = geom.Quat;
var Mat4                = geom.Mat4;
var GUI                 = gui.GUI;
var Buffer              = require('../glu/Buffer');

var pkt = new Pocket();

//-----------------------------------------------------------------------------

pkt.componentType('geometry', function(cmp, options) {
  cmp.geometry = options.geometry || null;
});

pkt.componentType('transform', function(cmp, options) {
  cmp.position = options.position || new Vec3(0, 0, 0);
  cmp.rotation = options.rotation || new Quat();
  cmp.scale = options.scale || new Vec3(1, 1, 1);
});

pkt.componentType('camera', function(cmp, options) {
  cmp.target = options.target || new Vec3(0, 0, 0);
});

pkt.componentType('material', function(cmp, options) {
  cmp.material = options.material || null;
  cmp.uniforms = options.uniforms || { };
});

//-----------------------------------------------------------------------------

Window.create({
  init: function() {
    this.camera = new PerspectiveCamera(60, this.width / this.height);
    this.arcball = new Arcball(this, this.camera);
    this.mesh = new Mesh(new Cube(), new ShowNormals());

    var self = this;

    pkt.key({
      'camera': {
        target: new Vec3(0, 1, 0)
      },
      'transform': {
        position: new Vec3(0, 0, 5),
        rotation: new Quat(),
        scale: new Vec3(1, 1, 1)
      }
    });

    pkt.key({
      'id' : 'cube',
      'geometry': {
        geometry: new Cube()
      },
      'transform': {
        position: new Vec3(0, 0, 0),
        rotation: new Quat(),
        scale: new Vec3(1, 1, 1)
      },
      'material' : {
        material: new SolidColor(),
        uniforms: {
          color: Color.Red
        }
      }
    });

    pkt.key({
      'id' : 'cube2',
      'geometry': {
        geometry: new Cube()
      },
      'transform': {
        position: new Vec3(0.5, 0.2, 0.5),
        rotation: new Quat(),
        scale: new Vec3(1, 1, 1)
      },
      'material' : {
        material: new SolidColor(),
        uniforms: {
          color: Color.White
        }
      }
    });

    var gl = self.gl;

    pkt.systemForEach(
      'geometry-compiler',
      ['geometry'],
      function(pkt, key, geometry) {
        var indexTypes = ['faces', 'edges', 'indices'];

        var attribs = geometry.geometry.attribs;
        var buffers = geometry.buffers;
        if (!buffers) {
          buffers = geometry.buffers = {};
        }

        Object.keys(attribs).forEach(function(attribName) {
          var attrib = attribs[attribName];
          if (!buffers[attribName]) {
            var usage = attrib.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
            buffers[attribName] = new Buffer(gl.ARRAY_BUFFER, Float32Array, null, usage);
            attrib.dirty = true
          }
          if (attrib.dirty) {
            buffers[attribName].update(attrib)
            attrib.dirty = false
          }
        });

        indexTypes.forEach(function(indexType) {
          if (geometry.geometry[indexType]) {
            if (!buffers[indexType]) {
            var usage = geometry.geometry[indexType].dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
            buffers[indexType] = new Buffer(gl.ARRAY_BUFFER, Uint16Array, null, usage);
            geometry.geometry[indexType].dirty = true
          }
          if (geometry.geometry[indexType].dirty) {
            buffers[indexType].update(geometry.geometry[indexType])
            geometry.geometry[indexType].dirty = false
          }
          }
        });
      }
    )

    pkt.systemForEach(
      'renderer',
      ['transform', 'geometry', 'material'],
      function(pkt, key, transform, geometry, material) {
        var camera = self.camera;

        if (!material.primitiveType) {
          material.primitiveType = gl.TRIANGLES
        }

        if (!transform.projectionMatrix) {
          transform.projectionMatrix = Mat4.create()
          transform.viewMatrix = Mat4.create()
          transform.invViewMatrix = Mat4.create()
          transform.modelWorldMatrix = Mat4.create()
          transform.modelViewMatrix = Mat4.create()
          transform.rotationMatrix = Mat4.create()
          transform.normalMatrix = Mat4.create()
        }

        var program = material.material.program;
        var attribs = geometry.geometry.attribs;

        //@updateMatrices camera
        // position = if instance and instance.position then instance.position else @position
        // rotation = if instance and instance.rotation then instance.rotation else @rotation
        // scale = if instance and instance.scale then instance.scale else @scale

        transform.rotation.toMat4(transform.rotationMatrix)
        transform.modelWorldMatrix.identity()
          .translate(transform.position.x, transform.position.y, transform.position.z)
          .mul(transform.rotationMatrix)
          .scale(transform.scale.x, transform.scale.y, transform.scale.z)

        if (camera) {
          transform.projectionMatrix
            .copy(camera.getProjectionMatrix())

          transform.viewMatrix
            .copy(camera.getViewMatrix())

          transform.invViewMatrix
            .copy(camera.getViewMatrix().dup().invert())

          transform.modelViewMatrix
            .copy(camera.getViewMatrix())
            .mul(transform.modelWorldMatrix)

          transform.normalMatrix
            .copy(transform.modelViewMatrix)
            .invert()
            .transpose()
        }

        //@updateMatricesUniforms @material

        programUniforms = material.material.program.uniforms
        materialUniforms = material.material.uniforms

        if (programUniforms.projectionMatrix) materialUniforms.projectionMatrix = transform.projectionMatrix;
        if (programUniforms.viewMatrix) materialUniforms.viewMatrix = transform.viewMatrix;
        if (programUniforms.invViewMatrix) materialUniforms.invViewMatrix = transform.invViewMatrix;
        if (programUniforms.modelWorldMatrix) materialUniforms.modelWorldMatrix = transform.modelWorldMatrix;
        if (programUniforms.modelViewMatrix) materialUniforms.modelViewMatrix = transform.modelViewMatrix;
        if (programUniforms.normalMatrix) materialUniforms.normalMatrix = transform.normalMatrix;

        Object.keys(material.uniforms).forEach(function(uniformName) {
          material.material.uniforms[uniformName] = material.uniforms[uniformName];
        })

        material.material.use()

        //bindAttribs

        Object.keys(attribs).forEach(function(attribName) {
          var attrib = attribs[attribName];

          //# TODO:this should go another way instad of searching for mesh atribs in shader look for required attribs by shader inside mesh
          attrib.location = gl.getAttribLocation(program.handle, attrib.name);
          if (attrib.location >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffers[attribName].handle)
            gl.vertexAttribPointer(attrib.location, geometry.buffers[attribName].elementSize, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(attrib.location)
          }
        });

        //draw

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.buffers['faces'].handle)
        gl.drawElements(material.primitiveType, geometry.buffers['faces'].dataBuf.length, gl.UNSIGNED_SHORT, 0);
      }
    );

    pkt.tick(Time.delta*1000);
  },
  draw: function() {
    glu.clearColorAndDepth();
    glu.enableDepthReadAndWrite();
    pkt.tick(Time.delta*1000);
    //this.mesh.draw(this.camera);
  }
})