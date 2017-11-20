var geom = require('pex-geom');
var SimplexNoise = require('simplex-noise');

var Vec3 = geom.Vec3;
var Quat = geom.Quat;
var BoundingBox = geom.BoundingBox;

function ShapePlacementGenerator() {
  this.method = "vertices";
  this.scale = 1;
  this.maxNumInstances = 300;
  this.seed = Date.now();
  this.simplex = new SimplexNoise();
}

ShapePlacementGenerator.PlacementMethods = [
  'vertices',
  'verticesAligned',
  'facesAligned',
  'randomAligned',
  'heavyTopAligned',
  'heavyBottomAligned',
  'symmerticalAligned',
  'asymmetricalAligned',
  'noiseAligned',
  'edgesAligned',
];

ShapePlacementGenerator.prototype.generateInstances = function(geometry) {
  geom.randomSeed(this.seed);
  switch(this.method) {
    case "vertices": return this.generateVertices(geometry);
    case "verticesAligned": return this.generateVertices(geometry);
    case "facesAligned": return this.generateFacesAligned(geometry);
    case "randomAligned": return this.generateRandomAligned(geometry);
    case "heavyTopAligned": return this.generateHeavyTopAligned(geometry);
    case "heavyBottomAligned": return this.generateHeavyBottomAligned(geometry);
    case "symmetricalAligned": return this.generateSymmetricalAligned(geometry);
    case "asymmetricalAligned": return this.generateAsymmetricalAligned(geometry);
    case "noiseAligned": return this.generateNoiseAligned(geometry);
    case "edgesAligned": return this.generateEdgesAligned(geometry);
    default: return this.generateVertices(geometry);
  }
}

ShapePlacementGenerator.prototype.limitNumInstances = function(instances) {
  //remove very small chance
  instances = instances.filter(function(instance) {
    return instance.scale.x > 0.02 && instance.scale.y > 0.02 && instance.scale.y > 0.02;
  });

  //remove shapes above maxNumInstances limit
  var dropoutChance = this.maxNumInstances / instances.length;
  instances = instances.filter(function(instance) {
    return Math.random() < dropoutChance;
  });
  return instances;
}

