var sys = require('pex-sys');
var glu = require('pex-glu');
var gui = require('pex-gui');
var Q = require('q');
var materials = require('pex-materials');
var color = require('pex-color');
var geom = require('pex-geom');
var gen = require('pex-gen');
var Model = require('./rose/Model');
var Look = require('./rose/Look');
var Triangle3 = require('./geom/Triangle3');
var RayExt = require('./geom/Ray.Ext');
var RoseMaterial = require('./materials/RoseMaterial');

var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Mesh = glu.Mesh;
var Color = color.Color;
var Platform = sys.Platform;
var Time = sys.Time;
var Vec3 = geom.Vec3;
var Quat = geom.Quat;
var Cube = gen.Cube;
var Sphere = gen.Sphere;
var Tetrahedron = gen.Tetrahedron;
var GUI = gui.GUI;
var Geometry = geom.Geometry;
var ShowNormals = materials.ShowNormals;

var shapeIndex = 0;

var animationEnabled= false,
    bodyIndex= 0,
    garmentIndex= 0,
    shapeMesh= null,
    shapeInstances= [];


var DPI = Platform.isBrowser ? 1 : 2;

var isLocalhost = typeof(document) == 'undefined' ? false : document.location.href.indexOf('localhost') != -1;

var ASSETS_URL = '';
if (Platform.isPlask) { ASSETS_URL = '../server/public/assets/'; }
if (Platform.isBrowser && isLocalhost) { ASSETS_URL = 'http://localhost:3003/assets/'; }
if (Platform.isBrowser && !isLocalhost) { ASSETS_URL = '/assets/'; }

function init(canvas, canvasWidth, canvasHeight, body, garment) {
  return {
    settings: {
      width: canvasWidth || 1280 * DPI,
      height: canvasHeight || 720 * DPI,
      type: '3d',
      highdpi: DPI,
      canvas: canvas,
      borderless: true
    },
    init: function() {
      this.bodies = [];
      this.garments = [];
      this.shapes = [];
      this.animationEnabled = true;
      this.bodyIndex= 0;
      this.garmentIndex= 0;
      this.bodyFile = body;
      this.garmentFile = garment;
      this.cameraDistance = 22;
      this.numLooks = 6;

      this.initGUI();
      this.initControls();
      this.look = new Look();

      this.shapeType = "sphere";
      this.bgColor = new Color(0, 0, 0, 0);
      this.previewMaterial = new RoseMaterial({
        lightPos: new Vec3(10, 10, 10)
      });
      this.shapeMaterial = new RoseMaterial({lightPos: new Vec3(3, 3, 150), color: Color.create(.2, .2, .2, 1), useDiffuse: true});
      this.previewMaterial = new RoseMaterial({lightPos: new Vec3(0, 5, 5), color: Color.create(.2, .9, .9, .3)});

      this.shapeMesh = new Mesh(new Sphere(.7,8,8), this.shapeMaterial);
      this.currentShape = new Mesh(new Sphere(.7,8,8), this.previewMaterial);

      this.loadModels();
    },
    initGUI: function() {
      this.gui = new GUI(this);
    },
    initControls: function() {
      //this.camera = new PerspectiveCamera(120, this.width / this.height);
      this.camera = new PerspectiveCamera(60, this.width / this.height);
      this.arcball = new Arcball(this, this.camera);
      this.arcball.setTarget(new Vec3(0, -2, 0));
      this.arcball.setPosition(new Vec3(0, -2, this.cameraDistance));
    },
    loadModels: function() {
      var looks = this.looks = [];

      function createLook(models) {
        var look = new Look();
        look.setBody(models[0]);
        look.setGarment(models[1]);
        look.getGarment().getMaterial().uniforms.color = Color.fromHSV(Math.random(), 1, 0.8);
        look.setAnimationEnabled(true);
        look.animationTime = Math.random();
        looks.push(look);
      }
      Q.all([ Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/womens_dress.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/womens_pants.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/womens_shirt.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/womens_blazer.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/womens_blazer.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/womens_dress.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/male_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/mens_coat.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/male_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/mens_collared_shirt.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/male_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/mens_pants.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/male_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/mens_tank.js') ]).then(createLook);
      Q.all([ Model.load(ASSETS_URL + 'models/male_walking_lowpoly.js'), Model.load(ASSETS_URL + 'models/mens_shirt.js') ]).then(createLook);
    },
    draw: function() {
      Time.verbose = true;

      glu.clearColorAndDepth(this.bgColor);
      glu.enableDepthReadAndWrite(true);


      var vW = this.width / this.numLooks;
      this.camera.setAspectRatio(vW/this.height);
      for(var i=0; i<this.numLooks; i++) {
        glu.viewport(vW*i, 0, vW, this.height);
        if (this.looks.length >= this.numLooks) {
          this.looks[i].draw(this.camera);
        }
      }

      glu.viewport(0, 0, this.width, this.height);
      this.camera.setAspectRatio(this.width/this.height);

      this.gui.draw();
    },
    setRotation: function(angle) {
      var rot = angle/180 * Math.PI;
      rot += Math.PI/2; //angle = 0' is on the right, we want to start from front
      this.camera.setPosition(new Vec3(
        this.cameraDistance * Math.cos(rot),
        -2,
        this.cameraDistance * Math.sin(rot)
      ));
    },
    getLook: function() {
      return this.look;
    },
    clearShapes: function() {
      this.shapeInstances= [];
    },
    undo: function() {
      this.shapeInstances = this.shapeInstances.slice(0, this.shapeInstances.length-1);
    },
    setNumLooks: function(n) {
      this.numLooks = n;
    }
  }
}

if (Platform.isPlask) {
  var view = init(null, 0, 0, '../server/public/assets/models/female_walking_lowpoly.js', '../server/public/assets/models/womens_dress.js');
  sys.Window.create(view);
}
else if (Platform.isBrowser) {
  //define reusable class
  window.WalkingView = function(canvasId, body, garment) {
    var canvas = document.getElementById(canvasId);
    var view = init(canvas, canvas.clientWidth, canvas.clientHeight, body, garment);
    sys.Window.create(view);

    canvas.style.backgroundColor = 'transparent';

    this.setRotation = view.setRotation.bind(view);
    this.setNumLooks = view.setNumLooks.bind(view);
    this.getView = function() { return view; };
    this.setBGColor = function(color) {
      canvas.style.backgroundColor = color;
    }
  }
}