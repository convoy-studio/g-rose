var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var geom = require('pex-geom');
var fx = require('pex-fx');
var gui = require('pex-gui');
var pbr = require('./pbr');
var ColorUtils = require('./utils/ColorUtils');
var Model = require('./rose/Model');
var Look = require('./rose/Look');
var UberMaterial = require('./materials/UberMaterial');
var LookSet = require('./rose/LookSet');
var LookBuilder = require('./rose/LookBuilder');
var ObjReader = require('./utils/ObjReader');
var SkinnedBoundingBox = require('./utils/SkinnedBoundingBox');

var Box                 = gen.Box;
var Cube                = gen.Cube;
var Sphere              = gen.Sphere;
var Dodecahedron        = gen.Dodecahedron;
var Tetrahedron         = gen.Tetrahedron;
var LineBuilder         = gen.LineBuilder;
var Mesh                = glu.Mesh;
var PerspectiveCamera   = glu.PerspectiveCamera;
var Arcball             = glu.Arcball;
var Texture2D           = glu.Texture2D;
var TextureCube         = glu.TextureCube;
var ShowNormals         = materials.ShowNormals;
var SolidColor          = materials.SolidColor;
var ShowColors          = materials.ShowColors;
var TexturedCubeMap     = materials.TexturedCubeMap;
var ShowDepth           = materials.ShowDepth;
var Color               = color.Color;
var Platform            = sys.Platform;
var Time                = sys.Time;
var Vec3                = geom.Vec3;
var Quat                = geom.Quat;
var BoundingBox         = geom.BoundingBox;
var GUI                 = gui.GUI;

var Renderer            = pbr.Renderer;
var Scene               = pbr.Scene;
var PointLight          = pbr.PointLight;
var GlobalLight         = pbr.GlobalLight;
var MatCapAlpha         = pbr.materials.MatCapAlpha;

var ASSETS_URL = '';
var isLocalhost = typeof(document) == 'undefined' ? false : document.location.href.indexOf('localhost') != -1;
var isLocalhostServer = typeof(document) == 'undefined' ? false : document.location.href.indexOf('3003') != -1;
if (Platform.isPlask) { ASSETS_URL = __dirname + '/../server/public/assets'; }
if (Platform.isBrowser && isLocalhost) { ASSETS_URL = '../server/public/assets'; }
if (Platform.isBrowser && isLocalhostServer) { ASSETS_URL = '/public/assets'; }
if (Platform.isBrowser && !isLocalhost) { ASSETS_URL = '/assets/'; }

function gridPos(i, n, dx, dz) {
  var d = Math.floor(Math.sqrt(n));
  var x = i % d;
  var z = Math.floor(i / d);
  return new Vec3(-dx/2 + dx * x / (d - 1), 0, -dz/2 + dz * z / (d - 1));
}

var MatCapNames = [ 'plastic_red.jpg', 'matcap.jpg', 'Blue Mirror.png', 'BluryBlack.png', 'Candy.png', 'Chrome.png', 'Coal.png', 'Cyan_Glow.png', 'Cyan_Glow2.png', 'Fabric_Gray.png', 'Fabric_Green.png', 'GlossyBlue.png', 'GlossyGray.png', 'GlossyPurple.png', 'Granite2.png', 'Ice.png', 'IronCast.png', 'Lead.png', 'MatGold.png', 'MattBeige.png', 'Metal-Tungsten-Lighter.png', 'Metal-Tungsten.png', 'Pink.png', 'Rubber.png', 'SSS_Purple.png', 'Sandstone.png', 'Sandstone1.png', 'SilverAntique.png', 'Skin1.png', 'Soft.png', 'Steel-Brushed-Lighter.png', 'Steel-Brushed.png', 'Steel-Brushed2.png', 'Toxic.png' ];
var PatternNames = [ 'argyle.png', 'argyle2.png', 'black-dots.png', 'black_leather.jpg', 'blank.png', 'canvas.png', 'carbon.png', 'checker.png', 'chevron.png', 'chevron2.png', 'chevron3.png', 'damask-invert.png', 'damask.png', 'denim.png', 'diagonal_stripes.png', 'diagonal_stripes_small.png', 'dots.png', 'dots2.png', 'dots3.png', 'fence.jpg', 'grass.png', 'grey-dots.jpg', 'honeycomb.png', 'honeycomb2.png', 'horizontal_stripes.jpg', 'horizontal_stripes2.png', 'horizontal_stripes_wide.png', 'horizontal_stripes_wide2.png', 'houndstooth.png', 'leopard.png', 'linen.png', 'pattern_4.jpg', 'plaid.png', 'plaid1.png', 'plaid2.png', 'plaid3.png', 'stripe-large-horizontal.png', 'stripe-large.png', 'triangles.png', 'triangles2.png', 'vertical_stripes2.png', 'vertical_stripes_wide2.png', 'wood.jpg', 'zebra.png' ];
var ShapeNames = [ 'Cube_01', 'Cup_01', 'Cylinder_01', 'Disc_01', 'Dome_01', 'Dots_02', 'Icosa_01', 'Oct_01', 'Plane_01', 'Polygon_01', 'Torus_02', 'Tubes_02', 'leaf', 'fur' ];
var LookNames = ['look0.png', 'look1.png', 'look2.png', 'look3.png', 'look4.png', 'look5.png', 'look6.png', 'look7.png', 'look8.png', 'look9.png'];