ShapePlacementGenerator.prototype.generateVertices = function(geometry) {
  var instances = geometry.vertices.map(function(v, vi) {
    var s = 0.2;
    s *= this.scale;
    return {
      position: v,
      rotation: Quat.fromDirection(geometry.normals[vi]),
      scale: new Vec3(s, s, s),
    };
  }.bind(this));
  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.generateRandomAligned = function(geometry) {
  var instances = geometry.vertices
    .map(function(v, vi) {
      var s = geom.randomFloat(0.2, 0.5);
      s *= this.scale;
      return {
        position: v,
        rotation: Quat.fromDirection(geometry.normals[vi]),
        scale: new Vec3(s, s, s)
      }
    }.bind(this));

  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.generateHeavyTopAligned = function(geometry) {
  var bbox = BoundingBox.fromPoints(geometry.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  var instances = geometry.vertices
    .map(function(v, vi) {
      var s = v.y < center.y ? 0 : (v.y - center.y)/size.y;
      s *= this.scale;
      return {
        position: v,
        rotation: Quat.fromDirection(geometry.normals[vi]),
        scale: new Vec3(s, s, s)
      }
    }.bind(this))
    .filter(function() {
      return Math.random() > 0.5
    });

  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.generateHeavyBottomAligned = function(geometry) {
  var bbox = BoundingBox.fromPoints(geometry.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  var instances = geometry.vertices
    .map(function(v, vi) {
      var s = v.y > center.y ? 0 : (v.y - center.y)/-size.y;
      s *= this.scale;
      return {
        position: v,
        rotation: Quat.fromDirection(geometry.normals[vi]),
        scale: new Vec3(s, s, s)
      }
    }.bind(this))
    .filter(function() {
      return Math.random() > 0.5
    });

  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.generateFacesAligned = function(geometry) {
  var bbox = BoundingBox.fromPoints(geometry.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  var points = geometry.generateSurfacePoints(this.maxNumInstances);

  function findClosestVertexIndex(p) {
    var bestVertex = geometry.vertices.reduce(function(bestVertex, vertex, vertexIndex) {
        var dist = p.squareDistance(vertex);
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

    return bestVertex.index;
  }

  var instances = points
    .map(function(p) {
      var s = geom.randomFloat(0.2, 0.5);
      s *= this.scale;
      var vi = findClosestVertexIndex(p);
      return {
        position: p,
        rotation: Quat.fromDirection(geometry.normals[vi]),
        scale: new Vec3(s, s, s)
      }
    }.bind(this))

  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.generateSymmetricalAligned = function(geometry) {
  var simplex = this.simplex;
  var w = Math.random() * 5;
  var noiseScale = geom.randomFloat(0.5, 0.8);
  var instances = geometry.vertices.map(function(v, vi) {
    var s = 0.5;
    s *= this.scale;
    s *= 2 * Math.abs(simplex.noise4D(Math.abs(v.x) * noiseScale, v.y * noiseScale, v.z * noiseScale, w));
    return {
      position: v,
      rotation: Quat.fromDirection(geometry.normals[vi]),
      scale: new Vec3(s, s, s),
    };
  }.bind(this));
  instances.sort(function(a, b) {
    if (a.position.y > b.position.y) return 1;
    else if (a.position.y < b.position.y) return -1;
    else {
      var ax = Math.abs(a.x);
      var bx = Math.abs(b.x);
      return ax - bx;
    }
  })
  instances = instances.filter(function(a) {
    return a.scale.x > 0.1;
  });
  var maxNumInstances = this.maxNumInstances;
  var overflow = instances.length - maxNumInstances;
  var newInstances = [];
  var a = new Vec3();
  var b = new Vec3();
  for(var i=0; i<overflow; i++) {
    var randomStart = Math.floor(Math.random() * (instances.length - 1));
    a.copy(instances[randomStart].position);
    b.copy(instances[randomStart+1].position);
    a.x = Math.abs(a.x);
    b.x = Math.abs(b.x);
    if (a.squareDistance(b) == 0) {
      instances.splice(randomStart, 2);
    }
  }

  return instances;



  ////how many vertices too much?
  //console.log('overflow', overflow);
  //if (overflow < 0) return instances;
  //else {
  //  var randomStart = Math.floor(Math.random() * overflow);
  //  console.log('overflow', overflow, randomStart);
  //  return instances.slice(randomStart, randomStart + maxNumInstances);
  //}
}

ShapePlacementGenerator.prototype.generateAsymmetricalAligned = function(geometry) {
  var bbox = BoundingBox.fromPoints(geometry.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  var points = geometry.generateSurfacePoints(3 * this.maxNumInstances);

  var randomNormal = geom.randomVec3().normalize();
  randomNormal.y = Math.abs(randomNormal.y); //no vectors facing down

  function findClosestVertexIndex(p) {
    var bestVertex = geometry.vertices.reduce(function(bestVertex, vertex, vertexIndex) {
        var dist = p.squareDistance(vertex);
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

    return bestVertex.index;
  }

  var instances = points
    .map(function(p) {
      var s = geom.randomFloat(0.5, 0.5);
      s *= this.scale;
      var vi = findClosestVertexIndex(p);
      var alignment = randomNormal.dot(geometry.normals[vi]);
      s *= alignment;
      return {
        position: p,
        rotation: Quat.fromDirection(geometry.normals[vi]),
        scale: new Vec3(s, 2*s, s)
      }
    }.bind(this))
    .filter(function(instance) {
      return instance.scale.x > 0.2;
    })

  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.generateNoiseAligned = function(geometry) {
  var bbox = BoundingBox.fromPoints(geometry.vertices);
  var center = bbox.getCenter();
  var size = bbox.getSize();
  var points = geometry.generateSurfacePoints(2 * this.maxNumInstances);

  function findClosestVertexIndex(p) {
    var bestVertex = geometry.vertices.reduce(function(bestVertex, vertex, vertexIndex) {
        var dist = p.squareDistance(vertex);
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

    return bestVertex.index;
  }

  var simplex = this.simplex;
  var w = Math.random() * 10;

  var noiseScale = geom.randomFloat(0.5, 0.99);

  var instances = points
    .map(function(p) {
      var s = 0.7;
      s *= this.scale;
      var vi = findClosestVertexIndex(p);
      var f = simplex.noise4D(Math.abs(p.x*noiseScale), p.y*noiseScale, p.z*noiseScale, w);
      s *= f;
      return {
        position: p,
        rotation: Quat.fromDirection(geometry.normals[vi]),
        scale: new Vec3(s, s, s)
      }
    }.bind(this))
    .filter(function(instance) {
      return instance.scale.x > 0.1;
    })

  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.generateEdgesAligned = function(geometry) {
  var facesPerVertex = geometry.vertices.map(function() { return 0; });
  var neighbourOfEdge = geometry.vertices.map(function() { return false; });
  geometry.faces.forEach(function(face) {
    for(var i=0; i<face.length; i++) {
      facesPerVertex[face[i]]++;
    }
  })

  geometry.faces.forEach(function(face) {
    var hasEdge = false;
    for(var i=0; i<face.length; i++) {
      if (facesPerVertex[face[i]] <= 3) hasEdge = true;
    }
    for(var i=0; i<face.length; i++) {
      neighbourOfEdge[face[i]] = neighbourOfEdge[face[i]] || hasEdge;
    }
  })

  var scale = 0.1 + Math.random() * 0.4;
  scale *= this.scale;

  var instances = geometry.vertices.map(function(v, vi) {
    var s = scale;
    //if (facesPerVertex[vi] > 3) s = 0;
    if (!neighbourOfEdge[vi]) s = 0;
    return {
      position: v,
      rotation: Quat.fromDirection(geometry.normals[vi]),
      scale: new Vec3(s, s, s),
    };
  }.bind(this));
  return this.limitNumInstances(instances);
}

ShapePlacementGenerator.prototype.setMethod = function(method) {
  this.method = method;
}

ShapePlacementGenerator.prototype.setScale = function(scale) {
  this.scale = scale;
}

ShapePlacementGenerator.prototype.setMaxNumInstances = function(maxNumInstances) {
  this.maxNumInstances = maxNumInstances;
}

ShapePlacementGenerator.prototype.setRandomSeed = function(seed) {
  this.seed = seed;
}

module.exports = ShapePlacementGenerator;