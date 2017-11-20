var sys       = require('pex-sys');
var glu       = require('pex-glu');
var materials = require('pex-materials');
var color     = require('pex-color');
var gen       = require('pex-gen');
var geom      = require('pex-geom');
var gui       = require('pex-gui');
var fx        = require('pex-fx');
var gui       = require('pex-gui');
var pbr       = require('./pbr');
var Q         = require('q');
var R         = require('ramda');
var fn        = require('./utils/fn');

var Window              = sys.Window;
var Platform            = sys.Platform;
var IO                  = sys.IO;
var Time                = sys.Time;
var Vec2                = geom.Vec2;
var Vec3                = geom.Vec3;
var Vec4                = geom.Vec4;
var Mat4                = geom.Mat4;
var Quat                = geom.Quat;
var Geometry            = geom.Geometry;
var BoundingBox         = geom.BoundingBox;
var Color               = color.Color;
var PerspectiveCamera   = glu.PerspectiveCamera;
var Arcball             = glu.Arcball;
var Mesh                = glu.Mesh;
var Texture2D           = glu.Texture2D;
var Cube                = gen.Cube;
var GUI                 = gui.GUI;
var SolidColor          = materials.SolidColor;
var ShowNormals         = materials.ShowNormals;
var Renderer            = pbr.Renderer;
var Scene               = pbr.Scene;
var PointLight          = pbr.PointLight;
var GlobalLight         = pbr.GlobalLight;
var UberMaterial        = require('./materials/UberMaterial');
var ThreeMeshLoader     = require('./utils/ThreeMeshLoader');
var ObjLoader           = require('./utils/ObjReader.js');
var MeshExt             = require('./glu/Mesh.Ext');
var LookSet             = require('./rose/LookSet');
var LookBuilder         = require('./rose/LookBuilder');
var Garments            = require('./rose/Garments');
var ColorUtils          = require('./utils/ColorUtils');
var Assets              = require('../server/public/js/assets.js');
var AssetsLoader        = require('./rose/AssetsLoader');

//-----------------------------------------------------------------------------

function loadTextFile(url) {
  var deferred = Q.defer();
  IO.loadTextFile(url, function(data) {
    if (data) {
      deferred.resolve(data);
    }
    else {
      deferred.reject(new Error('Failed to load ' + url));
    }
  });
  return deferred.promise;
}

//-----------------------------------------------------------------------------

function loadJSONFile(url) {
  var deferred = Q.defer();
  IO.loadTextFile(url, function(data) {
    if (data) {
      try {
        var json = JSON.parse(data);
        deferred.resolve(json);
      }
      catch(e) {
        deferred.reject(e);
        return null;
      }
    }
    else {
      deferred.reject(new Error('Failed to load ' + url));
    }
  });
  return deferred.promise;
}

//-----------------------------------------------------------------------------

var CameraPositions = [
  //free
  {
    position: new Vec3(18.4045415, 13.724, 21.9392),
    target: new Vec3(-0.14, 7.47, 1.5198753),
    up: new Vec3(0, 1, 0)
  },
  //{
  //  position: new Vec3(18.4045415, 13.724, 21.9392),
  //  target: new Vec3(-0.14, 7.47, 1.5198753),
  //  up: new Vec3(0, 1, 0)
  //},
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
  {
    position: new Vec3(50, 50, 50),
    target: new Vec3(0, 5, 0),
    up: new Vec3(0, 0, -1)
  },
];

