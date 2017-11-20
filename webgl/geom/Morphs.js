var geom = require('pex-geom');
var R    = require('ramda');
var fn   = require('../utils/fn');

var Vec3 = geom.Vec3;

function Morphs(morphTargets) {
  this.morphTargets = morphTargets;
  this.influences = morphTargets.map(function() { return 0 });
  this.influencesPrev = morphTargets.map(function() { return 0 });
  this.influences[0] = 1;
  this.influencesPrev[0] = 1;
}

Morphs.prototype.update = function(mesh) {
  if (!this.morphOriginalPositions) {
    this.morphOriginalPositions = mesh.geometry.vertices.map(function(v) { return v.dup(); });
  }

  var morphDirty = false;
  this.influences.forEach(function(influence, influenceIndex) {
    if (influence != this.influencesPrev[influenceIndex]) {
      morphDirty = true;
      this.influencesPrev[influenceIndex] = influence;
    }
  }.bind(this));

  if (!morphDirty) return;

  var morphVertex = new Vec3();
  for(var i=0; i<mesh.geometry.vertices.length; i++) {
    var numInfluences = 0;
    var v = mesh.geometry.vertices[i];
    v.scale(0);
    var position = this.morphOriginalPositions[i];
    for(var j=0; j<this.morphTargets.length; j++) {
      if (this.influences[j] == 0) continue;
      morphVertex.setVec3(this.morphTargets[j].vertices[i]);
      morphVertex.sub(position);
      morphVertex.scale(this.influences[j]);
      v.add(morphVertex);
    }
    v.add(position);
  }
  mesh.geometry.vertices.dirty = true;
}

module.exports = Morphs;