var glu = require('pex-glu');
var gen = require('pex-gen');
var geom = require('pex-geom');
var materials = require('pex-materials');
var color = require('pex-color');

var Color = color.Color;
var Mesh = glu.Mesh;
var LineBuilder = gen.LineBuilder;
var SolidColor = materials.SolidColor;
var Vec3 = geom.Vec3;

function CameraHelper(camera, options) {
  options = options || { };
  this.camera = camera;
  this.lineBuilder = new LineBuilder();

  var position = camera.getPosition();
  var target = camera.getTarget();
  var far = camera.getFar();

  this.lineBuilder.addLine(position, target);

  var topRight = camera.getWorldRay(1, 1, 1, 1);
  var bottomRight = camera.getWorldRay(1, 0, 1, 1);
  var topLeft = camera.getWorldRay(0, 1, 1, 1);
  var bottomLeft = camera.getWorldRay(0, 0, 1, 1);
  this.lineBuilder.addLine(position, topRight.origin.dup().add(topRight.direction.dup().scale(far)));
  this.lineBuilder.addLine(position, bottomRight.origin.dup().add(bottomRight.direction.dup().scale(far)));
  this.lineBuilder.addLine(position, topLeft.origin.dup().add(topLeft.direction.dup().scale(far)));
  this.lineBuilder.addLine(position, bottomLeft.origin.dup().add(bottomLeft.direction.dup().scale(far)));


  this.update();
  Mesh.call(this, this.lineBuilder, new SolidColor(), { lines: true });
}

CameraHelper.prototype = Object.create(Mesh.prototype);

CameraHelper.prototype.update = function() {
  var camera = this.camera;
  //this.lineBuilder.reset();
//
  //this.skeleton.bones.forEach(function(bone) {
  //  if (bone.parent) {
  //    this.lineBuilder.addLine(bone.positionWorld, bone.parent.positionWorld);
  //  }
  //  if (this.showJoints) {
  //    this.lineBuilder.addCross(bone.positionWorld, 0.2);
  //  }
  //}.bind(this));
  //this.lineBuilder.vertices.dirty = true;
}

CameraHelper.prototype.draw = function(camera) {
  this.update(camera);
  Mesh.prototype.draw.call(this, camera);
}

module.exports = CameraHelper;