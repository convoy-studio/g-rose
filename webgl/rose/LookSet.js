var Look = require('./Look');
var Q = require('q');
var sys = require('pex-sys');
var geom = require('pex-geom');
var color = require('pex-color');
var IO = sys.IO;
var Vec3 = geom.Vec3;
var Quat = geom.Quat;
var Color = color.Color;

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToColor(hex) {
  var c = hexToRgb(hex);
  return new Color(c.r/255, c.g/255, c.b/255, 1.0);
}

function LookSet(jsonData) {
  this.looks = this.parseData(jsonData);
}

LookSet.prototype.parseData = function(data) {

  function parseShape(shapeData) {
    return {
      position: shapeData.position ? new Vec3().setVec3(shapeData.position) : new Vec3(0,0,0),
      rotation: shapeData.rotation ? new Quat().setQuat(shapeData.rotation) : new Quat(),
      scale: shapeData.scale ? new Vec3().setVec3(shapeData.scale) : new Vec3(1,1,1),
    };
  }

  function parseGarment(garmentData) {
    return {
      name: garmentData.name,
      morphs: garmentData.morphs
    };
  }

  function parseColor(colorData) {
    return Color.fromHSL(colorData[0], colorData[1], colorData[2]);
  }

  function parseLook(lookData, lookIndex) {
    return {
      gender: lookData.gender,
      shapeType: lookData.shapeType,
      colors: lookData.colors.map(parseColor),
      colorsHex: lookData.colorsHex.map(hexToColor),
      shapeType: lookData.shapeType,
      shapeColor: parseColor(lookData.shapeColor),
      garmentMaterial: {
        type: lookData.materialType,
        matcap: lookData.matcap,
        pattern: lookData.pattern,
        patternScale: lookData.patternScale
      },
      shapeMaterial: {
        type: lookData.materialType,
        matcap: lookData.shapeMatcap,
        pattern: lookData.shapePattern,
        patternScale: lookData.patternScale
      },
      shapes: lookData.shapes ? lookData.shapes.map(parseShape) : [],
      garments: lookData.garments.map(parseGarment)
    }
  }

  function validateLook(lookData) {
    return lookData.garments != null;
  }

  return data.filter(validateLook).map(parseLook);
}

LookSet.prototype.getGender = function() {
  return this.data.gender;
}

LookSet.prototype.getGarments = function() {
  return this.data.garments;
}

LookSet.load = function(url) {
  var deferred = Q.defer();

  IO.loadTextFile(url, function(json) {
    if (!json) {
      deferred.reject(new Error('Failed to load file ' + url));
    }
    else {
      deferred.resolve(new LookSet(JSON.parse(json)));
    }
  });

  return deferred.promise;
}

module.exports = LookSet;