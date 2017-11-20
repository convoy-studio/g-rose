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
var Color = color.Color;
var Platform = sys.Platform;
var Time = sys.Time;
var Vec3 = geom.Vec3;
var Cube = gen.Cube;
var Sphere = gen.Sphere;
var GUI = gui.GUI;
var Geometry = geom.Geometry;
var ShowNormals = materials.ShowNormals;

var DPI = Platform.isBrowser ? 1 : 2;

var ASSETS_URL = '../server/public/assets/';

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
    this.bodies = [];
    this.garments = [];
    this.shapes = [];

    this.shapes.push(new Mesh(new Geometry({ vertices: [new Vec3(0, 0, 0)], faces: [0, 0, 0] }), new ShowNormals()))
    this.shapes.push(new Mesh(new Cube(), new ShowNormals()))
    this.shapes.push(new Mesh(new Sphere(0.5, 8, 8), new ShowNormals()))

    var g = new gen.Tetrahedron().triangulate();
    g = g.toFlatGeometry();
    g.computeNormals();
    this.shapeMesh = new glu.Mesh(g, new ShowNormals());
    this.shapeMesh.scale.set(10, 10, 10);

    this.loadModels();
  },
  initGUI: function() {
    this.gui = new GUI(this);
    this.gui.addParam('ANIMATE', this, 'animationEnabled', {}, function(e) {
      this.look.setAnimationEnabled(this.animationEnabled);
    }.bind(this));
    this.gui.addRadioList('BODY', this, 'bodyIndex', [
      { name: 'Female', value: 0 },
      { name: 'Male', value: 1 }
    ], this.onBodyChanged.bind(this));
    this.gui.addRadioList('GARMENT', this, 'garmentIndex', [
      { name: 'Women Blazer', value: 0 },
      { name: 'Women Dress', value: 1 },
      { name: 'Women Pants', value: 2 },
      { name: 'Women Shirt', value: 3 },
      { name: 'Mens Coat', value: 4 },
      { name: 'Mens Collared shirt', value: 5 },
      { name: 'Mens Shirt', value: 6 },
      { name: 'Mens Pants', value: 7 },
      { name: 'Mens Tank', value: 8 }
    ], this.onGarmentChanged.bind(this));
    this.gui.addRadioList('SHAPE', this, 'shapeIndex', [
      { name: 'None', value: 0 },
      { name: 'Cube', value: 1 },
      { name: 'Sphere', value: 2 },
    ], this.onShapeChanged.bind(this));
    this.gui.addParam('SHAPE SCALE', this, 'shapeScale', { min: 0, max: 2 }, this.onShapeScaleChanged.bind(this)),
    this.gui.addRadioList('PLACEMENT', this, 'shapePlacement', [
      { name: 'Vertices', value: "vertices" },
      //{ name: 'Random', value: "random" },
      { name: 'Random Aligned', value: "randomAligned" },
      //{ name: 'Heavy top', value: "heavyTop" },
      { name: 'Heavy top aligned', value: "heavyTopAligned" },
      //{ name: 'Heavy bottom', value: "heavyBottom" },
      { name: 'Heavy bottom aligned', value: "heavyBottomAligned" }
    ], this.onShapePlacementChanged.bind(this));
  },
  initControls: function() {
    this.camera = new PerspectiveCamera(60, this.width / this.height);
    this.arcball = new Arcball(this, this.camera);
    this.arcball.setTarget(new Vec3(0, -1, 0))
    this.arcball.setPosition(new Vec3(12, 6, 12))
  },
  onBodyChanged: function(index) {
    if (index < this.bodies.length) {
      this.look.setBody(this.bodies[index]);
    }
    if (this.bodyIndex == 1 && this.garmentIndex < 4) {
      this.garmentIndex = 4;
      this.look.setGarment(this.garments[this.garmentIndex]);
    }
    else if (this.bodyIndex == 0 && this.garmentIndex >= 4) {
      this.garmentIndex = 0;
      this.look.setGarment(this.garments[this.garmentIndex]);
    }
  },
  onGarmentChanged: function(index) {
    if (index < this.garments.length) {
      this.look.setGarment(this.garments[index]);
    }
    if (index < 4 && this.bodyIndex == 1) {
      this.bodyIndex = 0;
      this.look.setBody(this.bodies[this.bodyIndex]);
    }
    if (index >= 4 && this.bodyIndex == 0) {
      this.bodyIndex = 1;
      this.look.setBody(this.bodies[this.bodyIndex]);
    }
  },
  onShapeChanged: function(index) {
    this.look.setShape(this.shapes[index]);
  },
  onShapeScaleChanged: function(scale) {
    this.look.setShapeScale(scale);
  },
  onShapePlacementChanged: function(name) {
    this.look.setShapePlacement(name);
  },
  loadModels: function() {
    Q.all([
      Model.load(ASSETS_URL + 'models/female_walking_lowpoly.js'),
      Model.load(ASSETS_URL + 'models/male_walking_lowpoly.js')
    ])
    .then(function(models) {
      this.look.setBody(models[0]);
      this.look.setAnimationEnabled(this.animationEnabled);
      this.look.setShape(this.shapes[this.shapeIndex])
      this.look.setShapePlacement(this.shapePlacement)
      this.look.setShapeScale(this.shapeScale);
      this.bodies = models;
    }.bind(this))
    .fail(function(e) { console.log(e); });

    Q.all([
      Model.load(ASSETS_URL + 'models/womens_blazer.js'),
      Model.load(ASSETS_URL + 'models/womens_dress.js'),
      Model.load(ASSETS_URL + 'models/womens_pants.js'),
      Model.load(ASSETS_URL + 'models/womens_shirt.js'),
      Model.load(ASSETS_URL + 'models/mens_coat.js'),
      Model.load(ASSETS_URL + 'models/mens_collared_shirt.js'),
      Model.load(ASSETS_URL + 'models/mens_shirt.js'),
      Model.load(ASSETS_URL + 'models/mens_pants.js'),
      Model.load(ASSETS_URL + 'models/mens_tank.js')
    ])
    .then(function(models) {
      this.look.setGarment(models[0]);
      this.garments = models;
    }.bind(this))
    .fail(function(e) { console.log(e); });
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    //this.shapeMesh.draw(this.camera);

    this.look.draw(this.camera);
    this.gui.draw();
  }
});

