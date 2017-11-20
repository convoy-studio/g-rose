var sys = require('pex-sys');
var color = require('pex-color');
var Model = require('./Model');
var glu = require('pex-glu');
var geom = require('pex-geom');
var materials = require('pex-materials');
var RoseMaterial = require('../materials/RoseMaterial');
var SkinnedRoseMaterial = require('../materials/SkinnedRoseMaterial');

var SkinnedSolidColor = require('../materials/SkinnedSolidColor');
var SkinnedTextured = require('../materials/SkinnedTextured');
var SolidColor = materials.SolidColor;

var ShapePlacementGenerator = require('./ShapePlacementGenerator');

var Time = sys.Time;
var Color = color.Color;
var Context = glu.Context;
var Texture2D = glu.Texture2D;
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

function Look() {
  this.bodyModel = null;
  this.garmentModel = null;
  this.garments = [];
  this.shapeModel = null;
  this.shapeInstances = [];
  this.bakedShapesModel = null;
  this.animationTime = -0.0001;
  this.animtionEnabled = false;
  this.seed = Date.now();
  this.position = new Vec3();
  this.drawShapes = false;

  //this.bodyMaterial = new SkinnedSolidColor({ color: Color.Black });
  //this.bodyMaterial = new RoseMaterial({lightPos: new Vec3(7, 10, 15), usePhong:true});
  this.bodyMaterial = new RoseMaterial({lightPos: new Vec3(7, 10, 15), usePhong:true});

  this.bodyWireframeMaterial = new SkinnedSolidColor({ color: Color.White });

  //this.garmentMaterial = new SkinnedSolidColor({ color: Color.Red });
  this.garmentMaterial = new RoseMaterial({lightPos: new Vec3(7, 10, 5), color: Color.create(.2, .2, .2, 1), usePhong: true});
  this.garmentWireframeMaterial = new SkinnedSolidColor({ color: Color.White });

  this.shapeMaterial = new SolidColor({ color: Color.Yellow });

  this.shapePlacementGenerator = new ShapePlacementGenerator();
  this.shapePlacementGenerator.setRandomSeed(this.seed);
  this.shapes = [];
}

Look.prototype.setAnimationEnabled = function(state) {
  this.animtionEnabled = state;
  if (!this.animtionEnabled) {
    this.animationTime = -0.0001;
  }
}

Look.prototype.setBody = function(bodyModel) {
  this.bodyModel = bodyModel;
  this.bodyModel.setMaterial(this.bodyMaterial);

  this.bodyModel.geometry.computeEdges();
/*
  this.bodyWireframe = new Model(this.bodyModel.geometry, this.bodyWireframeMaterial, {
    lines: true, skeleton: this.bodyModel.skeleton, skeletonAnimation: this.bodyModel.skeletonAnimation, morphTargets: this.bodyModel.morphTargets
  });
*/
}

Look.prototype.getBody = function() {
  return this.bodyModel;
}

Look.prototype.setGarment = function(garmentModel) {
  throw 'Look.prototype.setGarment is deprecated';
}

Look.prototype.setGarments = function(garments){
  this.garments = garments;
  for(var i=0; i<garments.length; i++){
    this.garments[i].setMaterial(this.garmentMaterial);
    this.garments[i].geometry.computeEdges();
    //this.bindGarmentToBody(this.garments[i]);
  }
  this.generateShapeInstances(this.garments);
  this.garmentModel = this.garments[0];
}
Look.prototype.setGarmentMaterial = function(index, material){
  this.garments[index].setMaterial(material);
}

Look.prototype.setShapeMaterial = function(material) {
  this.shapeMaterial = material;
}

Look.prototype.getGarment = function() {
  return this.garments[0];
}

Look.prototype.getGarments = function() {
  return this.garments;
}

Look.prototype.getBakedShapes = function() {
  return this.bakedShapesModel;
}

Look.prototype.setShape = function(shapeModel) {
  this.shapeModel = shapeModel;
  this.shapeModel.setMaterial(this.shapeMaterial);
  //this.generateShapeInstances(this.garmentModel);
}

Look.prototype.setShapePlacement = function(name) {
  if(name=="user") {
    this.drawShapes = false;
  } else {
    this.drawShapes = true;
    this.shapePlacementGenerator.setMethod(name);
    //this.generateShapeInstances(this.garmentModel);
    this.generateShapeInstances(this.garments);
  }

}

Look.prototype.setShapeScale = function(scale) {
  this.shapePlacementGenerator.setScale(scale);
  //this.generateShapeInstances(this.garmentModel);
}

Look.prototype.generateShapeInstances = function(garments) {
  this.shapeInstances = [];
  for (var i=0; i<garments.length; i++) {
    var newShapes = this.shapePlacementGenerator.generateInstances(this.garments[i].geometry);
    this.shapeInstances=this.shapeInstances.concat(newShapes);
  }

  //this.bakeShapes();
}

