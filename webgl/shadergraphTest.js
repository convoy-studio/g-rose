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

var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Mesh = glu.Mesh;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Platform = sys.Platform;
var Time = sys.Time;
var Vec3 = geom.Vec3;
var Cube = gen.Cube;
var Sphere = gen.Sphere;
var GUI = gui.GUI;
var Geometry = geom.Geometry;
var ShowNormals = materials.ShowNormals;

//-----------------------------------------------------------------------------

var CoffeeScript = require("coffee-script");
CoffeeScript.register();
var fs = require('fs');

var shadergraph = require('shadergraph');

var fetch = {
  'Position.vert' : fs.readFileSync(__dirname + '/sg/shaders/Position.vert', 'utf-8'),
  'Output.vert'      : fs.readFileSync(__dirname + '/sg/shaders/Output.vert', 'utf-8'),
  'Output.frag'      : fs.readFileSync(__dirname + '/sg/shaders/Output.frag', 'utf-8'),
  'SolidColor.frag'  : fs.readFileSync(__dirname + '/sg/shaders/SolidColor.frag', 'utf-8')
}

var sg = shadergraph(fetch);

//-----------------------------------------------------------------------------

var ASSETS_URL = '../server/public/assets/';
var DPI = 2;

sys.Window.create({
  settings: {
    width: 1280 * DPI,
    height: 720 * DPI,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: DPI
  },
  animationEnabled: false,
  bodyIndex: 0,
  garmentIndex: 0,
  shapeIndex: 1,
  shapePlacement: "heavyTop",
  shapeScale: 0.5,
  init: function() {
    this.initGUI();
    this.initControls();
    this.look = new Look();

    this.initMaterials();
    this.loadModels();
  },
  initMaterials: function() {
    this.solidColor = (function() {
      var material = sg.material();

      material.vertex.pipe('Position.vert').pipe('Output.vert', { projectionMatrix: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1] });
      material.fragment.pipe('SolidColor.frag').pipe('Output.frag');

      var program = material.build();

      console.log(program)

      return new Material(new Program(program.vertexShader, program.fragmentShader));
    })();
  },
  initGUI: function() {
    this.gui = new GUI(this);
  },
  initControls: function() {
    this.camera = new PerspectiveCamera(60, this.width / this.height);
    this.arcball = new Arcball(this, this.camera);
    this.arcball.setTarget(new Vec3(0, -1, 0))
    this.arcball.setPosition(new Vec3(12, 6, 12))
  },
  loadModels: function() {
    Q.all([
      Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'),
    ])
    .then(function(models) {
      this.look.setBody(models[0]);
      models[0].setMaterial(this.solidColor);
      //this.look.setAnimationEnabled(this.animationEnabled);
    }.bind(this))
    .fail(function(e) { console.log(e); });
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    this.look.draw(this.camera);
    this.gui.draw();
  }
});