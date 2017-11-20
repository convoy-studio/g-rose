var sys         = require('pex-sys');
var glu         = require('pex-glu');
var materials   = require('pex-materials');
var color       = require('pex-color');
var gen         = require('pex-gen');
var geom        = require('pex-geom');
var fx          = require('pex-fx');
var helpers     = require('pex-helpers');

var Box               = gen.Box;
var Dodecahedron      = gen.Dodecahedron;
var Sphere            = gen.Sphere;
var Mesh              = glu.Mesh;
var ShowNormals       = materials.ShowNormals;
var SolidColor        = materials.SolidColor;
var ShowDepth         = materials.ShowDepth;
var Diffuse           = materials.Diffuse;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball           = glu.Arcball;
var Color             = color.Color;
var Program           = glu.Program;
var Material          = glu.Material;
var BoundingBox       = geom.BoundingBox;
var Cube              = gen.Cube;
var Texture2D         = glu.Texture2D;
var Time              = sys.Time;
var Vec3              = geom.Vec3;
var Quat              = geom.Quat;
var LineBuilder       = gen.LineBuilder;
var ShowColors        = materials.ShowColors;
var AxisHelper        = helpers.AxisHelper;
var ShadowMap         = require('../fx/ShadowMap');
var ObjReader         = require('../utils/ObjReader');
var ObjWriter         = require('../utils/ObjWriter');

//var INPUT_FILE  = '../../server/public/assets/shapes/selected/cube.obj';
//var INPUT_FILE  = '../../server/public/assets/shapes/selected/disc.obj';
//var INPUT_FILE  = '../../server/public/assets/shapes/selected/icosahedron.obj';
//var INPUT_FILE  = '../../server/public/assets/shapes/selected/octahedron.obj';
//var INPUT_FILE  = '../../server/public/assets/shapes/selected/cone.obj';
//var INPUT_FILE  = '../../server/public/assets/shapes/selected/feather.obj';
//var INPUT_FILE  = '../../server/public/assets/shapes/selected/cylinder.obj';
var INPUT_FILE  = '../../server/public/assets/shapes/selected/sphere.obj';
var OUTPUT_FILE = INPUT_FILE;//INPUT_FILE.replace('.obj', '_2.obj');

