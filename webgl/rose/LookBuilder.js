var Q             = require('q');
var sys           = require('pex-sys');
var color         = require('pex-color');
var glu           = require('pex-glu');
var gen           = require('pex-gen');
var materials     = require('pex-materials');

var Color             = color.Color;
var Texture2D         = glu.Texture2D;
var Mesh              = glu.Mesh;
var Cube              = gen.Cube;
var Sphere            = gen.Sphere;
var Look              = require('./Look');
var MeshExt           = require('../glu/Mesh.Ext');
var UberMaterial      = require('../materials/UberMaterial');
var UberMaterialInstace = require('../materials/UberMaterialInstance');
var ThreeMeshLoader   = require('../utils/ThreeMeshLoader');
var SolidColor        = materials.SolidColor;
var Assets            = require('../../server/public/js/assets.js');
var AssetsLoader      = require('./AssetsLoader');

function LookBuilder(assetsDir) {
  this.assetsDir = assetsDir;
}

LookBuilder.prototype.build = function(lookData) {
  var look = new Look();

  var deferred = Q.defer();
  var assetsDir = this.assetsDir;

  var bodyUrl = assetsDir + ((lookData.gender == 'female') ? '/female/female_model_new.js' : '/male/male_model_new.js');

  var bodyMaterial = new UberMaterial({
    skinned: true,
    correctGamma: true,
    color: Color.fromHSL(1, 0.5, 0.5, 0.5),
    fakeLighting: true,
    roughness: 0.9,
    //matCapTexture: Texture2D.load(assetsDir + '/textures/matcaps_extact/Ice.png')
    //colorBands: Texture2D.load(assetsDir + '/textures/matcaps_extact/Ice.png')
    //colorBands: Texture2D.load(assetsDir + '/textures/palettes/grey.png')
    showDepthGradient: true
  });

  var garmentMaterials = [];

  garmentMaterials.push(new UberMaterial({
    skinned: true,
    correctGamma: true,
    tintColor: lookData.colors[0],
    roughness: 0.99,
    matCapTexture: AssetsLoader.loadTexture(lookData.garmentMaterial.matcap),
    triPlanarTexture: AssetsLoader.loadTexture(lookData.garmentMaterial.pattern),
    triPlanarScale: (1/(lookData.garmentMaterial.patternScale + 4))
  }));

  garmentMaterials.push(new UberMaterial({
    skinned: true,
    correctGamma: true,
    tintColor: lookData.colors[1],
    roughness: 0.5,
    matCapTexture: AssetsLoader.loadTexture(lookData.garmentMaterial.matcap),
    triPlanarTexture: AssetsLoader.loadTexture(lookData.garmentMaterial.pattern),
    triPlanarScale: (1/(lookData.garmentMaterial.patternScale + 4))
  }));

  var shapeMaterial = new UberMaterial({
    skinned: true,
    correctGamma: true,
    tintColor: lookData.shapeColor,
    roughness: 0.5,
    matCapTexture: AssetsLoader.loadTexture(lookData.shapeMaterial.matcap),
    triPlanarTexture: AssetsLoader.loadTexture(lookData.shapeMaterial.pattern),
    triPlanarScale:  (1/(lookData.shapeMaterial.patternScale + 4))
  });

  try {
    lookData.shapeType = lookData.shapeType ? lookData.shapeType.toLowerCase() : 'sphere';
  }
  catch(e) {
    lookData.shapeType = 'sphere';
  }

  var dashPos = lookData.shapeType.indexOf('_');
  if (dashPos != -1) {
    lookData.shapeType = lookData.shapeType.slice(0, dashPos);
  }

  var shapeInfo = Assets.ShapesByName[lookData.shapeType];
  if (!shapeInfo) {
    console.log('Missing shape info', lookData.shapeType);
    shapeInfo = Assets.ShapesByName['cube'];
  }

  ThreeMeshLoader.load(bodyUrl).then(function(bodyModel) {
    //bodyModel.primitiveType = glu.Context.currentContext.LINES;
    AssetsLoader.loadShape(shapeInfo.file).then(function(shapeGeometry) {
      var shapeMesh = new Mesh(shapeGeometry, shapeMaterial);

      shapeMesh.geometry.computeNormals();
      look.setBody(bodyModel);
      bodyModel.setMaterial(bodyMaterial);

      var garmentModels = lookData.garments.map(function(garment) {
        return ThreeMeshLoader.load(assetsDir + '/' + lookData.gender + '/' + garment.name + '.js');
      }.bind(this));

      return Q.all(garmentModels).then(function(loadedGarmentModels) {
        loadedGarmentModels.forEach(function(garment, garmentIndex) {
          lookData.garments[garmentIndex].morphs.forEach(function(morphValue, morphIndex) {
            garment.morphs.influences[morphIndex + 1] = morphValue;
          })
          garment.update();
        });
        look.setGarments(loadedGarmentModels);
        loadedGarmentModels.forEach(function(garment, garmentIndex) {
          garment.setMaterial(garmentMaterials[garmentIndex]);
        });

        shapeMesh.skeleton = bodyModel.skeleton;

        look.setShape(shapeMesh);
        if (lookData.shapes && lookData.shapes.length > 0) {
          look.setShapeInstances(lookData.shapes);
          look.bakeShapes();
        }
        deferred.resolve(look);
      })
    });
  }).fail(function(e) {
    console.log('ERROR', e, e.stack);
    deferred.reject(e)
  })

  return deferred.promise;
}

module.exports = LookBuilder;