sys.Window.create({
  settings: {
    width: 1600,
    height: 900,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: Platform.isBrowser ? 1 : 1,
  },
  options: {
    modelPositionLimit: 10 + 50,
    modelPositionY: 8.6,
    modelWalkCycleDistance: 15,
    modelWalkCycleSpeed: 0.8,
    numMeshes: 36,
    matrixRadius: 20,
    ambientLightIntensity: 2.5,
    numLights: 1,
    lightRadius: 20,
    lightHeight: 10,
    lightXZ: 1,
    lightBrightness: 300,
    lightColor: new Color(1,1,1,1),
    meshColor: Color.fromHSL(0, 0.8, 0.5),
    debug: false,
    enableAnimation: false,
    enableWalking: false,
    lookIndex: 0,
    garmentMatCap: -1,
    garmentPattern: -1,
    garmentPatternScale: 0.5,
    garmentColor1: new Color(1,1,1,1),
    garmentColor2: new Color(1,1,1,1),
    shapesMatCap: -1,
    shapesPattern: -1,
    shapesPatternScale: 0.5,
    shapesColor: new Color(1,1,1,1),
    username: 'vorg',
    ambientColor: Color.fromHSL(267.0/360.0, 0.6, 0.7, 0.7),
    ambientColorSat: 0.6,
    sideTrackColor: Color.fromHSL(130.0/360.0, 0.3, 0.7, 0.7),
    sideTrackColorSat: 0.3,
    floorColor: Color.fromHSL(267.0/360.0, 0.5, 0.46, 0.7),
    floorColorSat: 0.5,
    trackColor: Color.fromHSL(267.0/360.0, 0.6, 0.7, 0.7),
    trackColorSat: 0.6,
    trackBottomColor: Color.fromHSL(267.0/360.0, 0.5, 0.16, 0.7),
    trackBottomColorSat: 0.5
  },
  cameraPositionIndex: 0,
  cameraPositions: [
    //free
    {
      position: new Vec3(18.4045415, 13.724, 21.9392),
      target: new Vec3(-0.14, 7.47, 1.5198753),
      up: new Vec3(0, 1, 0)
    },
    {
      position: new Vec3(0, 10, 50),
      target: new Vec3(0, 10, -50),
      up: new Vec3(0, 1, 0)
    },
    {
      position: new Vec3(-50, 10, 0),
      target: new Vec3(5, 10, 0),
      up: new Vec3(0, 1, 0)
    },
    {
      position: new Vec3(-50, 30, 0),
      target: new Vec3(5, 5, 0),
      up: new Vec3(0, 1, 0)
    },
    {
      position: new Vec3(0, 70, 0),
      target: new Vec3(0, 5, 0),
      up: new Vec3(0, 0, -1)
    },
    {
      position: new Vec3(0, 50, 50),
      target: new Vec3(0, 5, 0),
      up: new Vec3(0, 0, -1)
    },
  ],
  init: function() {
    this.gui = new GUI(this);

    if (Platform.isBrowser) {
      var userMatch = document.location.href.match(/runway\/([^\/]+)/);
      if (userMatch && userMatch.length == 2) {
        this.options.username = userMatch[1];
      }
    }

    geom.randomSeed(0);

    var rendereScale = 2;

    this.renderer = new Renderer(1024 * rendereScale, 512 * rendereScale);
    this.initScene();
    this.initSceneMeshes();
    this.initLights();
    this.initGUI();

    this.lookBuilder = new LookBuilder(ASSETS_URL);
    LookSet.load(ASSETS_URL + '/../../data/' + this.options.username + '_looks.json').then(function(lookSet) {
      this.lookSet = lookSet;
      this.buildLook();
    }.bind(this)).fail(function(e) { console.log(e, e.stack )});

    var shapesToLoad = [];
    this.options.shapeList = [];

    ShapeNames.forEach(function(shape, shapeIndex) {
      this.options.shapeList[shapeIndex] = new Mesh(new Cube()); //temporary
      var shapeRotation = Quat.fromAxisAngle(new Vec3(1, 0, 0), 90);
      if (shape == 'Plane_01') {
        shapeRotation = Quat.fromAxisAngle(new Vec3(1, 0, 0), 60);
      }
      ObjReader.load(ASSETS_URL + '/shapes/jody/' + shape + '.obj', function(g) {
        var bbox = BoundingBox.fromPoints(g.vertices);
        var scale = 1;
        if (bbox.getSize().x > 10) scale = 0.01;
        g.vertices.forEach(function(v) {
          v.scale(scale);
          v.transformQuat(shapeRotation);
        })
        this.options.shapeList[shapeIndex] = new Mesh(g);
      }.bind(this));
    }.bind(this));

    if (Platform.isBrowser && !isLocalhost) {
      this.gui.setEnabled(false);
      this.options.enableAnimation = true;
      this.options.enableWalking = true;
      this.arcball.setTarget(new Vec3(-0.14, 7.47, 1.5198753));
      this.arcball.setPosition(new Vec3(18.4045415, 13.724, 21.9392));
    }
    else {
      this.options.enableAnimation = true;
      this.options.enableWalking = false;
      this.gui.setEnabled(false);
    }

    this.boundingBoxMesh = new Mesh(new LineBuilder(), new ShowColors(), { lines: true });
    this.scene.add(this.boundingBoxMesh);
  },
  initScene: function() {
    this.scene = new Scene();
    this.scene.backgroundColor = ColorUtils.hexToColor('#581E9D');
    this.camera = new PerspectiveCamera(60, this.renderer.width/this.renderer.height, 10, 500);
    this.arcball = new Arcball(this, this.camera, 8);
    this.arcball.setTarget(new Vec3(-10, 5, 0));
    this.arcball.setPosition(new Vec3(20, 20, 10));
    this.scene.add(this.camera);

    this.look = new Look();
  },
  buildLook: function() {
    if (this.look) {
      this.scene.remove(this.look.getBody());
      this.look.getGarments().forEach(function(garment) {
        this.scene.remove(garment);
      }.bind(this));
      this.scene.remove(this.look.getBakedShapes());
      geom.randomSeed(Date.now());
    }

    geom.randomSeed(Date.now())
    this.lookBuilder.build(this.lookSet.looks[this.options.lookIndex])
    .then(function(look) {
      this.look.dispose({ meshes: true, materials: true });
      this.look = look;
      this.look.position.z = -2*this.options.modelPositionLimit;
      this.scene.add(this.look.getBody());
      this.look.getBody().skinnedBoundingBox = new SkinnedBoundingBox(this.look.getBody());
      this.look.getGarments().forEach(function(garment) {
        this.scene.add(garment);
      }.bind(this));
      this.scene.add(this.look.getBakedShapes());
      console.log('Catwalk.buildLook look loaded')
    }.bind(this))
    .fail(function(e) {
      console.log('ERROR', e, e.stack);
    })
  },
  initLook: function() {
    this.initMaterials();
    this.initLookMeshes();
  },
  initSceneMeshes: function() {
    var numMeshes = this.options.numMeshes;

    var side1 = new Mesh(new Cube(4, 6, 500, 4, 1, 50), new SolidColor({ color: this.options.sideTrackColor }));
    side1.position.x = -28;
    this.scene.add(side1);

    var side2 = new Mesh(new Cube(4, 6, 500, 4, 1, 50), new SolidColor({ color: this.options.sideTrackColor }));
    side2.position.x = -40;
    this.scene.add(side2);

    var side3 = new Mesh(new Cube(4, 6, 500, 4, 1, 50), new SolidColor({ color: this.options.sideTrackColor }));
    side3.position.x = -52;
    this.scene.add(side3);

    var catwalkMesh = new Mesh(new Cube(16, 1, 500, 4, 1, 50), new SolidColor({ color: this.options.trackBottomColor }));
    this.scene.add(catwalkMesh);

    var catwalkMeshGlass = new Mesh(new Cube(16, 0.1, 500, 8, 1, 100), new SolidColor({ color: this.options.trackColor }));
    catwalkMeshGlass.position.y = 0.5;
    this.scene.add(catwalkMeshGlass);

    var catwalkMesh2 = new Mesh(new Cube(32, 1, 500, 4, 1, 50), new SolidColor({ color: this.options.trackBottomColor }));
    catwalkMesh2.position.x -= 16/2 + 32/2 + 16;
    this.scene.add(catwalkMesh2);

    var catwalkMesh2Glass = new Mesh(new Cube(32, 0.1, 500, 4, 1, 50), new SolidColor({ color: this.options.trackColor }));
    catwalkMesh2Glass.position.x -= 16/2 + 32/2 + 16;
    catwalkMesh2Glass.position.y = -0.05;
    this.scene.add(catwalkMesh2Glass);

    var catwalkMesh3 = new Mesh(new Cube(32, 1, 500, 4, 1, 50), new SolidColor({ color: this.options.trackColor }));
    catwalkMesh3.position.x +=  16/2 + 32/2 + 16;
    this.scene.add(catwalkMesh3);

    var floor = new Mesh(new Cube(500, 1, 500, 50, 1, 50), new SolidColor({ color: this.options.floorColor }));
    floor.position.y = -1.5;
    this.scene.add(floor);

    var outside = new Cube(500, 500, 500);
    this.scene.add(new Mesh(outside, new SolidColor({ color:  new Color(1,1,1,0.1)})));
  },
  initLookMeshes: function() {
    if (Time.frameNumber == 0) {
      geom.randomSeed(0);
    }
    else {
      this.scene.remove(this.look.getBody());
      var garments = this.look.getGarments();
      garments.forEach(function(garment) {
        this.scene.remove(garment);
      }.bind(this));
      this.scene.remove(this.look.getBakedShapes());
      geom.randomSeed(Date.now());
    }

    var shapePlacements = ["vertices", "random", "randomAligned", "heavyTop", "heavyTopAligned", "heavyBottom", "heavyBottomAligned"];

    var meshes = [
      {
        body : ASSETS_URL + '/female/female_model_new.js',
        bottom : ASSETS_URL + '/female/femalePants.js',
        garments : [
          ASSETS_URL + '/female/femaleDress.js',
          ASSETS_URL + '/female/femaleCoat.js',
          ASSETS_URL + '/female/femaleShirt.js',
        ]
      },
      {
        body : ASSETS_URL + '/male/male_model_new.js',
        bottom : ASSETS_URL + '/male/malePants.js',
        garments : [
          ASSETS_URL + '/male/maleCoat.js',
          ASSETS_URL + '/male/maleShirt.js',
          ASSETS_URL + '/male/maleSleeveless.js'
        ]
      }
    ];

    var shapes = [
      new Cube(2),
      new Sphere(2, 8, 8),
      new Tetrahedron(2),
      new Dodecahedron(2)
    ];

    var randomMesh = geom.randomElement(meshes);
    var randomBody = randomMesh.body;
    var randomBottom = randomMesh.bottom;
    var randomTop = geom.randomElement(randomMesh.garments);
    var skipBottom = (randomMesh == meshes[0] && randomTop == randomMesh.garments[0]);
    var randomShapePlacement = geom.randomElement(shapePlacements);
    var randomShapeScale = geom.randomFloat(0.1, 1.0);

    Model.load(randomBody).then(function(bodyModel) {
      this.look.setBody(bodyModel);
      this.scene.add(bodyModel);
      bodyModel.skinnedBoundingBox = new SkinnedBoundingBox(bodyModel);

      Model.load(randomBottom).then(function(bottomModel) {
        Model.load(randomTop).then(function(topModel) {
          if (skipBottom) {
            this.look.setGarments([topModel]);
            this.scene.add(topModel);
          }
          else {
            this.look.setGarments([bottomModel, topModel]);
            this.scene.add(topModel);
            this.scene.add(bottomModel);
          }

          this.look.setShape(new Mesh(geom.randomElement(shapes).triangulate()));
          this.look.setShapePlacement(randomShapePlacement);
          this.look.setShapeScale(randomShapeScale);
          this.scene.add(this.look.getBakedShapes());
        }.bind(this));
      }.bind(this));
    }.bind(this)).fail(function(e) { console.log(e.stack); });
  },
  initMaterials: function() {
    var forceShowNormals = false;

    if (Time.frameNumber == 0) {
      geom.randomSeed(0);
    }
    else {
      if (this.bodyMaterial) {
        this.bodyMaterial.program.dispose();
      }
      if (this.garmentMaterials) {
        this.garmentMaterials[0].program.dispose();
        this.garmentMaterials[1].program.dispose();
      }
      if (this.shapesMaterial) {
        this.shapesMaterial.program.dispose();
      }
      geom.randomSeed(Date.now());
    }

    var matCaps = [
      ASSETS_URL + '/textures/matcaps_extact/Blue Mirror.png',
      ASSETS_URL + '/textures/matcaps_extact/BluryBlack.png',
      ASSETS_URL + '/textures/matcaps_extact/Candy.png',
      ASSETS_URL + '/textures/matcaps_extact/GlossyBlue.png',
      ASSETS_URL + '/textures/matcaps_extact/GlossyGray.png',
      ASSETS_URL + '/textures/matcaps_extact/MatGold.png',
      ASSETS_URL + '/textures/matcaps_extact/Pink.png',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ];

    var patterns = [
      ASSETS_URL + '/textures/argyle.png',
      ASSETS_URL + '/textures/checker.png',
      ASSETS_URL + '/textures/chevron.png',
      ASSETS_URL + '/textures/leopard.png',
      ASSETS_URL + '/textures/diagonal_stripes.png',
      ASSETS_URL + '/textures/dots.png',
      ASSETS_URL + '/textures/honeycomb.png',
      ASSETS_URL + '/textures/houndstooth.png',
      ASSETS_URL + '/textures/pattern_4.jpg',
      ASSETS_URL + '/textures/triangles.png',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ];

    var randomMatCap1 = geom.randomElement(matCaps);
    var randomMatCap2 = geom.randomElement(matCaps);
    var randomPattern1 = geom.randomElement(patterns);
    var randomPattern2 = geom.randomElement(patterns);

    if (Time.frameNumber == 0) {
      randomPattern1 = patterns[0];
    }

    this.bodyMaterial = new UberMaterial({
      skinned: true,
      correctGamma: true,
      showNormals: forceShowNormals,
      color: Color.fromHSL(geom.randomFloat(), 0.8, 0.5, 0.5),
      roughness: 1,
      matCapTexture: Texture2D.load(ASSETS_URL + '/textures/matcaps_extact/Ice.png')
    });
    this.garmentMaterials = [
      new UberMaterial({
        skinned: true,
        correctGamma: true,
        showNormals: forceShowNormals,
        color: Color.fromHSL(geom.randomFloat(), 0.5, 0.5),
        roughness: geom.randomFloat(0.1, 1.0),
        matCapTexture: randomMatCap1 ? Texture2D.load(randomMatCap1) : null,
        triPlanarTexture: randomPattern1 ? Texture2D.load(randomPattern1) : null,
        triPlanarScale: 1
      }),
      new UberMaterial({
        skinned: true,
        correctGamma: true,
        showNormals: forceShowNormals,
        color: Color.fromHSL(geom.randomFloat(), 0.5, 0.5),
        roughness: geom.randomFloat(0.1, 1.0),
        matCapTexture: randomMatCap2 ? Texture2D.load(randomMatCap2) : null,
        triPlanarTexture: randomPattern2 ? Texture2D.load(randomPattern2) : null,
        triPlanarScale: 1
      })
    ];
    this.shapesMaterial = new UberMaterial({
      skinned: true,
      correctGamma: true,
      showNormals: forceShowNormals,
      roughness: geom.randomFloat(0.1, 1.0),
      color: Color.fromHSL(geom.randomFloat(), 0.5, 0.5),
    })
  },
  initLights: function() {
    var reflectionMap = Texture2D.load(ASSETS_URL + '/textures/envmaps/studio008.jpg');
    var diffuseMap = Texture2D.load(ASSETS_URL + '/textures/envmaps/studio008smallBlur.jpg');

    this.scene.add(new GlobalLight(0.2, reflectionMap, diffuseMap, this.backgroundColor, new Color(1,1,1,1) ));
    //var numMeshes = this.options.numMeshes;
    //for(var i=0; i<numMeshes; i++) {
    //  var pos = gridPos(i, numMeshes, this.options.matrixRadius, this.options.matrixRadius);
    //  pos.y = 1;
    //  var color = new Color(2, 0, 0.3, 1.0);
    //  //color = Color.fromHSL(geom.randomFloat(0, 0.2), 0.9, 0.5);
    //  this.scene.add(new PointLight(pos, color, this.options.lightRadius, this.options.lightBrightness));
    //}
    //this.scene.add(new PointLight(new Vec3(5, 20, 0), Color.Green, this.options.lightRadius, this.options.lightBrightness));
  },
  initGUI: function() {
    this.gui.addHeader('Lights').setPosition(10 * this.settings.highdpi, 10 * this.settings.highdpi);
    this.gui.addParam('Enable', this.renderer, 'enableLights');
    this.gui.addParam('Num lights', this.options, 'numLights', { min: 0, max: 1 });
    this.gui.addParam('Light radius', this.options, 'lightRadius', { min: 1, max: 100 });
    this.gui.addParam('Light brightness', this.options, 'lightBrightness', { min: 0, max: 1024 });
    this.gui.addParam('Light Y', this.options, 'lightHeight', { min: -10, max: 30 });
    this.gui.addParam('Light XZ', this.options, 'lightXZ', { min: 0.01, max: 2 });
    this.gui.addParam('Light Color', this.options, 'lightColor');
    this.gui.addParam('Ambient light', this.options, 'ambientLightIntensity', { min: 0, max: 5 });
    this.gui.addParam('Ambient light color', this.options, 'ambientColor');

    this.gui.addHeader('Shadows');
    this.gui.addParam('Enable', this.renderer, 'enableShadows');

    this.gui.addHeader('Fog');
    this.gui.addParam('Enable', this.renderer, 'enableFog');
    this.gui.addParam('Fog density', this.renderer, 'fogDensity', { min: 0, max: 10 });
    this.gui.addParam('Fog start', this.renderer, 'fogStart', { min: 0, max: 1 });
    this.gui.addParam('Fog end', this.renderer, 'fogEnd', { min: 0, max: 1 });
    this.gui.addParam('Fog Color', this.scene, 'backgroundColor');

    this.gui.addHeader('Tonemapping').setPosition(180 * this.settings.highdpi, 10 * this.settings.highdpi);
    this.gui.addParam('Enable', this.renderer, 'enableToneMapping');
    this.gui.addParam('Exposure', this.renderer, 'exposure', { min: 0.5, max: 3 });

    this.gui.addHeader('Gamma');
    this.gui.addParam('Enable', this.renderer, 'enableGamma');

    this.gui.addHeader('Contrast');
    this.gui.addParam('Enable', this.renderer, 'enableContrast');
    this.gui.addParam('Contrast', this.renderer, 'contrast', { min: 0.5, max: 3 });

    this.gui.addHeader('Antialiasing');
    this.gui.addParam('Enable', this.renderer, 'enableFXAA');

    this.gui.addHeader('Animation');
    this.gui.addParam('Enable', this.options, 'enableAnimation');
    this.gui.addParam('Walking', this.options, 'enableWalking');

    this.gui.addHeader('Look');
    this.gui.addButton('Generate', this, 'initLook' );
    this.gui.addHeader('Debug')
    this.gui.addParam('Enable', this.options, 'debug');

    this.options.lookList = LookNames.map(function(name, i) {
      return {
        name: name,
        texture: Texture2D.load(ASSETS_URL + '/../../data/' + this.options.username + '/' + name),
        value: i
      };
    }.bind(this));

    this.gui.addTextureList('Looks', this.options, 'lookIndex', this.options.lookList, 2, this.buildLook.bind(this));

    this.options.matCapList = MatCapNames.map(function(name, i) {
      return {
        name: name,
        texture: Texture2D.load(ASSETS_URL + '/textures/matcaps_extact/' + name),
        value: i
      };
    })
    this.options.patternList = PatternNames.map(function(name, i) {
      return {
        name: name,
        texture: Texture2D.load(ASSETS_URL + '/textures/' + name),
        value: i
      };
    })
    this.options.shapeMatCapList = MatCapNames.map(function(name, i) {
      return {
        name: name,
        texture: Texture2D.load(ASSETS_URL + '/textures/matcaps_extact/' + name),
        value: i
      };
    })
    this.options.shapePatternList = PatternNames.map(function(name, i) {
      return {
        name: name,
        texture: Texture2D.load(ASSETS_URL + '/textures/' + name),
        value: i
      };
    })
    this.options.shapeGeometryImageList = ShapeNames.map(function(name, i) {
      return {
        name: name,
        texture: Texture2D.load(ASSETS_URL + '/shapes/jody/images/' + name + '.png'),
        value: i
      };
    })

    this.options.matCapList.unshift({ name: 'empty', texture: Texture2D.load(ASSETS_URL + '/textures/empty.png'), value: -1 });
    this.options.patternList.unshift({ name: 'empty', texture: Texture2D.load(ASSETS_URL + '/textures/empty.png'), value: -1 });
    this.options.shapeMatCapList.unshift({ name: 'empty', texture: Texture2D.load(ASSETS_URL + '/textures/empty.png'), value: -1 });
    this.options.shapePatternList.unshift({ name: 'empty', texture: Texture2D.load(ASSETS_URL + '/textures/empty.png'), value: -1 });

    this.gui.addHeader('Garment').setPosition(350 * this.settings.highdpi, 10 * this.settings.highdpi);
    this.gui.addTextureList('Garment matcap', this.options, 'garmentMatCap', this.options.matCapList, 6, this.updateMaterials.bind(this));
    this.gui.addTextureList('Garment pattern', this.options, 'garmentPattern', this.options.patternList, 6, this.updateMaterials.bind(this));
    this.gui.addParam('Garment p scale', this.options, 'garmentPatternScale', { min: 0.05, max: 1 }, this.updateMaterials.bind(this));
    this.gui.addParam('Garment color 1', this.options, 'garmentColor1', { palette : ASSETS_URL + '/textures/rainbow.jpg' }, this.updateMaterials.bind(this))
    this.gui.addParam('Garment color 2', this.options, 'garmentColor2', { palette : ASSETS_URL + '/textures/rainbow.jpg' }, this.updateMaterials.bind(this))
    this.gui.addHeader('Shapes').setPosition(520 * this.settings.highdpi, 10 * this.settings.highdpi);
    this.gui.addTextureList('Shapes matcap', this.options, 'shapesMatCap', this.options.shapeMatCapList, 6, this.updateMaterials.bind(this));
    this.gui.addTextureList('Shapes pattern', this.options, 'shapesPattern', this.options.shapePatternList, 6, this.updateMaterials.bind(this));
    this.gui.addParam('Shapes p scale', this.options, 'shapesPatternScale', { min: 0.05, max: 1 }, this.updateMaterials.bind(this));
    this.gui.addParam('Shapes color', this.options, 'shapesColor', { palette : ASSETS_URL + '/textures/rainbow.jpg' }, this.updateMaterials.bind(this));
    this.gui.addTextureList('Shapes geom', this.options, 'shapesGeometry', this.options.shapeGeometryImageList, 4, this.updateShape.bind(this));

    //this.gui.addParam('SSAO', this.renderer, 'ssao', { min: 0, max: 10 });
    //this.gui.addParam('Mesh Color', this.options, 'meshColor');


    this.on('keyDown', function(e) {
      if (e.str == 'g') { this.gui.enabled = !this.gui.enabled; }
      if (e.str == '1') { this.cameraPositionIndex = 0; }
      if (e.str == '2') { this.cameraPositionIndex = 1; }
      if (e.str == '3') { this.cameraPositionIndex = 2; }
      if (e.str == '4') { this.cameraPositionIndex = 3; }
      if (e.str == '5') { this.cameraPositionIndex = 4; }
      if (e.str == '6') { this.cameraPositionIndex = 5; }

    }.bind(this))
  },
  updateMeshMaterial: function(mesh, tintColor, matCap, pattern, patternScale) {
    if (mesh.material.uniforms.matCapTexture != matCap || mesh.material.uniforms.triPlanarTexture != pattern) {
      mesh.material.program.dispose();
      var material = new UberMaterial({
        skinned: true,
        correctGamma: true,
        roughness: 0.85,
        matCapTexture: matCap,
        triPlanarTexture: pattern
      });
      mesh.setMaterial(material);
    }
    mesh.material.uniforms.tintColor = tintColor;
    mesh.material.uniforms.triPlanarScale = patternScale;

  },
  updateMaterials: function() {
    var garmentMatCapTexture = (this.options.garmentMatCap == -1) ? null : this.options.matCapList[this.options.garmentMatCap + 1].texture;
    var garmentPatternTexture = (this.options.garmentPattern == -1) ? null : this.options.patternList[this.options.garmentPattern + 1].texture;
    var shapesMatCapTexture = (this.options.shapesMatCap == -1) ? null : this.options.matCapList[this.options.shapesMatCap + 1].texture;
    var shapesPatternTexture = (this.options.shapesPattern == -1) ? null : this.options.patternList[this.options.shapesPattern + 1].texture;

    if (this.look.getGarments()[0]) {
      this.updateMeshMaterial(this.look.getGarments()[0], this.options.garmentColor1, garmentMatCapTexture, garmentPatternTexture, this.options.garmentPatternScale)
    }
    if (this.look.getGarments()[1]) {
      this.updateMeshMaterial(this.look.getGarments()[1], this.options.garmentColor2, garmentMatCapTexture, garmentPatternTexture, this.options.garmentPatternScale)
    }
    if (this.look.getBakedShapes()) {
      this.updateMeshMaterial(this.look.getBakedShapes(), this.options.shapesColor, shapesMatCapTexture, shapesPatternTexture, this.options.shapesPatternScale)
    }
  },
  updateShape: function(shapeIndex) {
    var shapeMaterial = this.look.getBakedShapes().material;
    this.scene.remove(this.look.getBakedShapes());
    this.look.setShape(this.options.shapeList[shapeIndex]);
    this.look.setShapePlacement('randomAligned');
    //this.look.bakeShapes();
    console.log('generated instances', this.look.shapeInstances.length)
    console.log('baked vertices',this.look.getBakedShapes().geometry.vertices.length)
    this.look.getBakedShapes().setMaterial(shapeMaterial);
    this.scene.add(this.look.getBakedShapes());
  },
  updateLook: function() {
    if (this.options.enableWalking) {
      this.look.position.z += Time.delta * this.options.modelWalkCycleDistance * this.options.modelWalkCycleSpeed;
    }
    else {
      this.look.position.z = 0;
    }

    if (this.look.position.z > this.options.modelPositionLimit) {
      this.look.position.z = -2*this.options.modelPositionLimit;
      if (this.lookSet) {
        this.options.lookIndex = (this.options.lookIndex + 1) % this.lookSet.looks.length;
        this.buildLook();
      }
    }
    this.look.position.y = this.options.modelPositionY;

    this.look.setAnimationEnabled(true);
    this.look.update(this.options.enableAnimation ? 0 : 0.5);
  },
  updateLights: function() {
    this.renderer.lightCamera.position.z = this.look.position.z + 30;
    this.renderer.lightCamera.target.z = this.look.position.z - 5;
    this.renderer.lightCamera.updateMatrices();

    this.scene.getLights().forEach(function(light) {
      if (light instanceof PointLight) {
        var r = this.options.lightRadius;
        light.setRadius(r);
        light.position.y = this.options.lightHeight;
        light.setColor(this.options.lightColor);
        light.setBrightness(this.options.lightBrightness);
      }
      if (light instanceof GlobalLight) {
        light.color = this.options.ambientColor;
        light.setIntensity(this.options.ambientLightIntensity);
      }
    }.bind(this));
  },
  updateModelBoundingBox: function() {
    if (this.look && this.look.getBody()) {
      var body = this.look.getBody();
      body.skinnedBoundingBox.update();
      this.options.modelPositionY = -body.skinnedBoundingBox.min.y + 0.6;
    };
  },
  updateCamera: function() {
    this.camera.setPosition(this.cameraPositions[this.cameraPositionIndex].position);
    this.camera.setTarget(this.cameraPositions[this.cameraPositionIndex].target);
    this.camera.setUp(this.cameraPositions[this.cameraPositionIndex].up);
  },
  update: function () {
    this.renderer.debug = this.options.debug;
    this.renderer.shadowMapBias = 0.001;

    this.updateCamera();
    this.updateLook();
    this.updateLights();
    this.updateModelBoundingBox();

    var backgroundColor = this.scene.backgroundColor.getHSL();

    var ambientColor = this.options.ambientColor.getHSL();
    this.options.ambientColor.setHSL(backgroundColor.h, this.options.ambientColorSat * backgroundColor.s, ambientColor.l, ambientColor.a);

    var sideTrackColor = this.options.sideTrackColor.getHSL();
    this.options.sideTrackColor.setHSL(backgroundColor.h, this.options.sideTrackColorSat * backgroundColor.s, sideTrackColor.l, sideTrackColor.a);

    var floorColor = this.options.floorColor.getHSL();
    this.options.floorColor.setHSL(backgroundColor.h, this.options.floorColorSat * backgroundColor.s, floorColor.l, floorColor.a);

    var trackColor = this.options.trackColor.getHSL();
    this.options.trackColor.setHSL(backgroundColor.h, this.options.trackColorSat * backgroundColor.s, trackColor.l, trackColor.a);

    var trackBottomColor = this.options.trackBottomColor.getHSL();
    this.options.trackBottomColor.setHSL(backgroundColor.h, this.options.trackBottomColorSat * backgroundColor.s, trackBottomColor.l, trackBottomColor.a);
  },
  draw: function() {
    Time.verbose = true;

    glu.clearColorAndDepth(Color.Black);

    //this.gl.enable(this.gl.CULL_FACE);

    this.update();
    this.renderer.draw(this.scene, this.width, this.height);

    glu.viewport(0, 0, this.width, this.height);

    if (this.gui.enabled) {
      this.gui.draw();
    }
  }
});