function makeBoundingBox(g) {
  var bbox = BoundingBox.fromPoints(g.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  var lineBuilder = new LineBuilder();
  lineBuilder.addLine(new Vec3(bbox.min.x, bbox.min.y, bbox.min.z), new Vec3(bbox.max.x, bbox.min.y, bbox.min.z))
  lineBuilder.addLine(new Vec3(bbox.max.x, bbox.min.y, bbox.min.z), new Vec3(bbox.max.x, bbox.min.y, bbox.max.z))
  lineBuilder.addLine(new Vec3(bbox.max.x, bbox.min.y, bbox.max.z), new Vec3(bbox.min.x, bbox.min.y, bbox.max.z))
  lineBuilder.addLine(new Vec3(bbox.min.x, bbox.min.y, bbox.max.z), new Vec3(bbox.min.x, bbox.min.y, bbox.min.z))

  lineBuilder.addLine(new Vec3(bbox.min.x, bbox.min.y, bbox.min.z), new Vec3(bbox.min.x, bbox.max.y, bbox.min.z))
  lineBuilder.addLine(new Vec3(bbox.max.x, bbox.min.y, bbox.min.z), new Vec3(bbox.max.x, bbox.max.y, bbox.min.z))
  lineBuilder.addLine(new Vec3(bbox.max.x, bbox.min.y, bbox.max.z), new Vec3(bbox.max.x, bbox.max.y, bbox.max.z))
  lineBuilder.addLine(new Vec3(bbox.min.x, bbox.min.y, bbox.max.z), new Vec3(bbox.min.x, bbox.max.y, bbox.max.z))

  lineBuilder.addLine(new Vec3(bbox.min.x, bbox.max.y, bbox.min.z), new Vec3(bbox.max.x, bbox.max.y, bbox.min.z))
  lineBuilder.addLine(new Vec3(bbox.max.x, bbox.max.y, bbox.min.z), new Vec3(bbox.max.x, bbox.max.y, bbox.max.z))
  lineBuilder.addLine(new Vec3(bbox.max.x, bbox.max.y, bbox.max.z), new Vec3(bbox.min.x, bbox.max.y, bbox.max.z))
  lineBuilder.addLine(new Vec3(bbox.min.x, bbox.max.y, bbox.max.z), new Vec3(bbox.min.x, bbox.max.y, bbox.min.z))
  return lineBuilder;
}

function geometryInfo(g) {
  var bbox = BoundingBox.fromPoints(g.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  console.log('Vertices:', g.vertices.length, 'Faces:', g.faces.length);
  console.log('Center:', center.toString(), 'Size:', size.toString());
}

function makeCenterd(g) {
  g = g.clone();
  var bbox = BoundingBox.fromPoints(g.vertices);
  var center = bbox.getCenter();
  g.vertices.forEach(function(v) {
    v.sub(center);
  })
  return g;
}

function makeSurfaceMounted(g) {
  g = g.clone();
  var bbox = BoundingBox.fromPoints(g.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  center.y -= size.y/2;
  g.vertices.forEach(function(v) {
    v.sub(center);
  })
  return g;
}

function makeUniform(g, scale) {
  scale = scale || 1.0;
  g = g.clone();
  var bbox = BoundingBox.fromPoints(g.vertices);
  var size = bbox.getSize();
  var maxDim = Math.max(size.x, size.y, size.z);
  var scale = scale / maxDim;
  g.vertices.forEach(function(v) {
    v.scale(scale);
  })
  return g;
}

function pullVertex(g, vertexIndex, offset) {
  g = g.clone();
  g.vertices[vertexIndex].add(offset);
  return g;
}

function makeFlat(g) {
  return g.toFlatGeometry();
}

function findVertexClosestTo(g, center) {
  var best = g.vertices.reduce(function(best, v, vi) {
    var dist = v.distance(center);

    console.log(dist)
    if (dist < best.distance) {
      best.distance = dist;
      best.index = vi;
    }
    return best;
  }, { index: -1, distance: Infinity});
  return best.index;
}

sys.Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '3d'
  },
  init: function() {
    this.showNormals = new ShowNormals();

    this.camera = new PerspectiveCamera(60, this.width / this.height, 0.1, 20);
    this.arcball = new Arcball(this, this.camera);
    this.arcball.setPosition(new Vec3(2, 2, 2))

    this.axisHelper = new AxisHelper(2);

    var uniformBoundingBoxGeometry = new Cube(1);
    uniformBoundingBoxGeometry.computeEdges();
    this.uniformBoundingBox = new Mesh(uniformBoundingBoxGeometry, new SolidColor({ color: Color.Red }), { lines: true });
    g = new Sphere(1, 8, 8)
    //ObjReader.load(INPUT_FILE, function(g) {
      geometryInfo(g);
      g = g.triangulate();
      //g = makeFlat(g);
      //g = makeCenterd(g);
      //g = makeSurfaceMounted(g);
      g = makeUniform(g, 1.2);
      //g = pullVertex(g, findVertexClosestTo(g, new Vec3(0, 0, 0)), new Vec3(0, -0.25, 0));
      geometryInfo(g);
      g.computeNormals();
      ObjWriter.save(g, OUTPUT_FILE);
      this.mesh = new Mesh(g, this.showNormals);
      this.meshBoundingBox = new Mesh(makeBoundingBox(g), new SolidColor(), { lines: true })
    //}.bind(this));
  },
  draw: function() {
    Time.verbose = true;

    glu.clearColorAndDepth(Color.DarkGrey);
    glu.enableDepthReadAndWrite(true);

    if (this.mesh) {
      this.mesh.draw(this.camera);
      this.meshBoundingBox.draw(this.camera);
    }

    this.uniformBoundingBox.draw(this.camera);
    this.axisHelper.draw(this.camera);
  }
});