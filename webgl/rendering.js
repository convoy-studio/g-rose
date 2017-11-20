var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var geom = require('pex-geom');
var fx = require('pex-fx');
var gui = require('pex-gui');
var pbr = require('./pbr')

var Box                 = gen.Box;
var Cube                 = gen.Cube;
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
if (Platform.isPlask) { ASSETS_URL = '../server/public/assets/'; }
if (Platform.isBrowser && isLocalhost) { ASSETS_URL = '../server/public/assets'; }
if (Platform.isBrowser && !isLocalhost) { ASSETS_URL = '/assets/'; }

function gridPos(i, n, dx, dz) {
  var d = Math.floor(Math.sqrt(n));
  var x = i % d;
  var z = Math.floor(i / d);
  return new Vec3(-dx/2 + dx * x / (d - 1), 0, -dz/2 + dz * z / (d - 1));
}

sys.Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    //highdpi: Platform.isBrowser ? 2 : false,
  },
  options: {
    numMeshes: 36,
    matrixRadius: 5,
    ambientLightIntensity: 1,
    numLights: 1,
    lightRadius: 5,
    lightHeight: 1,
    lightXZ: 1,
    lightBrightness: 1.3,
    lightColor: new Color(1,1,1,1),
    meshColor: Color.fromHSL(0, 0.8, 0.5),
    debug: true,
    materialMode: 0,
    layoutMode: 0
  },
  init: function() {
    this.gui = new GUI(this);

    geom.randomSeed(0);

    this.renderer = new Renderer(1024*2, 512*2);
    this.initScene();
    this.initMeshes();
    this.initLights();
    this.initGUI();
  },
  initScene: function() {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(60, this.renderer.width/this.renderer.height, 1, 50);
    this.arcball = new Arcball(this, this.camera, 8);
    this.arcball.setTarget(new Vec3(0, -1, 0));
    this.arcball.setPosition(new Vec3(6, 6, 6));
    this.scene.add(this.camera);
  },
  initMeshes: function() {
    var numMeshes = this.options.numMeshes;

    var matcapTexture1 = Texture2D.load(ASSETS_URL + '/textures/matcaps/MatcapBronze.jpg');
    var matcapTexture2 = Texture2D.load(ASSETS_URL + '/textures/matcaps/matcap.jpg');
    var matcapTexture3 = Texture2D.load(ASSETS_URL + '/textures/matcaps/generator8.jpg');

    for(var i=0; i<numMeshes; i++) {
      var box = new Box(0.8);
      //var box = new Tetrahedron(0.8);
      box = box.dooSabin().catmullClark().catmullClark();
      box.computeNormals();
      //box = new Sphere(0.4);
      var pos = gridPos(i, numMeshes, this.options.matrixRadius, this.options.matrixRadius);
      var roughness = 0.1 + 0.9*i/numMeshes;
      var m = new Mesh(box, null);
      m.hue = geom.randomFloat(0, 1);
      m.roughness = roughness;
      m.materials = [];
      m.materials.push(new SolidColor({ color: Color.fromHSL(m.hue, 0.5, 0.5, roughness) }));
      m.materials.push(new MatCapAlpha({ texture: matcapTexture1, alpha: roughness }));
      m.materials.push(new MatCapAlpha({ texture: matcapTexture2, alpha: roughness }));
      m.materials.push(new MatCapAlpha({ texture: matcapTexture3, alpha: roughness }));

      m.position = pos;
      this.scene.add(m);
    }
    var outside = new Cube(30, 30, 30);
    this.scene.add(new Mesh(outside, new SolidColor({ color:  new Color(1,1,1,0.1)})));
  },
  initLights: function() {
    var reflectionMap = Texture2D.load(ASSETS_URL + '/textures/envmaps/studio008.jpg');
    var diffuseMap = Texture2D.load(ASSETS_URL + '/textures/envmaps/studio008smallBlur.jpg');

    this.scene.add(new GlobalLight(0.2, reflectionMap, diffuseMap ));
    var numMeshes = this.options.numMeshes;
    for(var i=0; i<numMeshes; i++) {
      var pos = gridPos(i, numMeshes, this.options.matrixRadius, this.options.matrixRadius);
      pos.y = 1;
      var color = new Color(2, 0, 0.3, 1.0);
      //color = Color.fromHSL(geom.randomFloat(0, 0.2), 0.9, 0.5);
      this.scene.add(new PointLight(pos, color, this.options.lightRadius, this.options.lightBrightness));
    }
  },
  initGUI: function() {
    this.gui.addParam('Debug', this.options, 'debug');
    this.gui.addParam('Exposure', this.renderer, 'exposure', { min: 0.5, max: 3 });
    this.gui.addParam('Contrast', this.renderer, 'contrast', { min: 0.5, max: 3 });
    this.gui.addParam('SSAO', this.renderer, 'ssao', { min: 0, max: 10 });
    this.gui.addParam('Num lights', this.options, 'numLights', { min: 0, max: 1 });
    this.gui.addParam('Ambient light', this.options, 'ambientLightIntensity', { min: 0, max: 5 });
    this.gui.addParam('Light radius', this.options, 'lightRadius', { min: 1, max: 10 });
    this.gui.addParam('Light brightness', this.options, 'lightBrightness', { min: 0, max: 5 });
    this.gui.addParam('Light Y', this.options, 'lightHeight', { min: -2, max: 5 });
    this.gui.addParam('Light XZ', this.options, 'lightXZ', { min: 0.01, max: 2 });
    this.gui.addParam('Light Color', this.options, 'lightColor');
    this.gui.addParam('Mesh Color', this.options, 'meshColor');
    this.gui.addParam('Material', this.options, 'materialMode', { min: 0, max: 3, step: 1 });
    this.gui.addParam('Layout', this.options, 'layoutMode', { min: 0, max: 2, step: 1 });
  },
  update: function () {
    this.renderer.debug = this.options.debug;

    var i = 0;
    this.scene.getLights().forEach(function(light) {
      if (light instanceof PointLight) {
        var r = this.options.lightRadius;
        var dist = Math.max(Math.abs(light.position.x), Math.abs(light.position.z));
        if (dist > this.options.numLights * this.options.matrixRadius) {
          r = 0.01;
        }
        light.setRadius(r);
        var numMeshes = this.options.numMeshes;
        light.setBrightness(this.options.lightBrightness);
        var pos = gridPos(i, numMeshes, this.options.lightXZ * this.options.matrixRadius, this.options.lightXZ * this.options.matrixRadius);
        pos.y = this.options.lightHeight;
        light.setPosition(pos);
        light.setColor(this.options.lightColor);
        light.material.uniforms.color = light.color;
        i++;
      }
      if (light instanceof GlobalLight) {
        light.setIntensity(this.options.ambientLightIntensity);
      }
    }.bind(this));

    var i = 0;
    var meshHSL = this.options.meshColor.getHSL();
    this.scene.getMeshes().forEach(function(m) {
      if (m.materials) {
        m.materials[0].uniforms.color.setHSL((m.hue + meshHSL.h) % 1, meshHSL.s, meshHSL.l, m.roughness);
        m.setMaterial(m.materials[this.options.materialMode]);
        if (this.options.layoutMode != this.options.prevLayoutMode) {
          if (this.options.layoutMode == 0) {
            var pos = gridPos(i, this.options.numMeshes, this.options.matrixRadius, this.options.matrixRadius);
            m.position.setVec3(pos);
            m.rotation.identity();
          }
          else if (this.options.layoutMode == 1) {
            var t = 1.0 -i / this.options.numMeshes;
            m.position.set(
              2 * Math.cos(t * Math.PI * 4),
              -1 + 2 * t,
              2 * Math.sin(t * Math.PI * 4)
            );
            m.rotation = Quat.fromDirection(m.position.dup().normalize());
          }
          else if (this.options.layoutMode == 2) {
            m.position.setVec3(geom.randomVec3());
            m.rotation = Quat.fromDirection(geom.randomVec3());
          }
        }
        i++;
      }
    }.bind(this));
    this.options.prevLayoutMode = this.options.layoutMode;
  },
  draw: function() {
    Time.verbose = true;

    glu.clearColorAndDepth(Color.Black);

    this.update();
    this.renderer.draw(this.scene, this.width, this.height);

    this.gui.draw();
  }
});
