var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var geom = require('pex-geom');
var fx = require('pex-fx');
var gui = require('pex-gui');
var pbr = require('../pbr');
var ColorUtils = require('../utils/ColorUtils');
var Model = require('../rose/Model');
var Look = require('../rose/Look');
var UberMaterial = require('../materials/UberMaterial');
var LookSet = require('../rose/LookSet');
var LookBuilder = require('../rose/LookBuilder');
var ObjReader = require('../utils/ObjReader');

var Box                 = gen.Box;
var Cube                = gen.Cube;
var Sphere              = gen.Sphere;
var Dodecahedron        = gen.Dodecahedron;
var Tetrahedron         = gen.Tetrahedron;
var Mesh                = glu.Mesh;
var PerspectiveCamera   = glu.PerspectiveCamera;
var Arcball             = glu.Arcball;
var Texture2D           = glu.Texture2D;
var TextureCube         = glu.TextureCube;
var ShowNormals         = materials.ShowNormals;
var SolidColor          = materials.SolidColor;
var TexturedCubeMap     = materials.TexturedCubeMap;
var ShowDepth           = materials.ShowDepth;
var Color               = color.Color;
var Platform            = sys.Platform;
var Window              = sys.Window;
var Time                = sys.Time;
var Vec3                = geom.Vec3;
var Quat                = geom.Quat;
var GUI                 = gui.GUI;

var Renderer            = pbr.Renderer;
var Scene               = pbr.Scene;
var PointLight          = pbr.PointLight;
var GlobalLight         = pbr.GlobalLight;
var MatCapAlpha         = pbr.materials.MatCapAlpha;

var ASSETS_URL = '';
var isLocalhost = typeof(document) == 'undefined' ? false : document.location.href.indexOf('localhost') != -1;
var isLocalhostServer = typeof(document) == 'undefined' ? false : document.location.href.indexOf('3003') != -1;
if (Platform.isPlask) { ASSETS_URL = __dirname + '/../../server/public/assets'; }
if (Platform.isBrowser && isLocalhost) { ASSETS_URL = '../../server/public/assets'; }
if (Platform.isBrowser && isLocalhostServer) { ASSETS_URL = '..//public/assets'; }
if (Platform.isBrowser && !isLocalhost) { ASSETS_URL = '/assets/'; }

Window.create({
  settings: {
    width: 1024,
    height: 512,
    type: '3d'
  },
  init: function() {
    Time.verbose = true;

    this.renderer = new Renderer(1024, 512);
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(60, this.renderer.width/this.renderer.height, 1, 50);
    this.arcball = new Arcball(this, this.camera, 8);
    this.arcball.setPosition(new Vec3(2,2,2))

    var cubeMesh = new Mesh(new Cube(), new SolidColor());
    cubeMesh.rotation = Quat.fromAxisAngle(new Vec3(1,1,1).normalize(), 45)
    cubeMesh.position.x = -0.5;
    cubeMesh.position.y = 0.3;

    var sphereMesh = new Mesh(new Sphere(), new SolidColor());
    sphereMesh.position.x = 1;
    sphereMesh.position.y = 0.25;
    sphereMesh.position.z = 0.5;

    var floorMesh = new Mesh(new Cube(8, 0.1, 8), new SolidColor());
    floorMesh.position.y = -0.5;

    this.scene.add(cubeMesh);
    this.scene.add(sphereMesh);
    this.scene.add(floorMesh);
    this.scene.add(this.camera);

    var reflectionMap = Texture2D.load(ASSETS_URL + '/textures/envmaps/studio008.jpg');
    var diffuseMap = Texture2D.load(ASSETS_URL + '/textures/envmaps/studio008smallBlur.jpg');

    this.scene.add(new GlobalLight(0.2, reflectionMap, diffuseMap, new Color(1,0,0,1), new Color(1,1,1,1) ));
    this.scene.add(new PointLight(new Vec3(2,2,2), Color.White));
    this.renderer.exposure = 3;
    this.renderer.lightCamera.setNear(1);
    this.renderer.lightCamera.setFar(10);
    this.renderer.lightCamera.setPosition(new Vec3(0, 4, 4));
  },
  draw: function() {
    glu.clearColor(Color.Red);

    this.renderer.draw(this.scene, this.width, this.height);
  }
})