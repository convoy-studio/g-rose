var Q = require('q');
var color = require('pex-color');
var ThreeMeshLoader = require('../utils/ThreeMeshLoader');

var Color = color.Color;

function Model(g, material, options) {
}

Model.load = function(url) {
  return ThreeMeshLoader.load(url);
}

module.exports = Model;