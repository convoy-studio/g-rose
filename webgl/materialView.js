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

var Sphere = gen.Sphere;
var Mesh = glu.Mesh;
var Texture2D = glu.Texture2D;
var Vec3 = geom.Vec3;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Color = color.Color;
var Platform = sys.Platform;
var RoseMaterial = require('./materials/RoseMaterial');
var UberMaterial = require('./materials/UberMaterial');

var ASSETS_URL = Platform.isBrowser ? '/assets/' : '../server/public/assets/';

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16)/255,
    g: parseInt(result[2], 16)/255,
    b: parseInt(result[3], 16)/255
  } : null;
}

function makeView(maturl, patternurl) {
  return {
    settings: {
      width: 512,
      height: 512,
      type: '3d',
      preserveDrawingBuffer: true
    },
    init: function() {
      var g = new Sphere();

      this.material = new UberMaterial({
        skinned: false,
        correctGamma: false,
        showNormals: false,
        color: Color.White,
        fakeLights: false,
        matCapTexture: maturl ? Texture2D.load(maturl) : null,
        triPlanarTexture: patternurl ? Texture2D.load(patternurl) : null,
        triPlanarScale: 5,
        roughness: 1
      });
      this.mesh = new Mesh(g, this.material);

      this.camera = new PerspectiveCamera(60, this.width / this.height);
      this.camera.setPosition(new Vec3(0, 0, 2))
      this.arcball = new Arcball(this, this.camera);
      this.arcball.allowZooming = false;
      this.materialType='flat';
      this.textureUrl = "";

      this.bgColor = new Color(0, 0, 0, 0);
    },
    draw: function() {
      glu.clearColorAndDepth(this.bgColor);
      this.gl.disable(this.gl.CULL_FACE);
      var gl = this.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      glu.enableDepthReadAndWrite(true);
      this.mesh.draw(this.camera);
    },
    newMaterial: function(patternurl, maturl,lights ) {
      var newmaterial = new UberMaterial({
        skinned: false,
        correctGamma: true,
        showNormals: false,
        color: Color.White, 
        //tintColor: Color.fromHSL(hsl[0],hsl[1],hsl[2], 0.5),
        fakeLights: lights,
        matCapTexture: maturl ? Texture2D.load(maturl) : null,
        triPlanarTexture: patternurl ? Texture2D.load(patternurl) : null,
        triPlanarScale: 1,
        roughness: 1,

      });
      this.material.program.dispose();
      this.material = newmaterial;
      this.mesh.setMaterial(this.material);
      this.textureUrl = patternurl;
    },
    setColor: function(hsl) {
      this.material.uniforms.color = Color.fromHSL(hsl[0],hsl[1],hsl[2], 0.5);
      this.material.uniforms.tintColor = Color.fromHSL(hsl[0],hsl[1],hsl[2], 1);
    },
    setMaterial: function(type) {
      this.materialType = type;
      switch(type) {
        case 'flat':
          this.material.uniforms.roughness= 0.65; 
          break;
        case 'matte':
          this.material.uniforms.roughness= 1;
          break;
        case 'glossy':
          this.material.uniforms.roughness= 0.4;
          break;
      }
    },
    setMatCap: function(url) {
      this.material.uniforms.matCapTexture.dispose();
      this.material.uniforms.matCapTexture= Texture2D.load(url);;

    },
    setImage: function(url) {
      this.textureUrl = url;
      if (url) {
        this.material.uniforms.triPlanarTexture = Texture2D.load(url);
        //this.material.uniforms.useTexture = true;
        this.material.uniforms.triPlanarScale=5;
      }
      else {
        if (this.material.uniforms.triPlanarTexture) {
          this.material.uniforms.triPlanarTexture.dispose();
          this.material.uniforms.triPlanarTexture = null;
        }
        //this.material.uniforms.useTexture = false;
      }
    },
    toggleLights: function(state) {
      this.fakeLights = state;
    },
    getMaterial: function() {
      return this.materialType;
    },
    getImage: function() {
      return this.textureUrl;
    }
  };
}

if (Platform.isPlask) {
  var view = makeView(null, ASSETS_URL + "textures/argyle.png");
  //var view = makeView(ASSETS_URL + "textures/matcaps_extact/Ice.png");
  sys.Window.create(view);

  view.setColor("#FF0000");
  view.setMaterial("flat");
  view.setMaterial("matte");
  view.setMaterial("glossy");
  //view.setImage(ASSETS_URL + "textures/pattern_4.jpg");
}

if (Platform.isBrowser) {
  window.MaterialPreview = function(canvasId, maturl, patternurl) {
    var canvas = document.getElementById(canvasId);
    var view = makeView(maturl, patternurl);
    view.settings.canvas = canvas;
    view.settings.width = canvas.clientWidth;
    view.settings.height = canvas.clientHeight;
    sys.Window.create(view);

    canvas.style.backgroundColor = 'transparent';
    this.newMaterial = view.newMaterial.bind(view);
    this.setColor = view.setColor.bind(view);
    this.setMaterial = view.setMaterial.bind(view);
    this.setMatCap = view.setMatCap.bind(view);
    this.setImage = view.setImage.bind(view);
    this.getMaterial = view.getMaterial.bind(view);
    this.getImage = view.getImage.bind(view);
    this.setBGColor = function(color) {
      canvas.style.backgroundColor = color;
    }
  }
}