Look.prototype.bakeShapes = function() {
  if (!this.shapeModel) return;

  var vertices = [];
  var faces = [];
  var shapeGeometry = this.shapeModel.geometry;
  var offset = 0;
  var instancePositions = [];
  this.shapeInstances.forEach(function(instance, instanceIndex) {
    for (var i=0; i<shapeGeometry.vertices.length; i++) {
      var v = shapeGeometry.vertices[i];
      v = v.dup();
      if ( instance.scale    ) v = v.scale(instance.scale.x);
      if ( instance.rotation ) v = v.transformQuat(instance.rotation);
      if ( instance.position ) v = v.add(instance.position);
      vertices.push(v);
      instancePositions.push(instance.position);
    }
    for(var i=0; i<shapeGeometry.faces.length; i++) {
      faces.push(shapeGeometry.faces[i].map(function(vi) {
        return vi + offset;
      }))
    }
    offset += shapeGeometry.vertices.length;
  })

  var bakedGeometry = new Geometry({ vertices: vertices, faces: faces});
  bakedGeometry.addAttrib('instancePositions', 'instancePosition', instancePositions);
  bakedGeometry.computeNormals();
  this.bakedShapesModel = new AnimatedMesh(bakedGeometry, this.shapeMaterial);
  this.bindGarmentToBody(this.bakedShapesModel);
}

Look.prototype.bindGarmentToBody = function(garmentModel) {
  garmentModel.skeleton = this.bodyModel.skeleton;

  var skinIndices = [];
  var skinWeights = [];
  var skinColors = [];
  var numBones = 0;
  var bodyMesh = this.bodyModel;
  var bodyGeometry = bodyMesh.geometry;

  garmentModel.geometry.vertices.forEach(function(v, vi) {
    var currVertex = v;
    if (garmentModel.geometry.instancePositions) {
      currVertex = garmentModel.geometry.instancePositions[vi];
    }
    var bestVertex = bodyGeometry.vertices.reduce(function(bestVertex, vertex, vertexIndex) {
      var dist = currVertex.squareDistance(vertex);
      if (dist < bestVertex.dist) {
        return {
          position: vertex,
          index: vertexIndex,
          dist: dist
        }
      }
      else {
        return bestVertex;
      }
    }, { index: -1, dist: Infinity });

    skinIndices.push(bodyMesh.skeletonAnimation.skinIndices[bestVertex.index*2]);
    skinIndices.push(bodyMesh.skeletonAnimation.skinIndices[bestVertex.index*2+1]);
    skinWeights.push(bodyMesh.skeletonAnimation.skinWeights[bestVertex.index*2]);
    skinWeights.push(bodyMesh.skeletonAnimation.skinWeights[bestVertex.index*2+1]);
  }.bind(this));

  //dirty, clear properly
  garmentModel.geometry.baseVertices = null;
  garmentModel.geometry.skinIndices = null;
  garmentModel.geometry.skinWeights = null;

  //this.garmentWireframe.geometry.baseVertices = null;
  //this.garmentWireframe.geometry.skinIndices = null;
  //this.garmentWireframe.geometry.skinWeights = null;

  garmentModel.skeletonAnimation = new SkeletonAnimation(this.bodyModel.skeleton, this.bodyModel.skeletonAnimation.animationData, skinIndices, skinWeights)
  //this.garmentWireframe.skeletonAnimation = this.garmentModel.skeletonAnimation;
}

Look.prototype.update = function() {
  if (this.animtionEnabled) {
    this.animationTime += Time.delta;
  }

  if (this.bodyModel) {
    this.bodyModel.update(this.animationTime);
    this.bodyModel.position.setVec3(this.position);
  }

  if (this.bakedShapesModel) {
    this.bakedShapesModel.update(this.animationTime);
    this.bakedShapesModel.position.setVec3(this.position);
  }

  for (i=0; i<this.garments.length; i++) {
    this.garments[i].update(this.animationTime);
    this.garments[i].position.setVec3(this.position);
  }

}

Look.prototype.draw = function(camera) {
  this.update();

  var gl = Context.currentContext;

  gl.lineWidth(2);

  if (this.bodyModel) { this.bodyModel.draw(camera); }
  if (this.garmentModel) { this.garmentModel.draw(camera); }
  if (this.shapeModel && this.drawShapes == true) { this.shapeModel.drawInstances(camera, this.shapeInstances); }

  if (this.garments.length >0) {
    for (i=0; i<this.garments.length; i++) {
      this.garments[i].draw(camera);
    }
  }

  gl.lineWidth(1);
}

module.exports = Look;