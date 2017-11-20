var sys       = require('pex-sys');
var color     = require('pex-color');
var glu       = require('pex-glu');
var geom      = require('pex-geom');
var R         = require('ramda');

var Time                      = sys.Time;
var Color                     = color.Color;
var Context                   = glu.Context;
var Texture2D                 = glu.Texture2D;
var Mesh                      = glu.Mesh;
var Vec3                      = geom.Vec3;
var Geometry                  = geom.Geometry;
var UberMaterial              = require('../materials/UberMaterial');
var ShapePlacementGenerator   = require('./ShapePlacementGenerator');

function Look() {
  this.bodyModel = null;
  this.garments = [];
  this.shapeModel = null;
  this.shapeInstances = [];
  this.bakedShapesModel = null;
  this.animationTime = -0.0001;
  this.animtionEnabled = false;
  this.seed = Date.now();
  this.position = new Vec3();
  this.drawShapes = false;

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
  this.bodyModel.geometry.computeEdges();
  this.bodyWireframe = new Mesh(this.bodyModel.geometry, bodyModel.material, { lines: true });
}

Look.prototype.getBody = function() {
  return this.bodyModel;
}

Look.prototype.setGarment = function(garmentModel) {
  throw 'Look.prototype.setGarment is deprecated';
}

Look.prototype.setGarments = function(garments){
  this.garments = garments;
  garments.forEach(function(garment) {
    garment.bindToOtherMeshSkeleton(this.bodyModel);
  }.bind(this));
}

Look.prototype.getGarments = function() {
  return this.garments;
}

Look.prototype.getBakedShapes = function() {
  return this.bakedShapesModel;
}

Look.prototype.setShape = function(shapeModel) {
  this.shapeModel = shapeModel;
}

Look.prototype.getShape = function() {
  return this.shapeModel;
}

Look.prototype.setShapePlacement = function(name) {
  if (name == "user") {
    this.drawShapes = false;
  }
  else {
    this.drawShapes = true;
    this.shapePlacementGenerator.setMethod(name);
    this.generateShapeInstances();
  }
}

Look.prototype.setShapeScale = function(scale) {
  this.shapePlacementGenerator.setScale(scale);
  this.generateShapeInstances();
}

Look.prototype.setDrawShapes = function(drawShapes) {
this.drawShapes = drawShapes;
}

Look.prototype.generateShapeInstances = function(garments) {
  this.shapeInstances = R.flatten(this.garments.map(function(garment, i){
    return this.shapePlacementGenerator.generateInstances(this.garments[i].geometry);
  }.bind(this)));

  this.bakeShapes();
}

Look.prototype.setShapeInstances = function(instances) {
  this.shapeInstances = instances;
}

Look.prototype.bakeShapes = function() {
  if (!this.shapeModel) return;

  var vertices = [];
  var normals = [];
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
      if (shapeGeometry.normals && shapeGeometry.normals.length > 0) normals.push(shapeGeometry.normals[i]);
      instancePositions.push(instance.position);
    }
    for(var i=0; i<shapeGeometry.faces.length; i++) {
      faces.push(shapeGeometry.faces[i].map(function(vi) {
        return vi + offset;
      }))
    }
    offset += shapeGeometry.vertices.length;
  })

  var bakedGeometry = new Geometry({ vertices: vertices, faces: faces, normals: normals});
  bakedGeometry.addAttrib('instancePositions', 'instancePosition', instancePositions);
  if (normals.length == 0) bakedGeometry.computeNormals();
  this.bakedShapesModel = new Mesh(bakedGeometry, this.shapeModel.material);

  this.bakedShapesModel.bindToOtherMeshSkeleton(this.bodyModel);
}

Look.prototype.bindShapeInstances = function() {
  var bodyModel = this.bodyModel;

  this.shapeInstances.forEach(function(shapeInstance) {
    shapeInstance.basePosition = shapeInstance.position.dup();
    shapeInstance.baseRotation = shapeInstance.rotation.dup();

    var currVertex = shapeInstance.position;

    var bestVertex = bodyModel.geometry.vertices.reduce(function(bestVertex, vertex, vertexIndex) {
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

    shapeInstance.uniforms = {};
    shapeInstance.uniforms.skinIndices = bodyModel.geometry.skinIndices[bestVertex.index];
    shapeInstance.uniforms.skinWeights = bodyModel.geometry.skinWeights[bestVertex.index];
  })
}

Look.prototype.update = function(time) {
  if (this.animtionEnabled) {
    if (time) {
      this.animationTime = time;
    }
    else {
      this.animationTime += Time.delta;
    }
  }

  if (this.bodyModel) {
    if (this.bodyModel.skinnedBoundingBox && this.bodyModel.skinnedBoundingBox.min) {
      this.position.y = -this.bodyModel.skinnedBoundingBox.min.y;
    }
    this.bodyModel.skeleton.update(this.animationTime);
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

  if (this.shapeModel && this.drawShapes) {
    var bones = this.bodyModel.skeleton.bones;
    for(var i=0; i<this.shapeInstances.length; i++) {
      var shapeInstance = this.shapeInstances[i];
      if (!shapeInstance.uniforms) {
        shapeInstance.uniforms = {};
      }
      shapeInstance.uniforms.worldOffset = this.position;
    }
  }
}

Look.prototype.draw = function(camera) {
  this.update();

  var gl = Context.currentContext;

  gl.lineWidth(2);

  if (this.bodyModel) {
    this.bodyModel.draw(camera);
  }

  if (this.shapeModel && this.drawShapes) {
    this.shapeModel.drawInstances(camera, this.shapeInstances);
  }

  if (this.garments.length > 0) {
    for (i=0; i<this.garments.length; i++) {
      this.garments[i].draw(camera);
    }
  }

  if (this.bakedShapesModel) {
    console.log('bakedShapesModel')
    this.bakedShapesModel.draw(camera);
  }
  gl.lineWidth(1);
}

Look.prototype.dispose = function(options) {
  //TODO: look.dispose()
}

module.exports = Look;