var State = {
  //user
  //username: 'vorg',
  //username: 'mary',
  //username: 'convoy',
  //username: 'trista',
  username: 'f15wt4v',
  username: 'jm0vbnf',

  //renderer
  renderer: null,

  //scene
  scene: null,
  lights: [],
  stage: [],
  looks: [],
  preloadedLooks: [],
  numLooksOnStage: 1,
  maxNumLooks: Platform.isPlask ? 10 : 10,
  backgroundReflectionMap: AssetsLoader.getAssetsPath() + '/textures/envmaps/studio008.jpg',
  backgroundDiffuseMap: AssetsLoader.getAssetsPath() + '/textures/envmaps/studio008smallBlur.jpg',

  //lights
  ambientLightIntensity: 4.0,
  lightRadius: 20,

  //user
  userColors: [
    Color.create(1, 1, 1, 1),
    Color.create(1, 1, 1, 1),
    Color.create(1, 1, 1, 1),
    Color.create(1, 1, 1, 1)
  ],

  //stage
  camera: null,
  arcball: null,
  backgroundColor: ColorUtils.hexToColor('#581E9D'),
  ambientColor: Color.fromHSL(267.0/360.0, 0.6, 0.7, 0.7),
  ambientColorSat: 0.6,
  sideTrackColor: Color.fromHSL(130.0/360.0, 0.3, 0.7, 0.7),
  sideTrackColorSat: 0.3,
  floorColor: Color.fromHSL(267.0/360.0, 0.5, 0.46, 0.7),
  floorColorSat: 0.5,
  trackColor: Color.fromHSL(267.0/360.0, 0.6, 0.7, 0.7),
  trackColorSat: 0.6,
  trackBottomColor: Color.fromHSL(267.0/360.0, 0.5, 0.16, 0.7),
  trackBottomColorSat: 0.5,

  //looks
  currentLookIndex: 0,
  lookThumbnails: [],
  lookPositionLimit: 60,
  //lookStartingPosition: AssetsLoader.isDev() ? -0 : -120,
  lookStartingPosition: -120,

  //walking
  enableAnimation: AssetsLoader.isDev() ? false : true,
  enableWalking: AssetsLoader.isDev() ? false : true,
  modelWalkCycleDistance: 15,
  modelWalkCycleSpeed: 0.8,

  //cameras
  cameraPositionIndex: 0,

  //drawing
  drawBody: true,
  drawGarments: true,
  drawShapes: true,
  drawLowRes: false,
  checkPerformance: true
};

State.Dev = {
  shapes: [],
}

//-----------------------------------------------------------------------------

Window.create({
  settings: {
    width: 1600,
    height: 900,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: Platform.isBrowser ? 1 : 1,
  },
  init: function() {
    this.gui = new GUI(this);

    this.initUser();
    this.initRenderer();
    this.initScene();
    this.initLights();
    this.initStageMeshes();
    this.initLooks();
    this.initDev();
    this.initKeys();
  },
  initUser: function() {
    if (Platform.isBrowser) {
      var userMatch = document.location.href.match(/runway\/([^\/]+)/);
      if (userMatch && userMatch.length == 2) {
        State.username = userMatch[1];
      }
    }
  },
  initRenderer: function() {
    var rendereScale = 2;
    State.renderer = new Renderer(1024 * rendereScale, 512 * rendereScale);
  },
  initScene: function() {
    State.camera = new PerspectiveCamera(60, State.renderer.width/State.renderer.height, 1, 1000);
    State.arcball = new Arcball(this, State.camera, 20);
    State.arcball.setPosition(new Vec3(40, 40, 0));
    State.scene = new Scene();
  },
  initStageMeshes: function() {

    var floor = new Mesh(new Cube(500, 1, 500, 50, 1, 50), new SolidColor({ color: State.floorColor }));
    floor.position.y = -1.5;
    State.stage.push(floor);

    var side1 = new Mesh(new Cube(4, 6, 500, 4, 1, 50), new SolidColor({ color: State.sideTrackColor }));
    side1.position.x = -28;
    State.stage.push(side1);

    var side2 = new Mesh(new Cube(4, 6, 500, 4, 1, 50), new SolidColor({ color: State.sideTrackColor }));
    side2.position.x = -40;
    State.stage.push(side2);

    var side3 = new Mesh(new Cube(4, 6, 500, 4, 1, 50), new SolidColor({ color: State.sideTrackColor }));
    side3.position.x = -52;
    State.stage.push(side3);

    var catwalkMesh = new Mesh(new Cube(16, 1, 500, 4, 1, 50), new SolidColor({ color: State.trackBottomColor }));
    catwalkMesh.position.y -= 0.1;
    State.stage.push(catwalkMesh);

    var catwalkMeshGlass = new Mesh(new Cube(16, 0.1, 500, 8, 1, 100), new SolidColor({ color: State.trackColor }));
    catwalkMeshGlass.position.y = 0.5;
    State.stage.push(catwalkMeshGlass);

    var catwalkMesh2 = new Mesh(new Cube(32, 1, 500, 4, 1, 50), new SolidColor({ color: State.trackBottomColor }));
    catwalkMesh2.position.x -= 16/2 + 32/2 + 16;
    State.stage.push(catwalkMesh2);

    var catwalkMesh2Glass = new Mesh(new Cube(32, 0.1, 500, 4, 1, 50), new SolidColor({ color: State.trackColor }));
    catwalkMesh2Glass.position.x -= 16/2 + 32/2 + 16;
    catwalkMesh2Glass.position.y = -0.05;
    State.stage.push(catwalkMesh2Glass);

    var catwalkMesh3 = new Mesh(new Cube(32, 1, 500, 4, 1, 50), new SolidColor({ color: State.trackColor }));
    catwalkMesh3.position.x +=  16/2 + 32/2 + 16;
    State.stage.push(catwalkMesh3);

    var outside = new Cube(500, 500, 500);
    State.stage.push(new Mesh(outside, new SolidColor({ color:  new Color(1,1,1,0.1)})));

    State.stage.forEach(function(mesh) {
      mesh.position.y -= 0.6;
    })
  },
  initLights: function() {
    var reflectionMap = Texture2D.load(State.backgroundReflectionMap);
    var diffuseMap = Texture2D.load(State.backgroundDiffuseMap);

    State.lights.push(new GlobalLight(0.2, reflectionMap, diffuseMap, State.backgroundColor, new Color(1,1,1,1) ));
    //var numMeshes = this.options.numMeshes;
    //for(var i=0; i<numMeshes; i++) {
    //  var pos = gridPos(i, numMeshes, this.options.matrixRadius, this.options.matrixRadius);
    //  pos.y = 1;
    //  var color = new Color(2, 0, 0.3, 1.0);
    //  //color = Color.fromHSL(geom.randomFloat(0, 0.2), 0.9, 0.5);
    //  this.scene.add(new PointLight(pos, color, this.options.lightRadius, this.options.lightBrightness));
    //}
    //State.lights.push(new PointLight(new Vec3(5, 20, 0), Color.Green, 50, 2000));
  },
  initLooks: function() {
    console.log('Runway.initLooks');
    this.setLoadingProgress(0.1);

    this.lookBuilder = new LookBuilder(AssetsLoader.getAssetsPath());

    var looksFile = AssetsLoader.getAssetsPath() + '/../../data/' + State.username + '_looks.json';

    LookSet.load(looksFile).then(function(lookSet) {
      console.log('Runway.initLooks loaded file');
      this.setLoadingProgress(0.2);
      lookSet.looks = lookSet.looks.slice(0, Math.min(State.maxNumLooks, lookSet.looks.length));
      //lookSet.looks.forEach(function(look, i) {
      //  console.log(i, look.garments[0].name, look.garments[0].morphs.map(function(v) { return Math.floor(v*10)/10; }))
      //})

      //Setting background color from Looks
      var color = lookSet.looks[0].colors[0];
      State.userColors[0].set(color.r, color.g, color.b, color.a);
      State.userColors[1].set(color.r, color.g, color.b, color.a);
      var color2 = lookSet.looks[1].colors[0];
      State.userColors[2].set(color2.r, color2.g, color2.b, color2.a);
      State.userColors[3].set(color2.r, color2.g, color2.b, color2.a);

      if (this.gui && this.gui.items && this.gui.items[0]) this.gui.items[0].dirty = true; //hack, force gui refresh
      State.backgroundColor.copy(State.userColors[0]);
      console.log('Setting background color ', State.userColors[0]);

      var looksToLoad = lookSet.looks.map(function(look) { return look; });
      var preloadedLooks = [];

      function preloadNextLook() {
        var look = looksToLoad.shift();
        if (!look) {
          State.lookSet = lookSet;
          State.preloadedLooks = preloadedLooks;
          this.buildNextLook();
          return;
        }
        this.lookBuilder.build(look).then(function(preloadedLook) {
          preloadedLooks.push(preloadedLook);

          console.log('Runway.initLooks loaded look');
          this.setLoadingProgress(0.2 + 0.8 * preloadedLooks.length / lookSet.looks.length);

          preloadNextLook.bind(this)();
        }.bind(this))
        .fail(function(e) {
          console.log('FAIL:', 'Runway.initLooks loaded look', e);
        });
      }

      preloadNextLook.bind(this)();
    }.bind(this)).fail(function(e) { console.log(e); });
  },
  setLoadingProgress: function(progress) {
    if (Platform.isBrowser) {
      if (!State.preloader) {
        console.log('making preloader')
        State.preloader = document.createElement('div');
        document.body.appendChild(State.preloader);
        State.preloader.style.background = 'white';
        State.preloader.style.position = 'fixed';
        State.preloader.style.top = '0';
        State.preloader.style.left = '0';
        State.preloader.style.width = '0%';
        State.preloader.style.height = '5px';
        State.preloader.style.transition = 'opacity 2s';
        State.preloader.style.webkitTransition = 'opacity 2s';
        State.preloader.style.opacity = 1.0;
      }
      State.preloader.style.width = Math.floor(progress*100) + '%';
      if (progress > 0.99) {
        State.preloader.style.opacity = 0;
      }
    }
  },
  initDev: function() {
    if (!AssetsLoader.isDev()) return;

    this.initShapes();
    //this.initLookThumbnails();
    this.initGUI();
  },
  initLookThumbnails: function() {
    State.lookThumbnails = fn.sequence(0, 10).map(function(i) {
      try {
        var tex = Texture2D.load(AssetsLoader.getAssetsPath() + '/../../data/' + State.username + '/look' + i + '.png');
        return {
          name: 'Look' + i,
          texture: tex,
          value: i
        };
      }
      catch(e) {
        return null;
      }
    }.bind(this)).filter(function(th) { return th != null });
  },
  initShapes: function() {
    var rotation = Quat.fromAxisAngle(new Vec3(1, 0, 0), 90);
    Assets.Shapes.forEach(function(shape, shapeIndex) {
      try {
        ObjLoader.load(AssetsLoader.getAssetsPath() + '/' + shape.file, function(g) {
          var bbox = BoundingBox.fromPoints(g.vertices);
          var size = bbox.getSize();
          g.vertices.forEach(function(v) {
            v.transformQuat(rotation);
          })
          //g = g.toFlatGeometry();
          var matCapTextureUrl = AssetsLoader.getAssetsPath() + '/' + Assets.MatCaps[3];
          matCapTextureUrl = matCapTextureUrl.replace('/webgl/..', '')
          var matCapTexture = Texture2D.load(matCapTextureUrl);
          //matCapTexture = null;
          State.Dev.shapes[shapeIndex] = new Mesh(g, new UberMaterial({ skinned: true, correctGamma: true, matCapTexture: matCapTexture }))
        })
      }
      catch(e) {
        console.log('ERROR', AssetsLoader.getAssetsPath() + '/' + shape.file, e.stack);
      }
    })
  },
  initGUI: function() {
    this.gui.enabled = true;

    this.gui.addHeader('Lights').setPosition(10 * this.settings.highdpi, 10 * this.settings.highdpi);
    this.gui.addParam('Enable', State.renderer, 'enableLights');
    //this.gui.addParam('Num lights', this.options, 'numLights', { min: 0, max: 1 });
    //this.gui.addParam('Light radius', this.options, 'lightRadius', { min: 1, max: 100 });
    //this.gui.addParam('Light brightness', this.options, 'lightBrightness', { min: 0, max: 1024 });
    //this.gui.addParam('Light Y', this.options, 'lightHeight', { min: -10, max: 30 });
    //this.gui.addParam('Light XZ', this.options, 'lightXZ', { min: 0.01, max: 2 });
    //this.gui.addParam('Light Color', this.options, 'lightColor');
    this.gui.addParam('Ambient light', State, 'ambientLightIntensity', { min: 0, max: 5 });
    this.gui.addParam('Ambient light color', State, 'ambientColor');

    this.gui.addHeader('Shadows');
    this.gui.addParam('Enable', State.renderer, 'enableShadows');

    this.gui.addHeader('Fog');
    this.gui.addParam('Enable', State.renderer, 'enableFog');
    this.gui.addParam('Fog density', State.renderer, 'fogDensity', { min: 0, max: 10 });
    this.gui.addParam('Fog start', State.renderer, 'fogStart', { min: 0, max: 1 });
    this.gui.addParam('Fog end', State.renderer, 'fogEnd', { min: 0, max: 1 });
    this.gui.addParam('Fog Color', State, 'backgroundColor');

    this.gui.addHeader('Ambient Occlusion').setPosition(10 + 170 * this.settings.highdpi, 10 * this.settings.highdpi);;
    this.gui.addParam('Enable', State.renderer, 'enableSSAO');
    this.gui.addParam('Strength', State.renderer, 'ssao', { min: 0, max: 20 });

    this.gui.addHeader('Tonemapping')
    this.gui.addParam('Enable', State.renderer, 'enableToneMapping');
    this.gui.addParam('Exposure', State.renderer, 'exposure', { min: 0.5, max: 3 });

    this.gui.addHeader('Gamma');
    this.gui.addParam('Enable', State.renderer, 'enableGamma');

    this.gui.addHeader('Contrast');
    this.gui.addParam('Enable', State.renderer, 'enableContrast');
    this.gui.addParam('Contrast', State.renderer, 'contrast', { min: 0.5, max: 3 });

    this.gui.addHeader('Antialiasing');
    this.gui.addParam('Enable', State.renderer, 'enableFXAA');

    this.gui.addHeader('Animation').setPosition(10 + 2 * 170 * this.settings.highdpi, 10 * this.settings.highdpi);
    this.gui.addParam('Enable', State, 'enableAnimation');
    this.gui.addParam('Walking', State, 'enableWalking');

    this.gui.addHeader('User')
    this.gui.addParam('User color 1', State.userColors, '0');
    //this.gui.addParam('User color 2', State.userColors, '1');
    //this.gui.addParam('User color 3', State.userColors, '2');
    this.gui.addTextureList('Looks', State, 'currentLookIndex', State.lookThumbnails, 2, function(i) {
      State.currentLookIndex = i;
      this.rebuildCurrentLook();
    }.bind(this));

    this.gui.addHeader('Performance').setPosition(10 + 3 * 170 * this.settings.highdpi, 10 * this.settings.highdpi);
    this.gui.addParam('Check performance', State, 'checkPerformance');
    this.gui.addParam('LooksOnStage', State, 'numLooksOnStage', { min: 1, max: 10, step: 1});
    this.gui.addParam('Draw body', State, 'drawBody');
    this.gui.addParam('Draw garments', State, 'drawGarments');
    this.gui.addParam('Draw shapes', State, 'drawShapes');
    this.gui.addParam('Draw LowRes', State, 'drawLowRes');

    var shapeGeometryList = Assets.Shapes.map(function(shape, i) {
      return {
        name: shape.name,
        value: i
      };
    })

    this.gui.addRadioList('Shapes', State.Dev, 'shapeIndex', shapeGeometryList, function(i) {
      State.looks[0].setShape(State.Dev.shapes[i]);
      State.looks[0].bakeShapes();
    }.bind(this));

    this.gui.addHeader('Debug');
    this.gui.addParam('Enable', State.renderer, 'debug');

    this.gui.addHeader('Looks').setPosition(10 + 4 * 170 * this.settings.highdpi, 10 * this.settings.highdpi);;
    this.gui.addButton('Next', this, 'jumpToNextLook');
    this.gui.addButton('Random', this, 'genRandomLook');
  },
  initKeys: function() {
    this.on('keyDown', function(e) {
      if (e.str == ' ') { this.jumpToNextLook(); }
      if (e.str == 'g') { this.gui.enabled = !this.gui.enabled; }
      if (e.str == 'B') { State.renderer.fogColor.set(1,1,1,1); }
      if (e.str == '0') { State.cameraPositionIndex = -1; }
      if (e.str == '1') { State.cameraPositionIndex = 0; }
      if (e.str == '2') { State.cameraPositionIndex = 1; }
      if (e.str == '3') { State.cameraPositionIndex = 2; }
      if (e.str == '4') { State.cameraPositionIndex = 3; }
      if (e.str == '5') { State.cameraPositionIndex = 4; }
      if (e.str == '6') { State.cameraPositionIndex = 5; }
      if (e.str == '7') { State.cameraPositionIndex = 6; }
    }.bind(this))
  },
  buildNextLook: function() {
    if (State.lookSet) {
      if (State.preloadedLooks[State.currentLookIndex]) {
        var look = State.preloadedLooks[State.currentLookIndex];
        look.animationTime = Math.random();
        if (State.enableWalking) {
          look.position.z = State.lookStartingPosition - 2 * State.looks.length * State.lookPositionLimit/State.numLooksOnStage;
        }
        else {
          look.position.z = 0
        }
        State.looks.unshift(look);
        State.currentLookIndex = (State.currentLookIndex + 1) % State.lookSet.looks.length;
      }
      else {
        this.buildLook(State.lookSet.looks[State.currentLookIndex]);
        State.currentLookIndex = (State.currentLookIndex + 1) % State.lookSet.looks.length;
      }
    }
  },
  rebuildCurrentLook: function() {
    var look = State.preloadedLooks[State.currentLookIndex];
    look.animationTime = Math.random();
    look.position.z = 0;
    State.looks.unshift(look);
  },
  checkPerformanceCounter: 0,
  checkPerformance: function() {
    if (!State.checkPerformance) {
      State.drawLowRes = false;
      State.renderer.enableFXAA = false;
      return;
    }
    if (State.looks.length > 0 && this.checkPerformanceCounter++ > 400 && Time.fps > 0 && Time.fps < 20) {
      State.drawLowRes = true;
      State.renderer.enableFXAA = true;
    }
  },
  jumpToNextLook: function() {
    State.looks = [];
    this.buildNextLook();
  },
  buildLook: function(lookData, centered) {
    console.log('Runway.buildLook');
    return this.lookBuilder.build(lookData).then(function(look) {
      console.log('Runway.buildLook done');
      look.animationTime = Math.random();

      if (centered) {
        look.position.z = 0;
      }
      else {
        look.position.z = State.lookStartingPosition;
        look.position.z -= 2 * State.looks.length * State.lookPositionLimit/State.numLooksOnStage;
      }
      State.looks.unshift(look);
      return look;
    }.bind(this))
  },
  genRandomLook: function() {
    State.numLooksOnStage = 1;
    State.looks.length = 0;

    var lookStyle = Garments.female[geom.randomElement(Object.keys(Garments.female))];
    var garments = [];
    var fullDress = geom.randomChance(0.5);
    if (fullDress) {
      garments.push(geom.randomElement(lookStyle.full));
    }
    else {
      garments.push(geom.randomElement(lookStyle.top));
      garments.push(geom.randomElement(lookStyle.bottom));
    }
    garments = garments.map(function(garment) {
      var influences = garment.morphNames.slice(0, 5)
        .map(function() { return geom.randomFloat(); })
      return {
        name: garment.name,
        morphs: influences
      }
    })
    this.buildLook({
      gender: 'female',
      shapeType: 'cube',
      garments: garments,
      colors: [ Color.fromHSL(geom.randomFloat(),1,0.5,1), Color.fromHSL(geom.randomFloat(),1,0.5,1)],
      shapeColor: Color.fromHSL(geom.randomFloat(),1,1,1),
      garmentMaterial: {
        type: ''
      },
      shapeMaterial: {
        type: ''
      },
      shapes: [ {
        position: new Vec3(0,0,0),
        scale: new Vec3(0,0,0),
        rotation: new Quat()
      }]
    }, true).then(function(look) {
      console.log('random look!')
      look.setShapeScale(2)
      look.setShapePlacement('edgesAligned');
      look.bakeShapes();
    }).fail(function(e) {
      console.log(e.stack);
    })
  },
  updateCamera: function() {
    var camSetup = CameraPositions[State.cameraPositionIndex];
    //var camSetup1 = CameraPositions[0];
    //var camSetup2 = CameraPositions[1];
    //var pan = (Time.seconds / 10) % 1;
    //var camSetup = {
    //  position: camSetup1.position.dup().lerp(camSetup2.position, pan),
    //  target: camSetup1.target.dup().lerp(camSetup2.target, pan),
    //  up: camSetup1.up.dup().lerp(camSetup2.up, pan)
    //}
    if (camSetup) {
      State.camera.setPosition(camSetup.position);
      State.camera.setTarget(camSetup.target);
      State.camera.setUp(camSetup.up);
      State.arcball.setPosition(camSetup.position);
      State.arcball.setTarget(camSetup.target);
    }
  },
  updateLooks: function() {
    var looksToRemove = [];
    State.looks.forEach(function(look, lookIndex) {
      if (State.enableWalking) {
        look.position.z += Time.delta * State.modelWalkCycleDistance * State.modelWalkCycleSpeed;
      }
      if (look.position.z > State.lookPositionLimit || lookIndex >= State.numLooksOnStage) {
        looksToRemove.push(look);
      }
    })
    looksToRemove.forEach(function(look) {
      State.looks.splice(State.looks.indexOf(look), 1);
    })
    if (State.looks.length < State.numLooksOnStage) {
      this.buildNextLook();
    }
  },
  updateLights: function() {
    if (State.looks.length > 0) {
      State.renderer.lightCamera.position.z = State.looks[0].position.z + 30;
      State.renderer.lightCamera.target.z = State.looks[0].position.z - 5;
      State.renderer.lightCamera.updateMatrices();
    }

    State.lights.forEach(function(light) {
      if (light instanceof PointLight) {
        var r = State.lightRadius;
        light.setRadius(r);
        //light.position.y = this.options.lightHeight;
        //light.setColor(this.options.lightColor);
        //light.setBrightness(this.options.lightBrightness);
      }
      if (light instanceof GlobalLight) {
        light.color = State.ambientColor;
        light.setIntensity(State.ambientLightIntensity);
      }
    }.bind(this));
  },
  updateColors: function() {
    var backgroundColor = State.backgroundColor.getHSL();

    State.renderer.fogColor = State.backgroundColor;

    var ambientColor = State.ambientColor.getHSL();
    State.ambientColor.setHSL(backgroundColor.h, State.ambientColorSat * backgroundColor.s, ambientColor.l, ambientColor.a);

    var sideTrackColor = State.sideTrackColor.getHSL();
    State.sideTrackColor.setHSL(backgroundColor.h, State.sideTrackColorSat * backgroundColor.s, sideTrackColor.l, sideTrackColor.a);

    var floorColor = State.floorColor.getHSL();
    State.floorColor.setHSL(backgroundColor.h, State.floorColorSat * backgroundColor.s, floorColor.l, floorColor.a);

    var trackColor = State.trackColor.getHSL();
    State.trackColor.setHSL(backgroundColor.h, State.trackColorSat * backgroundColor.s, trackColor.l, trackColor.a);

    var trackBottomColor = State.trackBottomColor.getHSL();
    State.trackBottomColor.setHSL(backgroundColor.h, State.trackBottomColorSat * backgroundColor.s, trackBottomColor.l, trackBottomColor.a);
  },
  updateRenderer: function() {
    if (State.drawLowRes && State.renderer.width == 2048) {
      State.renderer.resize(1024, 512);
    }
    else if (!State.drawLowRes && State.renderer.width == 1024) {
      State.renderer.resize(2048, 1024);
    }
  },
  update: function() {
    this.checkPerformance();
    this.updateCamera();
    this.updateLights();
    this.updateLooks();
    this.updateColors();
    this.updateRenderer();
  },
  draw: function() {
    Time.verbose = true;

    this.update();

    glu.clearColorAndDepth();
    glu.enableDepthReadAndWrite();

    glu.viewport(0, 0, this.width, this.height);

    State.scene.clear();
    State.scene.add(State.camera);
    State.lights.forEach(function(light) {
      State.scene.add(light);
    })
    State.stage.forEach(function(mesh) {
      State.scene.add(mesh);
    })
    State.looks.forEach(function(look) {
      look.update();
      look.setAnimationEnabled(State.enableAnimation);
      if (State.drawBody && look.getBody()) {
        look.getBody().update();
        State.scene.add(look.getBody());
      }
      if (State.drawGarments) {
        look.getGarments().forEach(function(garment) {
          garment.update();
          State.scene.add(garment);
        })
      }
      if (State.drawShapes && look.getBakedShapes()) {
        look.getBakedShapes().update();
        State.scene.add(look.getBakedShapes());
      }
    })

    State.renderer.draw(State.scene, this.width, this.height);
    glu.viewport(0, 0, this.width, this.height);

    this.gui.draw();
  }
})