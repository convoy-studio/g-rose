(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./materialView.js":[function(require,module,exports){
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


},{"./materials/RoseMaterial":"/Users/Mary/Documents/var-rose/webgl/materials/RoseMaterial.js","./materials/UberMaterial":"/Users/Mary/Documents/var-rose/webgl/materials/UberMaterial.js","./pbr":"/Users/Mary/Documents/var-rose/webgl/pbr/index.js","./utils/ColorUtils":"/Users/Mary/Documents/var-rose/webgl/utils/ColorUtils.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-fx":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js","pex-gen":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","pex-gui":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/index.js","pex-materials":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/index.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/fx/Contrast.js":[function(require,module,exports){
(function (__dirname){
var fx = require('pex-fx');
var FXStage = fx.FXStage;


var ContrastGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\nuniform float contrast;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord).rgba;\n  gl_FragColor.rgb = (color.rgb - 0.5) * contrast + 0.5;\n  gl_FragColor.a = color.a;\n}\n\n#endif";

FXStage.prototype.contrast = function (options) {
  options = options || { contrast: 1 };
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  var program = this.getShader(ContrastGLSL);
  program.use();
  program.uniforms.tex0(0);
  program.uniforms.contrast(options.contrast);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'contrast');
};

module.exports = FXStage;
}).call(this,"/fx")
},{"pex-fx":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js"}],"/Users/Mary/Documents/var-rose/webgl/fx/Fog.js":[function(require,module,exports){
(function (__dirname){
var fx = require('pex-fx');
var FXStage = fx.FXStage;
var geom = require('pex-geom')
var Vec2 = geom.Vec2;


var FogGLSL = "//based on http://blenderartists.org/forum/showthread.php?184102-nicer-and-faster-SSAO and http://www.pasteall.org/12299\n#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D colorMap;\nuniform sampler2D depthMap;\nuniform float near;\nuniform float far;\nuniform float fov;\nuniform float aspectRatio;\nuniform vec4 fogColor;\nuniform float fogDensity;\nuniform float fogStart;\nuniform float fogEnd;\n\nconst float PI = 3.14159265358979323846;\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToEyeSpace(float ndcDepth) {\n  return 2.0 * near * far / (far + near - ndcDepth * (far - near));\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(sampler2D depthMap, vec2 coord) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  return ndcDepthToEyeSpace(z_n);\n}\n\nvec3 getFarViewDir(vec2 tc) {\n  float hfar = 2.0 * tan(fov/2.0/180.0 * PI) * far;\n  float wfar = hfar * aspectRatio;\n  vec3 dir = (vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far));\n  return dir;\n}\n\nvec3 getViewRay(vec2 tc) {\n  vec3 ray = normalize(getFarViewDir(tc));\n  return ray;\n}\n\n//asumming z comes from depth buffer (ndc coords) and it's not a linear distance from the camera but\n//perpendicular to the near/far clipping planes\n//http://mynameismjp.wordpress.com/2010/09/05/position-from-depth-3/\n//assumes z = eye space z\nvec3 reconstructPositionFromDepth(vec2 texCoord, float z) {\n  vec3 ray = getFarViewDir(texCoord);\n  vec3 pos = ray;\n  return pos * z / far;\n}\n\nvoid main() {\n  //float z = readDepth(depthMap, vTexCoord)/far;\n  float z = texture2D(depthMap, vTexCoord).r;\n  vec4 pixelColor = texture2D(colorMap, vTexCoord);\n\n  const float LOG2 = 1.442695;\n  float d = (z - fogStart)/(fogEnd-fogStart);\n  d = clamp(d, 0.0, 1.0);\n  //float fogFactor = exp2( -fogDensity * fogDensity * d * d * LOG2 );\n  //float fogFactor = 1.0 - clamp( exp(-fogDensity * d), 0.0, 1.0);\n  float fogFactor = 1.0 - clamp(exp(-pow(fogDensity*d, 2.0)), 0.0, 1.0);\n  //fogFactor = clamp(fogFactor, 0.0, 1.0);\n\n  //gl_FragColor = vec4((depth-near)/(far-near));\n  gl_FragColor = mix(pixelColor, pow(fogColor, vec4(2.2)), fogFactor);\n\n  //gl_FragColor = vec4(fogFactor);\n  //gl_FragColor = vec4(d);\n}\n\n#endif";

FXStage.prototype.fog = function (options) {
  options = options || { };
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  var depthMap = this.getSourceTexture(options.depthMap);
  depthMap.bind(1);
  var program = this.getShader(FogGLSL);
  program.use();
  program.uniforms.colorMap(0);
  program.uniforms.depthMap(1);
  if (program.uniforms.near) program.uniforms.near(options.camera.getNear());
  if (program.uniforms.far) program.uniforms.far(options.camera.getFar());
  if (program.uniforms.aspectRatio) program.uniforms.aspectRatio(options.camera.getAspectRatio());
  if (program.uniforms.fov) program.uniforms.fov(options.camera.getFov());
  //program.uniforms.strength(options.strength === null ? 1 : options.strength);
  program.uniforms.fogColor(options.color);
  program.uniforms.fogDensity(options.fogDensity);
  program.uniforms.fogStart(options.fogStart);
  program.uniforms.fogEnd(options.fogEnd);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'fog');
};

module.exports = FXStage;
}).call(this,"/fx")
},{"pex-fx":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/fx/FogBox.js":[function(require,module,exports){
(function (__dirname){
var fx = require('pex-fx');
var FXStage = fx.FXStage;
var geom = require('pex-geom')
var Vec2 = geom.Vec2;


var FogBoxGLSL = "//based on http://blenderartists.org/forum/showthread.php?184102-nicer-and-faster-SSAO and http://www.pasteall.org/12299\n#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nuniform mat4 viewMatrix;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform mat4 invViewMatrix;\nuniform sampler2D colorMap;\nuniform sampler2D depthMap;\nuniform float near;\nuniform float far;\nuniform float fov;\nuniform float aspectRatio;\nuniform vec4 fogColor;\nuniform float fogDensity;\nuniform float fogStart;\nuniform float fogEnd;\nuniform vec3 fogBoundingBoxMin;\nuniform vec3 fogBoundingBoxMax;\n\nconst float PI = 3.14159265358979323846;\n\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToEyeSpace(float ndcDepth) {\n  return 2.0 * near * far / (far + near - ndcDepth * (far - near));\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(sampler2D depthMap, vec2 coord) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  return ndcDepthToEyeSpace(z_n);\n}\n\nvec3 getFarViewDir(vec2 tc) {\n  float hfar = 2.0 * tan(fov/2.0/180.0 * PI) * far;\n  float wfar = hfar * aspectRatio;\n  vec3 dir = (vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far));\n  return dir;\n}\n\nvec3 getViewRay(vec2 tc) {\n  vec3 ray = normalize(getFarViewDir(tc));\n  return ray;\n}\n\n//asumming z comes from depth buffer (ndc coords) and it's not a linear distance from the camera but\n//perpendicular to the near/far clipping planes\n//http://mynameismjp.wordpress.com/2010/09/05/position-from-depth-3/\n//assumes z = eye space z\nvec3 reconstructPositionFromDepth(vec2 texCoord, float z) {\n  vec3 ray = getFarViewDir(texCoord);\n  vec3 pos = ray;\n  return pos * z / far;\n}\n\nfloat getFogDistanceCircle(vec3 position) {\n  vec3 fogCenter = (fogBoundingBoxMin + fogBoundingBoxMax) / 2.0;\n  float rX = abs(fogBoundingBoxMax.x - fogBoundingBoxMin.x) / 2.0;\n  float rZ = abs(fogBoundingBoxMax.z - fogBoundingBoxMin.z) / 2.0;\n  float dist = length(position - fogCenter);\n\n  float shortestDistance = min(rX, rZ);\n  dist = dist/shortestDistance;\n  dist = (dist - fogStart)/(fogEnd - fogStart);\n  dist = clamp(dist, 0.0, 1.0);\n  return dist;\n}\n\nfloat getFogDistanceRect(vec3 position) {\n  vec3 fogCenter = (fogBoundingBoxMin + fogBoundingBoxMax) / 2.0;\n  float rX = abs(fogBoundingBoxMax.x - fogBoundingBoxMin.x) / 2.0;\n  float rZ = abs(fogBoundingBoxMax.z - fogBoundingBoxMin.z) / 2.0;\n  vec3 diff = abs(position - fogCenter);\n\n  float dist = max(diff.x/rX, diff.z/rZ);\n  dist = (dist - fogStart)/(fogEnd - fogStart);\n  dist = clamp(dist, 0.0, 1.0);\n  return dist;\n}\n\nvoid main() {\n  float z = readDepth(depthMap, vTexCoord);\n  //float z = texture2D(depthMap, vTexCoord).r;\n  vec4 pixelColor = texture2D(colorMap, vTexCoord);\n\n  const float LOG2 = 1.442695;\n  //float d = (z - fogStart)/(fogEnd-fogStart);\n  //d = clamp(d, 0.0, 1.0);\n\n  vec3 ecPos = reconstructPositionFromDepth(vTexCoord, z);\n  vec3 worldPos = vec3(invViewMatrix * vec4(ecPos, 1.0));\n  float d = getFogDistanceRect(worldPos);\n\n  //float fogFactor = exp2( -fogDensity * fogDensity * d * d * LOG2 );\n  //float fogFactor = 1.0 - clamp( exp(-fogDensity * d), 0.0, 1.0);\n  float fogFactor = 1.0 - clamp(exp(-pow(fogDensity*d, 2.0)), 0.0, 1.0);\n\n  //fogFactor = clamp((fogFactor-fogStart)/(fogEnd-fogStart), 0.0, 1.0);\n\n  //gl_FragColor = vec4((depth-near)/(far-near));\n  gl_FragColor = mix(pixelColor, pow(fogColor, vec4(2.2)), fogFactor);\n\n  //gl_FragColor = vec4(fogFactor);\n  //gl_FragColor = vec4(ecPos.xyz/50.0, 1.0);\n  //gl_FragColor = vec4(worldPos.xyz/50.0, 1.0);\n  //gl_FragColor = vec4(vTexCoord, 0.0, 1.0);\n  //gl_FragColor = vec4(reconstructPositionFromDepth(vTexCoord, z), 1.0);\n\n  //gl_FragColor = vec4(z / 50.0);\n}\n\n#endif";

FXStage.prototype.fogBox = function (options) {
  options = options || { };
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  var depthMap = this.getSourceTexture(options.depthMap);
  depthMap.bind(1);
  var program = this.getShader(FogBoxGLSL);
  program.use();
  program.uniforms.colorMap(0);
  program.uniforms.depthMap(1);
  if (program.uniforms.near) program.uniforms.near(options.camera.getNear());
  if (program.uniforms.far) program.uniforms.far(options.camera.getFar());
  if (program.uniforms.aspectRatio) program.uniforms.aspectRatio(options.camera.getAspectRatio());
  if (program.uniforms.fov) program.uniforms.fov(options.camera.getFov());
  //program.uniforms.strength(options.strength === null ? 1 : options.strength);
  if (program.uniforms.fogColor) program.uniforms.fogColor(options.color);
  if (program.uniforms.fogDensity) program.uniforms.fogDensity(options.fogDensity);
  if (program.uniforms.fogStart) program.uniforms.fogStart(options.fogStart);
  if (program.uniforms.fogEnd) program.uniforms.fogEnd(options.fogEnd);
  if (program.uniforms.fogBoundingBoxMin) program.uniforms.fogBoundingBoxMin(options.fogBoundingBox.min);
  if (program.uniforms.fogBoundingBoxMax) program.uniforms.fogBoundingBoxMax(options.fogBoundingBox.max);
  if (program.uniforms.invViewMatrix) program.uniforms.invViewMatrix(options.camera.getViewMatrix().dup().invert());
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'fogBox');
};

module.exports = FXStage;
}).call(this,"/fx")
},{"pex-fx":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/fx/SSAO.js":[function(require,module,exports){
(function (__dirname){
var fx = require('pex-fx');
var FXStage = fx.FXStage;
var geom = require('pex-geom')
var Vec2 = geom.Vec2;


var SSAOGLSL = "//based on http://blenderartists.org/forum/showthread.php?184102-nicer-and-faster-SSAO and http://www.pasteall.org/12299\n#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\n#define PI    3.14159265\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D depthMap;\nuniform vec2 textureSize;\nuniform float near;\nuniform float far;\n\nconst int samples = 3;\nconst int rings = 5;\n\nuniform float strength;\nuniform float cutoutBg;\n\nvec2 rand(vec2 coord) {\n  float noiseX = (fract(sin(dot(coord, vec2(12.9898,78.233))) * 43758.5453));\n  float noiseY = (fract(sin(dot(coord, vec2(12.9898,78.233) * 2.0)) * 43758.5453));\n  return vec2(noiseX,noiseY) * 0.004;\n}\n\nfloat compareDepths( in float depth1, in float depth2 )\n{\n  float aoCap = 1.0;\n  float aoMultiplier = 100.0;\n  float depthTolerance = 0.0001;\n  float aorange = 10.0;// units in space the AO effect extends to (this gets divided by the camera far range\n  float diff = sqrt(clamp(1.0-(depth1-depth2) / (aorange/(far-near)),0.0,1.0));\n  float ao = min(aoCap, max(0.0, depth1-depth2-depthTolerance) * aoMultiplier) * diff;\n  //if (diff > depthTolerance * 500) return 0;\n  return ao * strength;\n}\n\nfloat readDepth(vec2 coord) {\n  return texture2D(depthMap, coord).a/far;\n}\n\nvoid main() {\n  vec2 texCoord = vec2(gl_FragCoord.x / textureSize.x, gl_FragCoord.y / textureSize.y);\n  float depth = readDepth(texCoord);\n\n  float d;\n\n  float aspect = textureSize.x / textureSize.y;\n  vec2 noise = rand(vTexCoord);\n\n  float w = (1.0 / textureSize.x)/clamp(depth,0.05,1.0)+(noise.x*(1.0-noise.x));\n  float h = (1.0 / textureSize.y)/clamp(depth,0.05,1.0)+(noise.y*(1.0-noise.y));\n\n  float pw;\n  float ph;\n\n  float ao = 0.0;\n  float s = 0.0;\n  float fade = 4.0;\n\n  for (int i = 0 ; i < rings; i += 1)\n  {\n    fade *= 0.5;\n    for (int j = 0 ; j < samples*rings; j += 1)\n    {\n      if (j >= samples*i) break;\n      float step = PI * 2.0 / (float(samples) * float(i));\n      pw = (cos(float(j)*step) * float(i) * 0.5);\n      ph = (sin(float(j)*step) * float(i) * 0.5) * aspect;\n      d = readDepth( vec2(texCoord.s + pw * w,texCoord.t + ph * h));\n      ao += compareDepths(depth, d) * fade;\n      s += 1.0 * fade;\n    }\n  }\n\n  ao /= s;\n  ao *= 1.5;\n  ao = 1.0 - ao;\n\n  if (depth > 0.99) ao += 0.5;\n\n  vec3 black = vec3(0.0, 0.0, 0.0);\n  vec3 treshold = vec3(0.2, 0.2, 0.2);\n\n  gl_FragColor = vec4(texCoord, 0.0, 1.0);\n  //gl_FragColor = vec4(getDepth(texCoord), 0.0, 0.0, 1.0);\n  gl_FragColor = vec4(ao, ao, ao, 1.0);\n\n  if (depth*cutoutBg > 0.5) gl_FragColor = vec4(0.0);\n}\n\n#endif";

FXStage.prototype.ssao = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  var depthMap = this.getSourceTexture(options.depthMap);
  depthMap.bind(0);
  var program = this.getShader(SSAOGLSL);
  program.use();
  program.uniforms.textureSize(Vec2.create(depthMap.width, depthMap.height));
  program.uniforms.depthMap(0);
  program.uniforms.near(options.camera.getNear());
  program.uniforms.far(options.camera.getFar());
  program.uniforms.strength(options.strength === null ? 1 : options.strength);
  program.uniforms.cutoutBg(options.cutoutBg ? 1 : 0);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'ssao');
};

module.exports = FXStage;
}).call(this,"/fx")
},{"pex-fx":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/fx/ShadowMap.js":[function(require,module,exports){
(function (__dirname){
var fx = require('pex-fx');
var FXStage = fx.FXStage;
var geom = require('pex-geom')
var Vec2 = geom.Vec2;


var ShadowMapGLSL = "//based on http://blenderartists.org/forum/showthread.php?184102-nicer-and-faster-SSAO and http://www.pasteall.org/12299\n#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D colorMap;\nuniform sampler2D depthMap;\nuniform sampler2D normalMap;\nuniform float camNear;\nuniform float camFar;\nuniform float camFov;\nuniform float camAspectRatio;\nuniform mat4 camViewMatrix;\nuniform mat4 camInvViewMatrix;\nuniform mat4 camProjectionMatrix;\n\nuniform sampler2D lightDepthMap;\nuniform float lightNear;\nuniform float lightFar;\nuniform float lightFov;\nuniform float lightAspectRatio;\nuniform mat4 lightViewMatrix;\nuniform mat4 lightProjectionMatrix;\nuniform vec3 lightPos;\n\nconst float PI = 3.14159265358979323846;\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToEyeSpace(float ndcDepth, float near, float far) {\n  return 2.0 * near * far / (far + near - ndcDepth * (far - near));\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(sampler2D depthMap, vec2 coord, float near, float far) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  return ndcDepthToEyeSpace(z_n, near, far);\n}\n\nvec3 getFarViewDir(vec2 tc, float fov, float aspectRatio, float far) {\n  float hfar = 2.0 * tan(fov/2.0/180.0 * PI) * far;\n  float wfar = hfar * aspectRatio;\n  vec3 dir = (vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far));\n  return dir;\n}\n\nvec3 getViewRay(vec2 tc, float fov, float aspectRatio, float far) {\n  vec3 ray = normalize(getFarViewDir(tc, fov, aspectRatio, far));\n  return ray;\n}\n\n//asumming z comes from depth buffer (ndc coords) and it's not a linear distance from the camera but\n//perpendicular to the near/far clipping planes\n//http://mynameismjp.wordpress.com/2010/09/05/position-from-depth-3/\n//assumes z = eye space z\nvec3 reconstructPositionFromDepth(vec2 texCoord, float z, float fov, float aspectRatio, float far) {\n  vec3 ray = getFarViewDir(texCoord, fov, aspectRatio, far);\n  vec3 pos = ray;\n  return pos * z / far;\n}\n\nvec2 ecPosToScreenTexCoord(vec3 ecPos, mat4 projectionMatrix) {\n  vec4 projPos = projectionMatrix * vec4(ecPos, 1.0);\n  return (projPos.xy/projPos.w + 1.0)/2.0;\n}\n\nvoid main() {\n  float ecZ = readDepth(depthMap, vTexCoord, camNear, camFar);\n  vec4 pixelColor = texture2D(colorMap, vTexCoord);\n  vec3 ecN = normalize(texture2D(normalMap, vTexCoord).rgb - 0.5);\n  vec3 ecPos = reconstructPositionFromDepth(vTexCoord, ecZ, camFov, camAspectRatio, camFar);\n  //vec2 pixelCoord = ecPosToScreenTexCoord(ecPos, projectionMatrix);\n  vec4 worldPos = camInvViewMatrix * vec4(ecPos, 1.0);\n\n  vec3 ecLightPos = vec3(camViewMatrix * vec4(lightPos, 1.0));\n  vec3 ecL = normalize(ecLightPos - ecPos);\n\n  vec3 lightecPos = vec3(lightViewMatrix * vec4(worldPos.xyz, 1.0));\n  vec2 lightCoord = ecPosToScreenTexCoord(lightecPos, lightProjectionMatrix);\n  //float lightDepth = texture2D\n  float lightEcZ = readDepth(lightDepthMap, lightCoord, lightNear, lightFar);\n\n  //gl_FragColor = vec4(lightecPos, 1.0);\n  if (lightCoord.x < 0.0) { gl_FragColor = pixelColor; return; }\n  if (lightCoord.x > 1.0) { gl_FragColor = pixelColor; return; }\n  if (lightCoord.y < 0.0) { gl_FragColor = pixelColor; return; }\n  if (lightCoord.y > 1.0) { gl_FragColor = pixelColor; return; }\n\n  float lightDepth1 = lightEcZ / lightFar;\n  float lightDepth2 = -lightecPos.z / lightFar;\n\n  float bias = 0.001;\n  float illuminated = step(lightDepth2, lightDepth1+bias);\n\n  //if (lightEcZ < -lightecPos.z + bias) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//gl_FragColor = pixelColor * 0.5;\n  //else gl_FragColor = gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);;\n\n  float NdotL = dot(ecL, ecN);\n  NdotL = clamp(NdotL, 0.0, 1.0);\n\n  illuminated *= NdotL;\n\n  if (lightCoord.x < 0.2) { illuminated =  1.0 - (1.0 - illuminated) * smoothstep(0.0, 0.2, lightCoord.x); }\n  if (lightCoord.x > 0.8) { illuminated =  1.0 - (1.0 - illuminated) * smoothstep(1.0, 0.8, lightCoord.x); }\n  if (lightCoord.y < 0.2) { illuminated =  1.0 - (1.0 - illuminated) * smoothstep(0.0, 0.2, lightCoord.y); }\n  if (lightCoord.y > 0.8) { illuminated =  1.0 - (1.0 - illuminated) * smoothstep(1.0, 0.8, lightCoord.y); }\n\n  gl_FragColor = pixelColor * (0.1 + 0.9 * illuminated);\n}\n\n#endif";

FXStage.prototype.shadowMap = function (options) {
  options = options || { };
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  var depthMap = this.getSourceTexture(options.depthMap);
  depthMap.bind(1);
  var lightDepthMap = this.getSourceTexture(options.lightDepthMap);
  lightDepthMap.bind(2);
  var normalMap = this.getSourceTexture(options.normalMap);
  normalMap.bind(3);
  var program = this.getShader(ShadowMapGLSL);
  program.use();
  program.uniforms.colorMap(0);
  program.uniforms.depthMap(1);
  program.uniforms.lightDepthMap(2);
  program.uniforms.normalMap(3);
  if (program.uniforms.camNear) program.uniforms.camNear(options.camera.getNear());
  if (program.uniforms.camFar) program.uniforms.camFar(options.camera.getFar());
  if (program.uniforms.camAspectRatio) program.uniforms.camAspectRatio(options.camera.getAspectRatio());
  if (program.uniforms.camFov) program.uniforms.camFov(options.camera.getFov());
  if (program.uniforms.camViewMatrix) program.uniforms.camViewMatrix(options.camera.getViewMatrix());
  if (program.uniforms.camInvViewMatrix) program.uniforms.camInvViewMatrix(options.camera.getViewMatrix().dup().invert());
  if (program.uniforms.camProjectionMatrix) program.uniforms.camProjectionMatrix(options.camera.getProjectionMatrix());
  if (program.uniforms.lightNear) program.uniforms.lightNear(options.lightCamera.getNear());
  if (program.uniforms.lightFar) program.uniforms.lightFar(options.lightCamera.getFar());
  if (program.uniforms.lightAspectRatio) program.uniforms.lightAspectRatio(options.lightCamera.getAspectRatio());
  if (program.uniforms.lightFov) program.uniforms.lightFov(options.lightCamera.getFov());
  if (program.uniforms.lightViewMatrix) program.uniforms.lightViewMatrix(options.lightCamera.getViewMatrix());
  if (program.uniforms.lightProjectionMatrix) program.uniforms.lightProjectionMatrix(options.lightCamera.getProjectionMatrix());
  if (program.uniforms.lightPos) program.uniforms.lightPos(options.lightCamera.getPosition());
  //program.uniforms.strength(options.strength === null ? 1 : options.strength);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'shadowMap');
};

module.exports = FXStage;
}).call(this,"/fx")
},{"pex-fx":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/geom/Rect.js":[function(require,module,exports){
function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.prototype.set = function(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

Rect.prototype.contains = function(point) {
  return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height;
};

Rect.prototype.scaleToFit = function(targetRect) {
  var scale = Math.min(targetRect.width / this.width, targetRect.height / this.height);

  return new Rect(
    targetRect.x + (targetRect.width - scale * this.width)/2,
    targetRect.y + (targetRect.height - scale * this.height)/2,
    scale * this.width,
    scale * this.height
  );
}

module.exports = Rect;
},{}],"/Users/Mary/Documents/var-rose/webgl/materials/RoseMaterial.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var RoseMaterialGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 modelWorldMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 normalMatrix;\nuniform float pointSize;\nuniform vec3 lightPos;\nuniform vec3 cameraPos;\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 texCoord;\nvarying vec3 vNormal;\nvarying vec3 vLightPos;\nvarying vec3 vEyePos;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  vec4 worldPos = modelWorldMatrix * vec4(position, 1.0);\n  vec4 eyePos = modelViewMatrix * vec4(position, 1.0);\n  gl_Position = projectionMatrix * eyePos;\n  vEyePos = eyePos.xyz;\n  gl_PointSize = pointSize;\n  vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;\n  vLightPos = (viewMatrix * vec4(lightPos, 1.0)).xyz;\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nvarying vec3 vNormal;\nvarying vec3 vLightPos;\nvarying vec3 vEyePos;\n\nuniform sampler2D texture;\nuniform vec2 scale;\nuniform vec4 color;\nuniform float shininess;\nuniform float wrap;\nuniform bool useBlinnPhong;\nuniform bool usePhong;\nuniform bool useDiffuse;\nuniform bool useTexture;\n\nfloat phong(vec3 L, vec3 E, vec3 N) {\n  vec3 R = reflect(-L, N);\n  return max(0.0, dot(R, E));\n}\n\nfloat blinnPhong(vec3 L, vec3 E, vec3 N) {\n  vec3 halfVec = normalize(L + E);\n  return max(0.0, dot(halfVec, N));\n}\n\nvoid main() {\n  vec4 baseColor = color;\n\n  if (useTexture) {\n    baseColor = texture2D(texture, vTexCoord) * color;\n  }\n\n  vec4 ambientColor = baseColor * 0.1;\n  vec4 diffuseColor = baseColor * 0.9;\n  vec4 specularColor = vec4(1.0);\n  float finalWrap = wrap;\n\n  if (!useDiffuse) {\n    finalWrap = 0.5;\n    ambientColor = baseColor * 0.5;\n    diffuseColor = baseColor * 0.5;\n  }\n\n  vec3 L = normalize(vLightPos - vEyePos); //lightDir\n  vec3 E = normalize(-vEyePos); //viewDir\n  vec3 N = normalize(vNormal); //normal\n\n  float NdotL = max(0.0, (dot(N, L) + finalWrap) / (1.0 + finalWrap));\n\n  vec4 finalColor = ambientColor + NdotL * diffuseColor;\n\n  float specular = 0.0;\n  if (useBlinnPhong) specular = blinnPhong(L, E, N);\n  if (usePhong) specular = phong(L, E, N);\n\n  finalColor += max(pow(specular, shininess), 0.0) * specularColor;\n\n  gl_FragColor = finalColor;\n  gl_FragColor.a = 1.0;\n}\n\n#endif\n";

function RoseMaterial(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(RoseMaterialGLSL);
  var defaults = {
    color: Color.create(1, 1, 1, 1),
    pointSize: 1,
    premultiplied: 0,
    shininess: 128,
    wrap: 0,
    useBlinnPhong: false,
    usePhong: false,
    useDiffuse: false,
    useTexture: false
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

RoseMaterial.prototype = Object.create(Material.prototype);

module.exports = RoseMaterial;
}).call(this,"/materials")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/materials/UberMaterial.js":[function(require,module,exports){
(function (__dirname){
var merge = require('merge');

var glu = require('pex-glu');
var geom = require('pex-geom');
var color = require('pex-color');
var sg = require('../sg/');
var Material = glu.Material;
var Program = glu.Program;
var Vec3 = geom.Vec3;
var Color = color.Color;

var PositionVert = "attribute vec3 position;\nvarying vec3 ecPosition;\nvarying vec3 mcPosition;\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\n\nvoid main_position(out vec3 positionOut) {\n  positionOut = position;\n  ecPosition = vec3(modelViewMatrix * vec4(position, 1.0));\n  mcPosition = position;\n}";
var PositionFrag = "varying vec3 ecPosition;\nvarying vec3 mcPosition;\n\nvoid main_position(out vec3 positionOut, out vec3 modelPositionOut) {\n  positionOut = ecPosition;\n  modelPositionOut = mcPosition;\n}";
var NormalVert = "attribute vec3 normal;\nuniform mat4 normalMatrix;\n\nvarying vec3 ecNormal;\nvarying vec3 mcNormal;\n\nvoid main_normal() {\n  ecNormal = normalize((normalMatrix * vec4(normal, 1.0)).xyz);\n  mcNormal = normal;\n}";
var NormalFrag = "varying vec3 ecNormal;\nvarying vec3 mcNormal;\n\nvoid main_normal(out vec3 normalOut, out vec3 modelNormal) {\n  normalOut = normalize(ecNormal);\n  modelNormal = normalize(mcNormal);\n}";
var SkinnedVert = "attribute vec3 position;\nattribute vec3 normal;\n\nvarying vec3 ecPosition;\nvarying vec3 mcPosition;\nvarying vec3 ecNormal;\nvarying vec3 mcNormal;\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 normalMatrix;\n\n#define MAX_BONES 32\n\nuniform mat4 boneMatrices[MAX_BONES];\nattribute vec2 skinIndices;\nattribute vec2 skinWeights;\n\nvoid main_skinned(out vec3 positionOut, out vec3 normalOut) {\n  vec4 skinnedPosition = vec4(0.0);\n  vec4 skinnedNormal = vec4(0.0);\n  int idx1 = int(skinIndices.x);\n  int idx2 = int(skinIndices.y);\n\n  for(int i=0; i<MAX_BONES; i++) {\n    if (i == idx1) { skinnedPosition += skinWeights.x * boneMatrices[i] * vec4(position, 1.0); }\n    if (i == idx2) { skinnedPosition += skinWeights.y * boneMatrices[i] * vec4(position, 1.0); }\n    if (i == idx1) { skinnedNormal += skinWeights.x * boneMatrices[i] * vec4(normal, 0.0); }\n    if (i == idx2) { skinnedNormal += skinWeights.y * boneMatrices[i] * vec4(normal, 0.0); }\n  }\n\n  positionOut = skinnedPosition.xyz;\n  normalOut = skinnedNormal.xyz;\n\n  ecPosition = vec3(modelViewMatrix * vec4(skinnedPosition.xyz, 1.0));\n  mcPosition = position.xyz;\n  ecNormal = normalize((normalMatrix * vec4(skinnedNormal.xyz, 1.0)).xyz);\n  mcNormal = normal;\n}";
var SkinnedFrag = "varying vec3 ecPosition;\nvarying vec3 mcPosition;\nvarying vec3 ecNormal;\nvarying vec3 mcNormal;\n\nvoid main_skinned(out vec3 positionOut, out vec3 modelPositionOut, out vec3 normalOut, out vec3 modelNormalOut) {\n  positionOut = ecPosition;\n  modelPositionOut = mcPosition;\n  normalOut = normalize(ecNormal);\n  modelNormalOut = normalize(mcNormal);\n}";
var SolidColorFrag = "uniform vec4 color;\n\nvoid main_solidColor(out vec4 colorOut) {\n  colorOut = color;\n}";
var TintColorFrag = "uniform vec4 tintColor;\n\nvoid main_tintColor(inout vec4 colorOut) {\n  colorOut *= tintColor;\n}";
var ShowNormalsFrag = "void main_showNormals(in vec3 normalIn, out vec4 colorOut) {\n  colorOut = vec4(normalIn * 0.5 + 0.5, 1.0);\n}";
var ShowDepthFrag = "uniform float near;\nuniform float far;\n\n//Z in Normalized Device Coordinates\n//http://www.songho.ca/opengl/gl_projectionmatrix.html\nfloat eyeSpaceDepthToNDC(float zEye) {\n  float A = -(far + near) / (far - near); //projectionMatrix[2].z\n  float B = -2.0 * far * near / (far - near); //projectionMatrix[3].z; //\n\n  float zNDC = (A * zEye + B) / -zEye;\n  return zNDC;\n}\n\n//depth buffer encoding\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToDepthBuf(float zNDC) {\n  return 0.5 * zNDC + 0.5;\n}\n\nvoid main_showDepth(in vec3 positionIn, out vec4 color) {\n  float zEye = positionIn.z;\n  float zNDC = eyeSpaceDepthToNDC(zEye);\n  float zBuf = ndcDepthToDepthBuf(zNDC);\n\n  color = vec4(zBuf);\n}";
var MatCapFrag = "uniform sampler2D matCapTexture;\n\nvoid main_matcap(in vec3 normalIn, in vec3 positionIn, out vec4 color) {\n  vec3 V = normalize(-positionIn); //view vector from point to camera\n  vec3 r = reflect(-V, normalIn);\n  float m = 2.0 * sqrt(\n    pow(r.x, 2.0) +\n    pow(r.y, 2.0) +\n    pow(r.z + 1.0, 2.0)\n  );\n  vec2 N = r.xy / m + 0.5;\n  vec3 base = texture2D( matCapTexture, N ).rgb;\n  color = vec4( base, 1.0 );\n}";
var TexturedTriPlanarFrag = "uniform sampler2D triPlanarTexture;\nuniform float triPlanarScale;\n\nvoid main_texture2D(in vec3 modelNormalIn, in vec3 modelPositionIn, out vec4 color) {\n  vec3 blending = abs( normalize(modelNormalIn) );\n  blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0\n  float b = (blending.x + blending.y + blending.z);\n  blending /= vec3(b, b, b);\n\n  vec4 xaxis = texture2D( triPlanarTexture, fract(modelPositionIn.zy * triPlanarScale));\n  vec4 yaxis = texture2D( triPlanarTexture, fract(modelPositionIn.xz * triPlanarScale));\n  vec4 zaxis = texture2D( triPlanarTexture, fract(modelPositionIn.xy * triPlanarScale));\n  // blend the results of the 3 planar projections.\n  vec4 tex = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;\n\n  color = tex;\n}";
var CubeMapFrag = "uniform samplerCube cubeMap;\nuniform mat4 invViewMatrix;\n\n//Based on\n//http://antongerdelan.net/opengl/cubemaps.html\nvoid main_environmentMap(in vec3 normalIn, in vec3 positionIn, out vec4 colorOut) {\n  vec3 V = normalize(positionIn); //eye dir\n  vec3 R = reflect(V, normalIn); //reflecte vector\n  R = vec3(invViewMatrix * vec4(R, 0.0));\n  colorOut = textureCube(cubeMap, R);\n}";
var EnvMapFrag = "uniform sampler2D envMap;\nuniform mat4 invViewMatrix;\n\n\nvoid main_environmentMap(in vec3 normalIn, in vec3 positionIn, out vec4 colorOut) {\n  vec3 V = normalize(-positionIn); //eye dir\n  vec3 N = reflect(V, normalIn); //reflecte vector\n  N = vec3 (invViewMatrix * vec4(N, 0.0));\n  vec2 coord = vec2((1.0 + atan(-N.z, N.x)/3.14159265359)/2.0, acos(N.y)/3.14159265359);\n  vec4 reflection = texture2D(envMap, coord);\n  colorOut = reflection;\n}";
var EnvMapWithRoughnessFrag = "uniform sampler2D envMapReflection;\nuniform sampler2D envMapDiffuse;\nuniform mat4 invViewMatrix;\nuniform float roughness;\n\nvoid main_environmentMap(in vec3 normalIn, in vec3 positionIn, out vec4 colorOut) {\n  vec3 V = normalize(-positionIn); //eye dir\n  vec3 N = reflect(V, normalIn); //reflecte vector\n  N = vec3 (invViewMatrix * vec4(N, 0.0));\n  vec2 coord = vec2((1.0 + atan(-N.z, N.x)/3.14159265359)/2.0, acos(N.y)/3.14159265359);\n  vec4 reflection = texture2D(envMapReflection, coord);\n  vec4 diffuse = texture2D(envMapDiffuse, coord);\n  colorOut = mix(reflection, diffuse, 1.0 - pow(1.0 - roughness, 4.0));\n}";
var CorrectGammaFrag = "void main_correctGamma(inout vec4 color) {\n  color = pow(color, vec4(2.2));\n}";
var GammaFrag = "void main_gamma(inout vec4 color) {\n  color = pow(color, vec4(1.0/2.2));\n}";
var GGXFrag = "varying vec3 vLightPos;\n\nuniform float roughness; //0.5\nuniform float n0; //0.2\nuniform vec4 specularColor;\n\nfloat G1V(float dotNV, float k) {\n  return 1.0/(dotNV*(1.0-k)+k);\n}\n\nfloat LightingFuncGGX_REF(vec3 N, vec3 V, vec3 L, float roughness, float F0) {\n  float alpha = roughness * roughness;\n\n  //half vector\n  vec3 H = normalize(V+L);\n\n  float dotNL = clamp(dot(N,L), 0.0, 1.0);\n  float dotNV = clamp(dot(N,V), 0.0, 1.0);\n  float dotNH = clamp(dot(N,H), 0.0, 1.0);\n  float dotLH = clamp(dot(L,H), 0.0, 1.0);\n\n  float F, D, vis;\n\n  //microfacet model\n\n  // D - microfacet distribution function, shape of specular peak\n  float alphaSqr = alpha*alpha;\n  float pi = 3.14159;\n  float denom = dotNH * dotNH * (alphaSqr-1.0) + 1.0;\n  D = alphaSqr/(pi * denom * denom);\n\n  // F - fresnel reflection coefficient\n  float dotLH5 = pow(1.0 - dotLH, 5.0);\n  F = F0 + (1.0 - F0) * (dotLH5);\n\n  // V / G - geometric attenuation or shadowing factor\n  float k = alpha / 2.0;\n  vis = G1V(dotNL, k) * G1V(dotNV, k);\n\n  float specular = dotNL * D * F * vis;\n  return specular;\n}\n\nvoid main_GGX(in vec3 normalIn, in vec3 positionIn, inout vec4 color) {\n  vec3 L = normalize(vLightPos - positionIn); //lightDir\n  vec3 V = normalize(-positionIn); //viewDir\n  vec3 N = normalize(normalIn); //normal\n\n  float specular = LightingFuncGGX_REF(N, V, L, roughness, n0);\n\n  color.rgb += vec3(specular) * specularColor.rgb;\n  //color\n}";
var LightVert = "uniform vec3 lightPos; //world coord\nuniform mat4 viewMatrix;\nuniform mat4 modelViewMatrix;\nvarying vec3 vLightPos;\n\nvoid main() {\n  vLightPos = (viewMatrix * vec4(lightPos, 1.0)).xyz;\n}";
var LambertFrag = "varying vec3 vLightPos;\n\nvoid main_lambert(in vec3 positionIn, in vec3 normalIn, inout vec4 color) {\n  vec3 L = normalize(vLightPos - positionIn);\n  float NdotL = max(0.0, dot(normalIn, L));\n  color.rgb *= vec3(NdotL);\n}";
var LambertWrappedFrag = "varying vec3 vLightPos;\n\nuniform float wrap;\n\nvoid main_lambertWrapped(in vec3 positionIn, in vec3 normalIn, inout vec4 color) {\n  vec3 L = normalize(vLightPos - positionIn);\n  float NdotL = max(0.0, (dot(normalIn, L) + wrap)/(1.0 + wrap));\n  color.rgb *= vec3(NdotL);\n}";
var OutputVert = "uniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nvoid main_output(in vec3 positionIn) {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(positionIn, 1.0);\n}\n";
var OutputFrag = "void main_output(in vec4 colorIn) {\n  gl_FragColor = colorIn;\n}";
var SetAlphaFromRoughnessFrag = "uniform float roughness;\n\nvoid main_setAlpha(inout vec4 color) {\n  color.a = roughness;\n}";

function UberMaterial(uniforms) {
  var defaultOptions = {
    skinned: false,
    solidColor: true,
    correctGamma: false,
    roughness: 0.2,
    fakeLights: false,
    color: new Color(1,1,1,1),
    tintColor: new Color(1,1,1,1),
    matCapTexture: null,
    triPlanarTexture: null,
    cubeMap: null,
    envMap: null,
    envMapReflection: null,
    envMapDiffuse: null,
    showNormals: false,
    showDepth: false
  }
  uniforms = merge(defaultOptions, uniforms);

  //console.log(uniforms.roughness)

  var graph = sg.graph();

  if (uniforms.skinned) {
    graph.material(SkinnedVert, SkinnedFrag);
  }
  else {
    graph.material(PositionVert, PositionFrag);
    graph.material(NormalVert, NormalFrag);
  }

  if (uniforms.color) {
    graph.snippet(SolidColorFrag);
  }

  if (uniforms.matCapTexture) {
    graph.snippet(MatCapFrag);
  }

  if (uniforms.triPlanarTexture) {
    graph.snippet(TexturedTriPlanarFrag);
  }

  if (uniforms.cubeMap) {
    graph.snippet(CubeMapFrag);
  }

  if (uniforms.envMap) {
    graph.snippet(EnvMapFrag);
  }

  if (uniforms.envMapReflection && uniforms.envMapDiffuse) {
    graph.snippet(EnvMapWithRoughnessFrag);
  }

  if (uniforms.tintColor) {
    graph.snippet(TintColorFrag);
  }

  if (uniforms.roughness) {
    graph.snippet(SetAlphaFromRoughnessFrag);
  }

  if (uniforms.fakeLights) {
    uniforms.lightPos = new Vec3(-5, 5, 5);
    uniforms.n0 = 0.1;
    uniforms.wrap = 1.0;
    uniforms.specularColor = new Color(0.25, 0.25, 0.25, 0.25);
    graph.material(LightVert, LambertWrappedFrag);
    graph.material(LightVert, GGXFrag);
  }

  if (uniforms.showNormals) {
    graph.snippet(ShowNormalsFrag);
  }

  if (uniforms.showDepth) {
    graph.snippet(ShowDepthFrag);
  }

  if (uniforms.correctGamma) {
    graph.snippet(CorrectGammaFrag);
  }

  graph.material(OutputVert, OutputFrag);

  var program = graph.compile();

  Material.call(this, new Program(program.vertexShader, program.fragmentShader), uniforms);
}

UberMaterial.prototype = Object.create(Material.prototype);


module.exports = UberMaterial;
}).call(this,"/materials")
},{"../sg/":"/Users/Mary/Documents/var-rose/webgl/sg/index.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/lib/_empty.js":[function(require,module,exports){

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/node_modules/path-browserify/index.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/node_modules/process/browser.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/lodash/dist/lodash.js":[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js":[function(require,module,exports){
/*!
 * @name JavaScript/NodeJS Merge v1.1.3
 * @author yeikos
 * @repository https://github.com/yeikos/js.merge

 * Copyright 2014 yeikos - MIT license
 * https://raw.github.com/yeikos/js.merge/master/LICENSE
 */

;(function(isNode) {

	function merge() {

		var items = Array.prototype.slice.call(arguments),
			result = items.shift(),
			deep = (result === true),
			size = items.length,
			item, index, key;

		if (deep || typeOf(result) !== 'object')

			result = {};

		for (index=0;index<size;++index)

			if (typeOf(item = items[index]) === 'object')

				for (key in item)

					result[key] = deep ? clone(item[key]) : item[key];

		return result;

	}

	function clone(input) {

		var output = input,
			type = typeOf(input),
			index, size;

		if (type === 'array') {

			output = [];
			size = input.length;

			for (index=0;index<size;++index)

				output[index] = clone(input[index]);

		} else if (type === 'object') {

			output = {};

			for (index in input)

				output[index] = clone(input[index]);

		}

		return output;

	}

	function typeOf(input) {

		return ({}).toString.call(input).match(/\s([\w]+)/)[1].toLowerCase();

	}

	if (isNode) {

		module.exports = merge;

	} else {

		window.merge = merge;

	}

})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js":[function(require,module,exports){
module.exports.Color = require('./lib/Color');
},{"./lib/Color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/lib/Color.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/lib/Color.js":[function(require,module,exports){
var clamp = function(value, min, max) {
  return Math.max(min, Math.min(value, max));
};

var lerp = function(a, b, t) {
  return a + (b - a) * t;
};

function Color(r, g, b, a) {
  this.r = (r != null) ? r : 0;
  this.g = (g != null) ? g : 0;
  this.b = (b != null) ? b : 0;
  this.a = (a != null) ? a : 1;
}

Color.create = function(r, g, b, a) {
  return new Color(r, g, b, a);
};

Color.fromRGB = Color.create;

Color.fromHSV = function(h, s, v, a) {
  var c = new Color();
  c.setHSV(h, s, v, a);
  return c;
};

Color.fromHSL = function(h, s, l, a) {
  var c = new Color();
  c.setHSL(h, s, l, a);
  return c;
};

Color.prototype.set = function(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = (a != null) ? a : 1;

  return this;
};

Color.prototype.hash = function() {
  return 1 * this.r + 12 * this.g + 123 * this.b + 1234 * this.a;
};

Color.prototype.setHSV = function(h, s, v, a) {
  a = (a != null) ? a : 1;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: this.r = v, this.g = t, this.b = p; break;
    case 1: this.r = q, this.g = v, this.b = p; break;
    case 2: this.r = p, this.g = v, this.b = t; break;
    case 3: this.r = p, this.g = q, this.b = v; break;
    case 4: this.r = t, this.g = p, this.b = v; break;
    case 5: this.r = v, this.g = p, this.b = q; break;
  }

  this.a = a;
  return this;
};

Color.prototype.getHSV = function() {
  var r = this.r;
  var g = this.g;
  var b = this.b;
  var max = Math.max(r, g, b)
  var min = Math.min(r, g, b);
  var h;
  var v = max;
  var d = max - min;
  var s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  }
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h, s: s, v: v, a: this.a };
}

//h 0..1
//s 0..1
//l 0..1
//a 0..1
//https://gist.github.com/mjijackson/5311256
Color.prototype.setHSL = function(h, s, l, a) {
  a = (a != null) ? a : 1;

  if (s == 0) {
    this.r = this.g = this.b = l; // achromatic
  }
  else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    this.r = hue2rgb(p, q, h + 1/3);
    this.g = hue2rgb(p, q, h);
    this.b = hue2rgb(p, q, h - 1/3);
    this.a = a;
  }
};

//https://gist.github.com/mjijackson/5311256
Color.prototype.getHSL = function() {
  var r = this.r;
  var g = this.g;
  var b = this.b;
  var max = Math.max(r, g, b)
  var min = Math.min(r, g, b);
  var l = (max + min) / 2;
  var h;
  var s;

  if (max == min) {
    h = s = 0; // achromatic
  }
  else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return { h: h, s: s, l: l, a: this.a };
};

Color.prototype.copy = function(c) {
  this.r = c.r;
  this.g = c.g;
  this.b = c.b;
  this.a = c.a;

  return this;
};

Color.prototype.clone = function(c) {
  return new Color(this.r, this.g, this.b, this.a);
};

Color.lerp = function(startColor, endColor, t, mode) {
  mode = mode || 'rgb';

  if (mode == 'rgb') {
    return Color.fromRGB(
      lerp(startColor.r, endColor.r, t),
      lerp(startColor.g, endColor.g, t),
      lerp(startColor.b, endColor.b, t),
      lerp(startColor.a, endColor.a, t)
    )
  }
  else if (mode == 'hsv') {
    var startHSV = startColor.getHSV();
    var endHSV = endColor.getHSV();
    return Color.fromHSV(
      lerp(startHSV.h, endHSV.h, t),
      lerp(startHSV.s, endHSV.s, t),
      lerp(startHSV.v, endHSV.v, t),
      lerp(startHSV.a, endHSV.a, t)
    )
  }
  else if (mode == 'hsl') {
    var startHSL = startColor.getHSL();
    var endHSL = endColor.getHSL();
    return Color.fromHSL(
      lerp(startHSL.h, endHSL.h, t),
      lerp(startHSL.s, endHSL.s, t),
      lerp(startHSL.l, endHSL.l, t),
      lerp(startHSL.a, endHSL.a, t)
    )
  }
  else {
    return startColor;
  }
};

Color.Transparent = new Color(0, 0, 0, 0);
Color.None = new Color(0, 0, 0, 0);
Color.Black = new Color(0, 0, 0, 1);
Color.White = new Color(1, 1, 1, 1);
Color.DarkGrey = new Color(0.25, 0.25, 0.25, 1);
Color.Grey = new Color(0.5, 0.5, 0.5, 1);
Color.Red = new Color(1, 0, 0, 1);
Color.Green = new Color(0, 1, 0, 1);
Color.Blue = new Color(0, 0, 1, 1);
Color.Yellow = new Color(1, 1, 0, 1);
Color.Pink = new Color(1, 0, 1, 1);
Color.Cyan = new Color(0, 1, 1, 1);
Color.Orange = new Color(1, 0.5, 0, 1);

module.exports = Color;

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js":[function(require,module,exports){
var FXStage = require('./lib/FXStage');
require('./lib/Render');
require('./lib/Blit');
require('./lib/Add');
require('./lib/Blur3');
require('./lib/Blur5');
require('./lib/Blur');
require('./lib/Downsample2');
require('./lib/Downsample4');
require('./lib/FXAA');
require('./lib/CorrectGamma');
require('./lib/TonemapReinhard');
require('./lib/Save');
require('./lib/Mult');
require('./lib/SSAO');

var globalFx;

module.exports = function() {
  if (!globalFx) {
    globalFx = new FXStage();
  }
  globalFx.reset();
  return globalFx;
};

module.exports.FXStage = FXStage;
},{"./lib/Add":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Add.js","./lib/Blit":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blit.js","./lib/Blur":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blur.js","./lib/Blur3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blur3.js","./lib/Blur5":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blur5.js","./lib/CorrectGamma":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/CorrectGamma.js","./lib/Downsample2":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Downsample2.js","./lib/Downsample4":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Downsample4.js","./lib/FXAA":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXAA.js","./lib/FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","./lib/Mult":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Mult.js","./lib/Render":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Render.js","./lib/SSAO":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/SSAO.js","./lib/Save":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Save.js","./lib/TonemapReinhard":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/TonemapReinhard.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Add.js":[function(require,module,exports){
(function (__dirname){
var FXStage = require('./FXStage');


var AddGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\nuniform sampler2D tex1;\nuniform float scale;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord).rgba;\n  vec4 color2 = texture2D(tex1, vTexCoord).rgba;\n\n  //color += scale * color2 * color2.a;\n\n  gl_FragColor = 1.0 - (1.0 - color) * (1.0 - color2 * scale);\n\n  //gl_FragColor.rgba = color + scale * color2;\n  //gl_FragColor.a = 1.0;\n}\n\n#endif";

FXStage.prototype.add = function (source2, options) {
  options = options || {};
  scale = options.scale !== undefined ? options.scale : 1;
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  this.getSourceTexture(source2).bind(1);
  var program = this.getShader(AddGLSL);
  program.use();
  program.uniforms.tex0(0);
  program.uniforms.tex1(1);
  program.uniforms.scale(scale);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'add');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blit.js":[function(require,module,exports){
var FXStage = require('./FXStage');

FXStage.prototype.blit = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var x = options.x || 0;
  var y = options.y || 0;
  this.drawFullScreenQuadAt(x, y, outputSize.width, outputSize.height, this.getSourceTexture());
  return this;
};

module.exports = FXStage;
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blur.js":[function(require,module,exports){
(function (__dirname){
var geom  = require('pex-geom');
var Vec2 = geom.Vec2;
var FXStage = require('./FXStage');


var BlurHGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\nuniform float amount;\n\nvec4 gauss(sampler2D image, vec2 texel, float amount) {\n  vec4 color = vec4(0.0);\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x * -2.0 * amount, 0.0));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x * -1.0 * amount, 0.0));\n  color += 6.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  0.0 * amount, 0.0));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  1.0 * amount, 0.0));\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  2.0 * amount, 0.0));\n  return color;\n}\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = gauss(image, texel, amount);\n  gl_FragColor = color;\n}\n\n#endif\n";
var BlurVGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\nuniform float amount;\n\nvec4 gauss(sampler2D image, vec2 texel, float amount) {\n  vec4 color = vec4(0.0);\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -2.0 * amount));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -1.0 * amount));\n  color += 6.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  0.0 * amount));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  1.0 * amount));\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  2.0 * amount));\n  return color;\n}\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = gauss(image, texel, amount);\n  gl_FragColor = color;\n}\n\n#endif\n";

FXStage.prototype.blur = function (options) {
  options = options || {};
  var amount = (typeof(options.amount) != 'undefined') ? options.amount : 1;
  var outputSize = this.getOutputSize(options.width, options.height);
  var rth = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var rtv = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var source = this.getSourceTexture();
  var programH = this.getShader(BlurHGLSL);
  programH.use();
  programH.uniforms.imageSize(Vec2.create(source.width, source.height));
  programH.uniforms.amount(amount);
  rth.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, source, programH);
  rth.unbind();
  var programV = this.getShader(BlurVGLSL);
  programV.use();
  programV.uniforms.imageSize(Vec2.create(source.width, source.height));
  programV.uniforms.amount(amount);
  rtv.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, rth.getColorAttachment(0), programV);
  rtv.unbind();
  return this.asFXStage(rtv, 'blur');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blur3.js":[function(require,module,exports){
(function (__dirname){
var geom  = require('pex-geom');
var Vec2 = geom.Vec2;
var FXStage = require('./FXStage');


var Blur3HGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = vec4(0.0);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(texel.x * -1.0, 0.0));\n  color += 0.50 * texture2D(image, vTexCoord);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(texel.x *  1.0, 0.0));\n  gl_FragColor = color;\n}\n\n#endif\n";
var Blur3VGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = vec4(0.0);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -1.0));\n  color += 0.50 * texture2D(image, vTexCoord);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  1.0));\n  gl_FragColor = color;\n}\n\n#endif\n";

FXStage.prototype.blur3 = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rth = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var rtv = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var source = this.getSourceTexture();
  var programH = this.getShader(Blur3HGLSL);
  programH.use();
  programH.uniforms.imageSize(Vec2.create(source.width, source.height));
  rth.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, source, programH);
  rth.unbind();
  var programV = this.getShader(Blur3VGLSL);
  programV.use();
  programV.uniforms.imageSize(Vec2.create(source.width, source.height));
  rtv.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, rth.getColorAttachment(0), programV);
  rtv.unbind();
  return this.asFXStage(rtv, 'blur3');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Blur5.js":[function(require,module,exports){
(function (__dirname){
var geom  = require('pex-geom');
var Vec2 = geom.Vec2;
var FXStage = require('./FXStage');


var Blur5HGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = vec4(0.0);\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x * -2.0, 0.0));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x * -1.0, 0.0));\n  color += 6.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  0.0, 0.0));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  1.0, 0.0));\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  2.0, 0.0));\n  gl_FragColor = color;\n}\n\n#endif\n";
var Blur5VGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = vec4(0.0);\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -2.0));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -1.0));\n  color += 6.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  0.0));\n  color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  1.0));\n  color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  2.0));\n  gl_FragColor = color;\n}\n\n#endif\n";

FXStage.prototype.blur5 = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rth = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var rtv = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var source = this.getSourceTexture();
  var programH = this.getShader(Blur5HGLSL);
  programH.use();
  programH.uniforms.imageSize(Vec2.create(source.width, source.height));
  rth.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, source, programH);
  rth.unbind();
  var programV = this.getShader(Blur5VGLSL);
  programV.use();
  programV.uniforms.imageSize(Vec2.create(source.width, source.height));
  rtv.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, rth.getColorAttachment(0), programV);
  rtv.unbind();
  return this.asFXStage(rtv, 'blur5');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/CorrectGamma.js":[function(require,module,exports){
(function (__dirname){
var FXStage = require('./FXStage');


var CorrectGammaGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord).rgba;\n  vec3 retColor = pow(color.rgb, vec3(1.0/2.2)); //map gamma\n  gl_FragColor.rgb = retColor;\n  gl_FragColor.a = 1.0;\n}\n\n#endif";

FXStage.prototype.correctGamma = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  var program = this.getShader(CorrectGammaGLSL);
  program.use();
  program.uniforms.tex0(0);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'correctGamma');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Downsample2.js":[function(require,module,exports){
(function (__dirname){
var geom  = require('pex-geom');
var Vec2 = geom.Vec2;
var FXStage = require('./FXStage');


var Downsample2GLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n  vec4 color = vec4(0.0);\n  color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y * -1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y * -1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y *  0.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y *  0.0));\n  gl_FragColor = color / 4.0;\n}\n\n#endif";

FXStage.prototype.downsample2 = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  outputSize.width /= 2;
  outputSize.height /= 2;
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var source = this.getSourceTexture();
  var program = this.getShader(Downsample2GLSL);
  program.use();
  program.uniforms.imageSize(Vec2.create(source.width, source.height));
  rt.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, source, program);
  rt.unbind();
  return this.asFXStage(rt, 'downsample2');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Downsample4.js":[function(require,module,exports){
(function (__dirname){
var geom  = require('pex-geom');
var Vec2 = geom.Vec2;
var FXStage = require('./FXStage');


var Downsample4GLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n  vec4 color = vec4(0.0);\n  color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y * -2.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y * -2.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y * -2.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y * -2.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y * -1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y * -1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y * -1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y * -1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y *  0.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y *  0.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y *  0.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y *  0.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y *  1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y *  1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y *  1.0));\n  color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y *  1.0));\n  gl_FragColor = color / 16.0;\n}\n\n#endif";

FXStage.prototype.downsample4 = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height, true);
  outputSize.width /= 4;
  outputSize.height /= 4;
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var source = this.getSourceTexture();
  var program = this.getShader(Downsample4GLSL);
  program.use();
  program.uniforms.imageSize(Vec2.create(source.width, source.height));
  rt.bindAndClear();
  this.drawFullScreenQuad(outputSize.width, outputSize.height, source, program);
  rt.unbind();
  return this.asFXStage(rt, 'downsample4');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXAA.js":[function(require,module,exports){
(function (__dirname){
var geom  = require('pex-geom');
var FXStage = require('./FXStage');


var FXAAGLSL = "#ifdef VERT\n\nfloat FXAA_SUBPIX_SHIFT = 1.0/4.0;\n\nuniform float rtWidth;\nuniform float rtHeight;\nattribute vec2 position;\nattribute vec2 texCoord;\nvarying vec4 posPos;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n\n  vec2 rcpFrame = vec2(1.0/rtWidth, 1.0/rtHeight);\n  posPos.xy = texCoord.xy;\n  posPos.zw = texCoord.xy - (rcpFrame * (0.5 + FXAA_SUBPIX_SHIFT));\n}\n\n#endif\n\n#ifdef FRAG\n\n#define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#define FXAA_SPAN_MAX     8.0\n\nuniform sampler2D tex0;\nvarying vec4 posPos;\nuniform float rtWidth;\nuniform float rtHeight;\n\n\nvec4 applyFXAA(vec2 fragCoord, sampler2D tex)\n{\n    vec4 color;\n    vec2 inverseVP = vec2(1.0 / rtWidth, 1.0 / rtHeight);\n    vec3 rgbNW = texture2D(tex, (fragCoord + vec2(-1.0, -1.0)) * inverseVP).xyz;\n    vec3 rgbNE = texture2D(tex, (fragCoord + vec2(1.0, -1.0)) * inverseVP).xyz;\n    vec3 rgbSW = texture2D(tex, (fragCoord + vec2(-1.0, 1.0)) * inverseVP).xyz;\n    vec3 rgbSE = texture2D(tex, (fragCoord + vec2(1.0, 1.0)) * inverseVP).xyz;\n    vec3 rgbM  = texture2D(tex, fragCoord  * inverseVP).xyz;\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n\n    //return texture2D(tex, fragCoord);\n    //return vec4(fragCoord, 0.0, 1.0);\n    //return vec4(rgbM, 1.0);\n\n    vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\n    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *\n                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n\n    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\n              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n              dir * rcpDirMin)) * inverseVP;\n\n    vec3 rgbA = 0.5 * (\n        texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * 0.5 + 0.25 * (\n        texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);\n\n    float lumaB = dot(rgbB, luma);\n    if ((lumaB < lumaMin) || (lumaB > lumaMax))\n        color = vec4(rgbA, 1.0);\n    else\n        color = vec4(rgbB, 1.0);\n    return color;\n}\n\nvoid main() {\n  gl_FragColor = applyFXAA(posPos.xy * vec2(rtWidth, rtHeight), tex0);\n}\n\n//#version 120\n/*\nuniform sampler2D tex0;\nvarying vec4 posPos;\nuniform float rtWidth;\nuniform float rtHeight;\nfloat FXAA_SPAN_MAX = 8.0;\nfloat FXAA_REDUCE_MUL = 1.0/8.0;\n\n#define FxaaInt2 ivec2\n#define FxaaFloat2 vec2\n#define FxaaTexLod0(t, p) texture2DLod(t, p, 0.0)\n#define FxaaTexOff(t, p, o, r) texture2DLodOffset(t, p, 0.0, o)\n\nvec3 FxaaPixelShader(\n  vec4 posPos, // Output of FxaaVertexShader interpolated across screen.\n  sampler2D tex, // Input texture.\n  vec2 rcpFrame) // Constant {1.0/frameWidth, 1.0/frameHeight}.\n{\n//---------------------------------------------------------\n    #define FXAA_REDUCE_MIN   (1.0/128.0)\n    //#define FXAA_REDUCE_MUL   (1.0/8.0)\n    //#define FXAA_SPAN_MAX     8.0\n//---------------------------------------------------------\n    vec3 rgbNW = FxaaTexLod0(tex, posPos.zw).xyz;\n    vec3 rgbNE = FxaaTexOff(tex, posPos.zw, FxaaInt2(1,0), rcpFrame.xy).xyz;\n    vec3 rgbSW = FxaaTexOff(tex, posPos.zw, FxaaInt2(0,1), rcpFrame.xy).xyz;\n    vec3 rgbSE = FxaaTexOff(tex, posPos.zw, FxaaInt2(1,1), rcpFrame.xy).xyz;\n    vec3 rgbM  = FxaaTexLod0(tex, posPos.xy).xyz;\n//---------------------------------------------------------\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n/*---------------------------------------------------------\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n/*---------------------------------------------------------\n    vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n/*---------------------------------------------------------\n    float dirReduce = max(\n        (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),\n        FXAA_REDUCE_MIN);\n    float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(FxaaFloat2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX),\n          max(FxaaFloat2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n          dir * rcpDirMin)) * rcpFrame.xy;\n/*--------------------------------------------------------\n    vec3 rgbA = (1.0/2.0) * (\n        FxaaTexLod0(tex, posPos.xy + dir * (1.0/3.0 - 0.5)).xyz +\n        FxaaTexLod0(tex, posPos.xy + dir * (2.0/3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * (\n        FxaaTexLod0(tex, posPos.xy + dir * (0.0/3.0 - 0.5)).xyz +\n        FxaaTexLod0(tex, posPos.xy + dir * (3.0/3.0 - 0.5)).xyz);\n    float lumaB = dot(rgbB, luma);\n    if((lumaB < lumaMin) || (lumaB > lumaMax)) return rgbA;\n    return rgbB; }\n\nvec4 PostFX(sampler2D tex, vec2 uv, float time)\n{\n  vec4 c = vec4(0.0);\n  vec2 rcpFrame = vec2(1.0/rt_w, 1.0/rt_h);\n  c.rgb = FxaaPixelShader(posPos, tex, rcpFrame);\n  //c.rgb = 1.0 - texture2D(tex, posPos.xy).rgb;\n  c.a = 1.0;\n  return c;\n}\n\nvoid main()\n{\n  vec2 uv = posPos.xy;\n  gl_FragColor = PostFX(tex0, uv, 0.0);\n}\n\n*/\n\n#endif";

FXStage.prototype.fxaa = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  var source = this.getSourceTexture();
  source.bind();
  var program = this.getShader(FXAAGLSL);
  program.use();
  program.uniforms.rtWidth(source.width);
  program.uniforms.rtHeight(source.height);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'fxaa');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXResourceMgr.js":[function(require,module,exports){
function FXResourceMgr() {
  this.cache = [];
}

FXResourceMgr.prototype.getResource = function(type, properties) {
  properties = properties || {};
  for (var i = 0; i < this.cache.length; i++) {
    var res = this.cache[i];
    if (res.type == type && !res.used) {
      var areTheSame = true;
      for (var propName in properties) {
        if (properties[propName] != res.properties[propName]) {
          areTheSame = false;
        }
      }
      if (areTheSame)
        return res;
    }
  }
  return null;
};

FXResourceMgr.prototype.addResource = function(type, obj, properties) {
  var res = {
    type: type,
    obj: obj,
    properties: properties
  };
  this.cache.push(res);
  return res;
};

FXResourceMgr.prototype.markAllAsNotUsed = function() {
  for (var i = 0; i < this.cache.length; i++) {
    this.cache[i].used = false;
  }
};

module.exports = FXResourceMgr;
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js":[function(require,module,exports){
var glu = require('pex-glu');
var Context = glu.Context;
var ScreenImage = glu.ScreenImage;
var RenderTarget = glu.RenderTarget;
var Program = glu.Program;
var Texture2D = glu.Texture2D;
var FXResourceMgr = require('./FXResourceMgr');

var FXStageCount = 0;

function FXStage(source, resourceMgr, fullscreenQuad) {
  this.id = FXStageCount++;
  this.gl = Context.currentContext;
  this.source = source || null;
  this.resourceMgr = resourceMgr || new FXResourceMgr();
  this.fullscreenQuad = fullscreenQuad || new ScreenImage();
  this.defaultBPP = 8;
}

FXStage.prototype.reset = function() {
  this.resourceMgr.markAllAsNotUsed();
};

FXStage.prototype.getOutputSize = function(width, height, verbose) {
  if (width && height) {
    return {
      width: width,
      height: height
    };
  }
  else if (this.source) {
    return {
      width: this.source.width,
      height: this.source.height
    };
  }
  else {
    var viewport = this.gl.getParameter(this.gl.VIEWPORT);
    return {
      width: viewport[2],
      height: viewport[3]
    };
  }
};

FXStage.prototype.getRenderTarget = function(w, h, depth, bpp) {
  depth = depth || false;
  bpp = bpp || this.defaultBPP;
  var resProps = {
    w: w,
    h: h,
    depth: depth,
    bpp: bpp
  };
  var res = this.resourceMgr.getResource('RenderTarget', resProps);
  if (!res) {
    var renderTarget = new RenderTarget(w, h, resProps);
    res = this.resourceMgr.addResource('RenderTarget', renderTarget, resProps);
  }
  res.used = true;
  return res.obj;
};

FXStage.prototype.getFXStage = function(name) {
  var resProps = {};
  var res = this.resourceMgr.getResource('FXStage', resProps);
  if (!res) {
    var fxState = new FXStage(null, this.resourceMgr, this.fullscreenQuad);
    res = this.resourceMgr.addResource('FXStage', fxState, resProps);
  }
  res.used = true;
  return res.obj;
};

FXStage.prototype.asFXStage = function(source, name) {
  var stage = this.getFXStage(name);
  stage.source = source;
  stage.name = name + '_' + stage.id;
  return stage;
};

FXStage.prototype.getShader = function(code) {
  if (code.indexOf('.glsl') == code.length - 5) {
    throw 'FXStage.getShader - loading files not supported yet.';
  }
  var resProps = { code: code };
  var res = this.resourceMgr.getResource('Program', resProps);
  if (!res) {
    var program = new Program(code);
    res = this.resourceMgr.addResource('Program', program, resProps);
  }
  res.used = true;
  return res.obj;
};

FXStage.prototype.getSourceTexture = function(source) {
  if (source) {
    if (source.source) {
      if (source.source.getColorAttachment) {
        return source.source.getColorAttachment(0);
      }
      else return source.source;
    }
    else if (source.getColorAttachment) {
      return source.getColorAttachment(0);
    }
    else return source;
  }
  else if (this.source) {
    if (this.source.getColorAttachment) {
      return this.source.getColorAttachment(0);
    }
    else return this.source;
  }
  else throw 'FXStage.getSourceTexture() No source texture!';
};

FXStage.prototype.drawFullScreenQuad = function(width, height, image, program) {
  this.drawFullScreenQuadAt(0, 0, width, height, image, program);
};

FXStage.prototype.drawFullScreenQuadAt = function(x, y, width, height, image, program) {
  var gl = this.gl;
  gl.disable(gl.DEPTH_TEST);
  var oldViewport = gl.getParameter(gl.VIEWPORT);
  //false disables scissor test just in case
  glu.viewport(x, y, width, height, false);
  this.fullscreenQuad.draw(image, program);
  glu.viewport(oldViewport[0], oldViewport[1], oldViewport[2], oldViewport[3], false);
};

FXStage.prototype.getImage = function(path) {
  var resProps = { path: path };
  var res = this.resourceMgr.getResource('Image', resProps);
  if (!res) {
    var image = Texture2D.load(path);
    res = this.resourceMgr.addResource('Image', image, resProps);
  }
  res.used = false;
  //can be shared so no need for locking
  return res.obj;
};

FXStage.prototype.getFullScreenQuad = function() {
  return this.fullscreenQuad;
};

module.exports = FXStage;
},{"./FXResourceMgr":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXResourceMgr.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Mult.js":[function(require,module,exports){
(function (__dirname){
var FXStage = require('./FXStage');


var MultGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\nuniform sampler2D tex1;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord);\n  vec4 color2 = texture2D(tex1, vTexCoord);\n\n  gl_FragColor = color * color2;\n}\n\n#endif";

FXStage.prototype.mult = function (source2, options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  this.getSourceTexture(source2).bind(1);
  var program = this.getShader(MultGLSL);
  program.use();
  program.uniforms.tex0(0);
  program.uniforms.tex1(1);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'mult');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Render.js":[function(require,module,exports){
var FXStage = require('./FXStage');

FXStage.prototype.render = function (options) {
  var gl = this.gl;
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var oldViewport = gl.getParameter(gl.VIEWPORT);
  gl.viewport(0, 0, outputSize.width, outputSize.height);
  rt.bindAndClear();
  if (options.drawFunc) {
    options.drawFunc();
  }
  rt.unbind();
  gl.viewport(oldViewport[0], oldViewport[1], oldViewport[2], oldViewport[3]);
  return this.asFXStage(rt, 'render');
};

},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/SSAO.js":[function(require,module,exports){
(function (__dirname){
var FXStage = require('./FXStage');
var geom = require('pex-geom');
var glu = require('pex-glu')
var Vec2 = geom.Vec2;


var SSAOGLSL = "//based on http://blenderartists.org/forum/showthread.php?184102-nicer-and-faster-SSAO and http://www.pasteall.org/12299\n#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\n#define PI    3.14159265\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D depthMap;\nuniform vec2 textureSize;\nuniform float near;\nuniform float far;\n\nconst int samples = 3;\nconst int rings = 5;\n\nuniform float strength;\nuniform float offset;\n\nvec2 rand(vec2 coord) {\n  float noiseX = (fract(sin(dot(coord, vec2(12.9898,78.233))) * 43758.5453));\n  float noiseY = (fract(sin(dot(coord, vec2(12.9898,78.233) * 2.0)) * 43758.5453));\n  return vec2(noiseX,noiseY) * 0.004;\n}\n\nfloat compareDepths( in float depth1, in float depth2 )\n{\n  float depthTolerance = far / 5.0;\n  float occlusionTolerance = far / 100.0;\n  float diff = (depth1 - depth2);\n\n  if (diff <= 0.0) return 0.0;\n  if (diff > depthTolerance) return 0.0;\n  if (diff < occlusionTolerance) return 0.0;\n\n  return 1.0;\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(vec2 coord) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n  return z_e;\n}\n\nvoid main() {\n  vec2 texCoord = vec2(gl_FragCoord.x / textureSize.x, gl_FragCoord.y / textureSize.y);\n  float depth = readDepth(texCoord);\n  float z_b = texture2D(depthMap, texCoord).r;\n\n  float d;\n\n  float aspect = textureSize.x / textureSize.y;\n  vec2 noise = rand(vTexCoord);\n\n  float w = (1.0 / textureSize.x)/clamp(z_b,0.1,1.0)+(noise.x*(1.0-noise.x));\n  float h = (1.0 / textureSize.y)/clamp(z_b,0.1,1.0)+(noise.y*(1.0-noise.y));\n\n  float pw;\n  float ph;\n\n  float ao = 0.0;\n  float s = 0.0;\n  float fade = 4.0;\n\n  for (int i = 0 ; i < rings; i += 1)\n  {\n    fade *= 0.5;\n    for (int j = 0 ; j < samples*rings; j += 1)\n    {\n      if (j >= samples*i) break;\n      float step = PI * 2.0 / (float(samples) * float(i));\n      float r = 4.0 * float(i);\n      pw = r * (cos(float(j)*step));\n      ph = r * (sin(float(j)*step)) * aspect;\n      d = readDepth( vec2(texCoord.s + pw * w,texCoord.t + ph * h));\n      ao += compareDepths(depth, d) * fade;\n      s += 1.0 * fade;\n    }\n  }\n\n  ao /= s;\n  ao = clamp(ao, 0.0, 1.0);\n  ao = 1.0 - ao;\n  ao = offset + (1.0 - offset) * ao;\n  ao = pow(ao, strength);\n\n  gl_FragColor = vec4(ao, ao, ao, 1.0);\n}\n\n#endif";

FXStage.prototype.ssao = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  var depthMap = this.getSourceTexture(options.depthMap);
  depthMap.bind(0);
  var program = this.getShader(SSAOGLSL);
  program.use();
  program.uniforms.textureSize(Vec2.create(outputSize.width, outputSize.height));
  program.uniforms.depthMap(0);
  program.uniforms.near(options.camera.getNear());
  program.uniforms.far(options.camera.getFar());
  if (program.uniforms.strength) program.uniforms.strength(typeof(options.strength) !== "undefined" ? options.strength : 1);
  if (program.uniforms.offset) program.uniforms.offset(typeof(options.offset) !== "undefined" ? options.offset : 0);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'ssao');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/Save.js":[function(require,module,exports){
(function (__dirname){
var geom  = require('pex-geom');
var glu  = require('pex-glu');
var FXStage = require('./FXStage');


var SaveGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\n\nvoid main() {\n  gl_FragColor = texture2D(tex0, vTexCoord);\n}\n\n#endif";

var pad = function(num, char, len) {
  var s = '' + num;
  while (s.length < len) {
    s = char + s;
  }
  return s;
}

FXStage.prototype.save = function (path, options) {
  path = path || '.'
  options = options || {};

  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  var program = this.getShader(SaveGLSL);
  program.use();
  program.uniforms.tex0(0);

  var oldViewport = this.gl.getParameter(this.gl.VIEWPORT);
  glu.viewport(0, 0, outputSize.width, outputSize.height, false);

  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);

  var d = new Date();
  var filename = path + "/screenshot_"
  filename += d.getFullYear() + '-' + pad(d.getMonth()+1,'0',2) + '-' + pad(d.getDate(),'0',2);
  filename += '_' + pad(d.getHours(),'0',2) + ':' + pad(d.getMinutes(),'0',2) + ':' + pad(d.getSeconds(),'0',2) + '.png'
  this.gl.writeImage('png', filename);
  console.log('Saved', filename);

  glu.viewport(oldViewport[0], oldViewport[1], oldViewport[2], oldViewport[3], false);

  rt.unbind();

  return this.asFXStage(rt, 'save');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/TonemapReinhard.js":[function(require,module,exports){
(function (__dirname){
var FXStage = require('./FXStage');


var TonemapReinhardGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nuniform float exposure;\nuniform sampler2D tex0;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord).rgba;\n  color.rgb *= exposure;\n  color = color/(1.0 + color);\n  vec3 retColor = color.rgb;\n  gl_FragColor.rgb = retColor;\n  gl_FragColor.a = color.a;\n}\n\n#endif";

FXStage.prototype.tonemapReinhard = function (options) {
  options = options || {
    exposure: 1
  };
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  this.getSourceTexture().bind(0);
  var program = this.getShader(TonemapReinhardGLSL);
  program.use();
  program.uniforms.tex0(0);
  program.uniforms.exposure(options.exposure);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);

  rt.unbind();
  return this.asFXStage(rt, 'tonemapReinhard');
};

module.exports = FXStage;
}).call(this,"/node_modules/pex-fx/lib")
},{"./FXStage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/lib/FXStage.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/index.js":[function(require,module,exports){
module.exports.Plane = require('./lib/Plane');
module.exports.Cube = require('./lib/Cube');
module.exports.Box = require('./lib/Box');
module.exports.Sphere = require('./lib/Sphere');
module.exports.Tetrahedron = require('./lib/Tetrahedron');
module.exports.Octahedron = require('./lib/Octahedron');
module.exports.Icosahedron = require('./lib/Icosahedron');
module.exports.Dodecahedron = require('./lib/Dodecahedron');
module.exports.HexSphere = require('./lib/HexSphere');
module.exports.LineBuilder = require('./lib/LineBuilder');
module.exports.Loft = require('./lib/Loft');
module.exports.IsoSurface = require('./lib/IsoSurface');
},{"./lib/Box":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Box.js","./lib/Cube":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Cube.js","./lib/Dodecahedron":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Dodecahedron.js","./lib/HexSphere":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/HexSphere.js","./lib/Icosahedron":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Icosahedron.js","./lib/IsoSurface":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/IsoSurface.js","./lib/LineBuilder":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/LineBuilder.js","./lib/Loft":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Loft.js","./lib/Octahedron":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Octahedron.js","./lib/Plane":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Plane.js","./lib/Sphere":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Sphere.js","./lib/Tetrahedron":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Tetrahedron.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Box.js":[function(require,module,exports){
//Like cube but not subdivided and continuous on edges

//## Parent class : [Geometry](../Geometry.html)

//## Example use
//      var cube = new Box(1, 1, 1);
//      var cubeMesh = new Mesh(cube, new Materials.TestMaterial());

var geom = require('pex-geom');
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//### Box ( sx, sy, sz )
//`sx` - size x / width *{ Number }*  
//`sy` - size y / height *{ Number }*  
//`sz` - size z / depth *{ Number }*  
function Box(sx, sy, sz) {
  sx = sx != null ? sx : 1;
  sy = sy != null ? sy : sx != null ? sx : 1;
  sz = sz != null ? sz : sx != null ? sx : 1;

  Geometry.call(this, { vertices: true, faces: true });

  var vertices = this.vertices;
  var faces = this.faces;

  var x = sx/2;
  var y = sy/2;
  var z = sz/2;

  //bottom
  vertices.push(new Vec3(-x, -y, -z));
  vertices.push(new Vec3(-x, -y,  z));
  vertices.push(new Vec3( x, -y,  z));
  vertices.push(new Vec3( x, -y, -z));

  //top
  vertices.push(new Vec3(-x,  y, -z));
  vertices.push(new Vec3(-x,  y,  z));
  vertices.push(new Vec3( x,  y,  z));
  vertices.push(new Vec3( x,  y, -z));

  //     4----7
  //    /:   /|
  //   5----6 |
  //   | 0..|.3
  //   |,   |/
  //   1----2

  faces.push([0, 3, 2, 1]); //bottom
  faces.push([4, 5, 6, 7]); //top
  faces.push([0, 1, 5, 4]); //left
  faces.push([2, 3, 7, 6]); //right
  faces.push([1, 2, 6, 5]); //front
  faces.push([3, 0, 4, 7]); //back

  this.computeNormals();
}

Box.prototype = Object.create(Geometry.prototype);

module.exports = Box;

},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Cube.js":[function(require,module,exports){
//Cube geometry generator.

//## Parent class : [Geometry](../Geometry.html)

//## Example use
//      var cube = new Cube(1, 1, 1, 10, 10, 10);
//      var cubeMesh = new Mesh(cube, new Materials.TestMaterial());

var geom = require('pex-geom');
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//### Cube ( sx, sy, sz, nx, ny, nz )
//`sx` - size x / width *{ Number }*  
//`sy` - size y / height *{ Number }*  
//`sz` - size z / depth *{ Number }*  
//`nx` - number of subdivisions on x axis *{ Number/Int }*  
//`ny` - number of subdivisions on y axis *{ Number/Int }*  
//`nz` - number of subdivisions on z axis *{ Number/Int }*
function Cube(sx, sy, sz, nx, ny, nz) {
  sx = sx != null ? sx : 1;
  sy = sy != null ? sy : sx != null ? sx : 1;
  sz = sz != null ? sz : sx != null ? sx : 1;
  nx = nx || 1;
  ny = ny || 1;
  nz = nz || 1;

  Geometry.call(this, { vertices: true, normals: true, texCoords: true, faces: true });

  var vertices = this.vertices;
  var texCoords = this.texCoords;
  var normals = this.normals;
  var faces = this.faces;

  var vertexIndex = 0;

  // How faces are constructed:
  //
  //     0-----1 . . 2       n  <----  n+1
  //     |   / .     .       |         A
  //     | /   .     .       V         |
  //     3 . . 4 . . 5      n+nu --> n+nu+1
  //     .     .     .
  //     .     .     .
  //     6 . . 7 . . 8
  //
  function makePlane(u, v, w, su, sv, nu, nv, pw, flipu, flipv) {
    var vertShift = vertexIndex;
    for (var j=0; j<=nv; j++) {
      for (var i=0; i<=nu; i++) {
        vert = vertices[vertexIndex] = Vec3.create();
        vert[u] = (-su / 2 + i * su / nu) * flipu;
        vert[v] = (-sv / 2 + j * sv / nv) * flipv;
        vert[w] = pw;
        normal = normals[vertexIndex] = Vec3.create();
        normal[u] = 0;
        normal[v] = 0;
        normal[w] = pw / Math.abs(pw);
        texCoord = texCoords[vertexIndex] = Vec2.create();
        texCoord.x = i / nu;
        texCoord.y = 1.0 - j / nv;
        ++vertexIndex;
      }
    }
    for (var j=0; j<=nv-1; j++) {
      for (var i=0; i<=nu-1; i++) {
        var n = vertShift + j * (nu + 1) + i;
        faces.push([n, n + nu + 1, n + nu + 2, n + 1]);
      }
    }
  }

  makePlane('x', 'y', 'z', sx, sy, nx, ny, sz / 2, 1, -1);
  makePlane('x', 'y', 'z', sx, sy, nx, ny, -sz / 2, -1, -1);
  makePlane('z', 'y', 'x', sz, sy, nz, ny, -sx / 2, 1, -1);
  makePlane('z', 'y', 'x', sz, sy, nz, ny, sx / 2, -1, -1);
  makePlane('x', 'z', 'y', sx, sz, nx, nz, sy / 2, 1, 1);
  makePlane('x', 'z', 'y', sx, sz, nx, nz, -sy / 2, 1, -1);

  this.computeEdges();
}

Cube.prototype = Object.create(Geometry.prototype);

module.exports = Cube;

},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Dodecahedron.js":[function(require,module,exports){
var geom = require('pex-geom');
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//Dodecahedron
//Based on http://paulbourke.net/geometry/platonic/
function Dodecahedron(r) {
  r = r || 0.5;

  var phi = (1 + Math.sqrt(5)) / 2;
  var a = 0.5;
  var b = 0.5 * 1 / phi;
  var c = 0.5 * (2 - phi);

  var vertices = [
    new Vec3( c,  0,  a),
    new Vec3(-c,  0,  a),
    new Vec3(-b,  b,  b),
    new Vec3( 0,  a,  c),
    new Vec3( b,  b,  b),
    new Vec3( b, -b,  b),
    new Vec3( 0, -a,  c),
    new Vec3(-b, -b,  b),
    new Vec3( c,  0, -a),
    new Vec3(-c,  0, -a),
    new Vec3(-b, -b, -b),
    new Vec3( 0, -a, -c),
    new Vec3( b, -b, -b),
    new Vec3( b,  b, -b),
    new Vec3( 0,  a, -c),
    new Vec3(-b,  b, -b),
    new Vec3( a,  c,  0),
    new Vec3(-a,  c,  0),
    new Vec3(-a, -c,  0),
    new Vec3( a, -c,  0)
  ];

  vertices = vertices.map(function(v) { return v.normalize().scale(r); })

  var faces = [
    [  4,  3,  2,  1,  0 ],
    [  7,  6,  5,  0,  1 ],
    [ 12, 11, 10,  9,  8 ],
    [ 15, 14, 13,  8,  9 ],
    [ 14,  3,  4, 16, 13 ],
    [  3, 14, 15, 17,  2 ],
    [ 11,  6,  7, 18, 10 ],
    [  6, 11, 12, 19,  5 ],
    [  4,  0,  5, 19, 16 ],
    [ 12,  8, 13, 16, 19 ],
    [ 15,  9, 10, 18, 17 ],
    [  7,  1,  2, 17, 18 ]
  ];

  var edges = [
    [  0,  1 ],
    [  0,  4 ],
    [  0,  5 ],
    [  1,  2 ],
    [  1,  7 ],
    [  2,  3 ],
    [  2, 17 ],
    [  3,  4 ],
    [  3, 14 ],
    [  4, 16 ],
    [  5,  6 ],
    [  5, 19 ],
    [  6,  7 ],
    [  6, 11 ],
    [  7, 18 ],
    [  8,  9 ],
    [  8, 12 ],
    [  8, 13 ],
    [  9, 10 ],
    [  9, 15 ],
    [ 10, 11 ],
    [ 10, 18 ],
    [ 11, 12 ],
    [ 12, 19 ],
    [ 13, 14 ],
    [ 13, 16 ],
    [ 14, 15 ],
    [ 15, 17 ],
    [ 16, 19 ],
    [ 17, 18 ]
  ];

  

  Geometry.call(this, { vertices: vertices, faces: faces, edges: edges });
}

Dodecahedron.prototype = Object.create(Geometry.prototype);

module.exports = Dodecahedron;
},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/HexSphere.js":[function(require,module,exports){
var geom = require('pex-geom');
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;
var Icosahedron = require('./Icosahedron');

function next(edge) {
  return edge.face.halfEdges[(edge.slot + 1) % edge.face.length]
}

function prev(edge) {
  return edge.face.halfEdges[(edge.slot - 1 + edge.face.length) % edge.face.length]
}

function vertexEdgeLoop(edge, cb) {
  var curr = edge;

  do {
    cb(curr);
    curr = prev(curr).opposite;
  }
  while(curr != edge);
}

function centroid(points) {
  var n = points.length;
  var center = points.reduce(function(center, p) {
    return center.add(p);
  }, new Vec3(0, 0, 0));
  center.scale(1 / points.length);
  return center;
}

function elements(list, indices) {
  return indices.map(function(i) { return list[i]; })
}

//HexSphere
function HexSphere(r, level) {
  r = r || 0.5;
  level = level || 1;

  var baseGeom = new Icosahedron(r);
  for(var i=0; i<level; i++) {
    baseGeom = baseGeom.subdivideEdges();
  }

  var vertices = [];
  var faces = [];


  var halfEdgeForVertex = [];
  var halfEdges = baseGeom.computeHalfEdges();
  halfEdges.forEach(function(e) {
    halfEdgeForVertex[e.face[e.slot]] = e;
  });

  for(var i=0; i<baseGeom.vertices.length; i++) {
    var vertexIndex = vertices.length;
    var midPoints = [];
    //collect center points of neighbor faces
    vertexEdgeLoop(halfEdgeForVertex[i], function(e) {
      var midPoint = centroid(elements(baseGeom.vertices, e.face));
      midPoints.push(midPoint);
    });
    midPoints.forEach(function(p, i){
      vertices.push(p);
    });
    if (midPoints.length == 5) {
      faces.push([vertexIndex, vertexIndex+1, vertexIndex+2, vertexIndex+3, vertexIndex+4]);
    }
    if (midPoints.length == 6) {
      faces.push([vertexIndex, vertexIndex+1, vertexIndex+2, vertexIndex+3, vertexIndex+4, vertexIndex+5]);
    }
  }

  vertices.forEach(function(v) {
    v.normalize().scale(r);
  });

  Geometry.call(this, { vertices: vertices, faces: faces });

  this.computeEdges();
}

HexSphere.prototype = Object.create(Geometry.prototype);

module.exports = HexSphere;
},{"./Icosahedron":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Icosahedron.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Icosahedron.js":[function(require,module,exports){
var geom = require('pex-geom');
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//Icosahedron
//Based on http://paulbourke.net/geometry/platonic/
function Icosahedron(r) {
  r = r || 0.5;

  var phi = (1 + Math.sqrt(5)) / 2;
  var a = 1 / 2;
  var b = 1 / (2 * phi);

  var vertices = [
    new Vec3(  0,  b, -a),
    new Vec3(  b,  a,  0),
    new Vec3( -b,  a,  0),
    new Vec3(  0,  b,  a),
    new Vec3(  0, -b,  a),
    new Vec3( -a,  0,  b),
    new Vec3(  a,  0,  b),
    new Vec3(  0, -b, -a),
    new Vec3(  a,  0, -b),
    new Vec3( -a,  0, -b),
    new Vec3(  b, -a,  0),
    new Vec3( -b, -a,  0)
  ];

  vertices = vertices.map(function(v) { return v.normalize().scale(r); })

  var faces = [
    [  1,  0,  2 ],
    [  2,  3,  1 ],
    [  4,  3,  5 ],
    [  6,  3,  4 ],
    [  7,  0,  8 ],
    [  9,  0,  7 ],
    [ 10,  4, 11 ],
    [ 11,  7, 10 ],
    [  5,  2,  9 ],
    [  9, 11,  5 ],
    [  8,  1,  6 ],
    [  6, 10,  8 ],
    [  5,  3,  2 ],
    [  1,  3,  6 ],
    [  2,  0,  9 ],
    [  8,  0,  1 ],
    [  9,  7, 11 ],
    [ 10,  7,  8 ],
    [ 11,  4,  5 ],
    [  6,  4, 10 ]
  ];

  var edges = [
    [ 0,  1 ],
    [ 0,  2 ],
    [ 0,  7 ],
    [ 0,  8 ],
    [ 0,  9 ],
    [ 1,  2 ],
    [ 1,  3 ],
    [ 1,  6 ],
    [ 1,  8 ],
    [ 2,  3 ],
    [ 2,  5 ],
    [ 2,  9 ],
    [ 3,  4 ],
    [ 3,  5 ],
    [ 3,  6 ],
    [ 4,  5 ],
    [ 4,  6 ],
    [ 4, 10 ],
    [ 4, 11 ],
    [ 5,  9 ],
    [ 5, 11 ],
    [ 6,  8 ],
    [ 6, 10 ],
    [ 7,  8 ],
    [ 7,  9 ],
    [ 7, 10 ],
    [ 7, 11 ],
    [ 8, 10 ],
    [ 9, 11 ],
    [10, 11 ]
  ];

  Geometry.call(this, { vertices: vertices, faces: faces, edges: edges });
}

Icosahedron.prototype = Object.create(Geometry.prototype);

module.exports = Icosahedron;
},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/IsoSurface.js":[function(require,module,exports){
var geom = require('pex-geom');
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

function IsoSurface(gridres, size) {
  size = size || 1;
  this.numOfGridPts = gridres;

  this.tresholdValue = 1;

  this.makeGrid(size);
}

IsoSurface.prototype.makeGrid = function(size) {
  var numOfPts2 = 2/(this.numOfGridPts-1);

  this.grid = [];
  for(var x=0; x<this.numOfGridPts; x++) {
    this.grid[x] = [];
    for(var y=0; y<this.numOfGridPts; y++) {
      this.grid[x][y] = [];
      for(var z=0; z<this.numOfGridPts; z++) {
        this.grid[x][y][z] = {
          value: 0,
          position: new Vec3((x/(this.numOfGridPts-1) - 0.5)*size, (y/(this.numOfGridPts-1) - 0.5)*size, (z/(this.numOfGridPts-1) - 0.5)*size),
          normal: new Vec3(0,0,0)
        };
      }
    }
  }

  this.cubes = [];
  for (var x=0; x<this.numOfGridPts-1; x++) {
    this.cubes[x] = [];
    for (var y=0; y<this.numOfGridPts-1; y++) {
      this.cubes[x][y] = [];
      for (var z=0; z<this.numOfGridPts-1; z++) {
        this.cubes[x][y][z] = { vert: [] };
        this.cubes[x][y][z].vert[0] = this.grid[x  ][y  ][z  ];
        this.cubes[x][y][z].vert[1] = this.grid[x+1][y  ][z  ];
        this.cubes[x][y][z].vert[2] = this.grid[x+1][y  ][z+1];
        this.cubes[x][y][z].vert[3] = this.grid[x  ][y  ][z+1];
        this.cubes[x][y][z].vert[4] = this.grid[x  ][y+1][z  ];
        this.cubes[x][y][z].vert[5] = this.grid[x+1][y+1][z  ];
        this.cubes[x][y][z].vert[6] = this.grid[x+1][y+1][z+1];
        this.cubes[x][y][z].vert[7] = this.grid[x  ][y+1][z+1];
      }
    }
  }
}

IsoSurface.prototype.update = function(spheres) {
  var grid = this.grid;

  for (var x=0; x<this.numOfGridPts; x++) {
    for (var y=0; y<this.numOfGridPts; y++) {
      for (var z=0; z<this.numOfGridPts; z++) {
        grid[x][y][z].value = this.findValue(grid[x][y][z].position, spheres);
      }
    }
  }

  for (x=1; x<this.numOfGridPts-1; x++) {
    for (y=1; y<this.numOfGridPts-1; y++) {
      for (z=1; z<this.numOfGridPts-1; z++) {
        grid[x][y][z].normal.x = grid[x-1][y][z].value - grid[x+1][y][z].value;
        grid[x][y][z].normal.y = grid[x][y-1][z].value - grid[x][y+1][z].value;
        grid[x][y][z].normal.z = grid[x][y][z-1].value - grid[x][y][z+1].value;
        //grid[x][y][z].normal.normalize();
      }
    }
  }

  if (!this.geom) {
    this.geom = new Geometry({vertices: true, normals: true, texCoords: true, faces: true});
  }
  else {
    this.geom.vertices.length = 0;
    this.geom.normals.length = 0;
    this.geom.texCoords.length = 0;
    this.geom.faces.length = 0;
    this.geom.vertices.dirty = true;
    this.geom.normals.dirty = true;
    this.geom.texCoords.dirty = true;
    this.geom.faces.dirty = true;
  }
  for (var x=0; x<this.numOfGridPts-1; x++) {
    for (var y=0; y<this.numOfGridPts-1; y++) {
      for (var z=0; z<this.numOfGridPts-1; z++) {
        this.marchCube(x,y,z);
      }
    }
  }
  return this.geom;
};

IsoSurface.prototype.marchCube = function(iX, iY, iZ) {
  var cubeindex = 0;
  var edgeFlags;
  var tri;
  var v;
  var EdgeVertex = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
  var d1,d2,normal;
  var cube = this.cubes[iX][iY][iZ];

  if (cube.vert[0].value > this.tresholdValue) cubeindex |= 1;
  if (cube.vert[1].value > this.tresholdValue) cubeindex |= 2;
  if (cube.vert[2].value > this.tresholdValue) cubeindex |= 4;
  if (cube.vert[3].value > this.tresholdValue) cubeindex |= 8;
  if (cube.vert[4].value > this.tresholdValue) cubeindex |= 16;
  if (cube.vert[5].value > this.tresholdValue) cubeindex |= 32;
  if (cube.vert[6].value > this.tresholdValue) cubeindex |= 64;
  if (cube.vert[7].value > this.tresholdValue) cubeindex |= 128;

  edgeFlags = CubeEdgeFlags[cubeindex];

  if (edgeFlags == 0)
    return;

  if (edgeFlags & 1   )   this.interpolate(cube.vert[0], cube.vert[1], EdgeVertex[0 ]);
  if (edgeFlags & 2   )   this.interpolate(cube.vert[1], cube.vert[2], EdgeVertex[1 ]);
  if (edgeFlags & 4   )   this.interpolate(cube.vert[2], cube.vert[3], EdgeVertex[2 ]);
  if (edgeFlags & 8   )   this.interpolate(cube.vert[3], cube.vert[0], EdgeVertex[3 ]);
  if (edgeFlags & 16  )   this.interpolate(cube.vert[4], cube.vert[5], EdgeVertex[4 ]);
  if (edgeFlags & 32  )   this.interpolate(cube.vert[5], cube.vert[6], EdgeVertex[5 ]);
  if (edgeFlags & 64  )   this.interpolate(cube.vert[6], cube.vert[7], EdgeVertex[6 ]);
  if (edgeFlags & 128 )   this.interpolate(cube.vert[7], cube.vert[4], EdgeVertex[7 ]);
  if (edgeFlags & 256 )   this.interpolate(cube.vert[0], cube.vert[4], EdgeVertex[8 ]);
  if (edgeFlags & 512 )   this.interpolate(cube.vert[1], cube.vert[5], EdgeVertex[9 ]);
  if (edgeFlags & 1024)   this.interpolate(cube.vert[2], cube.vert[6], EdgeVertex[10]);
  if (edgeFlags & 2048)   this.interpolate(cube.vert[3], cube.vert[7], EdgeVertex[11]);

  var i = this.geom.vertices.length;
  //rysujemy trojkaty, moze ich byc max 5
  for(tri = 0;tri<5;tri++) {
    if (TriangleConnectionTable[cubeindex][3*tri] < 0)
      break;

    var ab = EdgeVertex[TriangleConnectionTable[cubeindex][3*tri+1]].position.dup().sub(EdgeVertex[TriangleConnectionTable[cubeindex][3*tri+0]].position);
    var ac = EdgeVertex[TriangleConnectionTable[cubeindex][3*tri+2]].position.dup().sub(EdgeVertex[TriangleConnectionTable[cubeindex][3*tri+0]].position);
    var n = ab.dup().cross(ac);

    for(var v=0;v<3;v++) {
      d2 = EdgeVertex[TriangleConnectionTable[cubeindex][3*tri+v]];
      this.geom.vertices.push(d2.position);
      this.geom.normals.push(d2.normal);
      this.geom.texCoords.push(new Vec2(d2.normal.x*0.5+0.5, d2.normal.y*0.5+0.5));
    }

    this.geom.faces.push([i++, i++, i++]);
  }
}

IsoSurface.prototype.interpolate = function(gridPkt1, gridPkt2, vect) {
  var delta = gridPkt2.value - gridPkt1.value;

  if (delta == 0) delta = 0.0;

  var m = (this.tresholdValue - gridPkt1.value)/delta;

  vect.position = gridPkt1.position.dup().add((gridPkt2.position.dup().sub(gridPkt1.position)).dup().scale(m));
  vect.normal = gridPkt1.normal.dup().add((gridPkt2.normal.dup().sub(gridPkt1.normal)).dup().scale(m)); //position.dup().scale(0.5)
  var len = vect.normal.length();
  (len==0) ? (len=1) : (len = 1.0/len);

  vect.normal = vect.normal.dup().scale(len);
}

IsoSurface.prototype.findValue = function(position, spheres) {
  var fResult = 0;

  for(var i=0;i<spheres.length;i++) {
    var distanceSqr = position.squareDistance(spheres[i].position);
    if (distanceSqr == 0) len = 1;
    var r = spheres[i].radius;
    var f = spheres[i].force;
    fResult += f * r * r * spheres[i].radius / distanceSqr;
  }

  return fResult;
};

var CubeEdgeFlags = [
  0x000, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
  0x190, 0x099, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
  0x230, 0x339, 0x033, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
  0x3a0, 0x2a9, 0x1a3, 0x0aa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
  0x460, 0x569, 0x663, 0x76a, 0x066, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
  0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0x0ff, 0x3f5, 0x2fc, 0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
  0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x055, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
  0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0x0cc, 0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
  0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0x0cc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
  0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x055, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
  0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0x0ff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
  0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x066, 0x76a, 0x663, 0x569, 0x460,
  0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0x0aa, 0x1a3, 0x2a9, 0x3a0,
  0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x033, 0x339, 0x230,
  0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x099, 0x190,
  0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x000
];

var TriangleConnectionTable = [
  [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1],
  [3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1],
  [3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1],
  [3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1],
  [9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1],
  [9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
  [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1],
  [8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1],
  [9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
  [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1],
  [3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1],
  [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1],
  [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1],
  [4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1],
  [9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
  [5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1],
  [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1],
  [9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
  [0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
  [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1],
  [10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1],
  [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1],
  [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1],
  [5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1],
  [9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1],
  [0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1],
  [1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1],
  [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1],
  [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1],
  [2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1],
  [7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1],
  [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1],
  [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1],
  [11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1],
  [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1],
  [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
  [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
  [11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
  [1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1],
  [9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1],
  [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1],
  [2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
  [0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
  [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1],
  [6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1],
  [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1],
  [6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1],
  [5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1],
  [1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
  [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1],
  [6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1],
  [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1],
  [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
  [3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
  [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1],
  [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1],
  [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
  [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1],
  [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
  [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
  [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1],
  [10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1],
  [10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1],
  [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1],
  [1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1],
  [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1],
  [0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1],
  [10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1],
  [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1],
  [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
  [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1],
  [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
  [3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1],
  [6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1],
  [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1],
  [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1],
  [10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1],
  [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
  [7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1],
  [7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1],
  [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
  [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
  [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1],
  [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
  [0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1],
  [7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
  [10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
  [2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
  [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1],
  [7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1],
  [2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1],
  [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1],
  [10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1],
  [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1],
  [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1],
  [7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1],
  [6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1],
  [8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1],
  [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1],
  [6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1],
  [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1],
  [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
  [8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1],
  [0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1],
  [1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1],
  [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1],
  [10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1],
  [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
  [10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
  [5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
  [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1],
  [9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
  [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1],
  [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1],
  [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
  [7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1],
  [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1],
  [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1],
  [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
  [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1],
  [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
  [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
  [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1],
  [6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1],
  [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1],
  [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1],
  [6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1],
  [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
  [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
  [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1],
  [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1],
  [9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1],
  [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
  [1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
  [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1],
  [0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1],
  [5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1],
  [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1],
  [11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1],
  [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1],
  [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
  [2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1],
  [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1],
  [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1],
  [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
  [1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1],
  [9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1],
  [9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1],
  [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1],
  [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1],
  [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
  [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1],
  [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
  [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
  [9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1],
  [5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1],
  [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
  [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1],
  [8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1],
  [0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1],
  [9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1],
  [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1],
  [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1],
  [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
  [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1],
  [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
  [11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1],
  [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1],
  [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1],
  [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
  [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
  [1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1],
  [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1],
  [4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1],
  [0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1],
  [3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1],
  [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1],
  [0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1],
  [9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1],
  [1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
];

module.exports = IsoSurface;
},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/LineBuilder.js":[function(require,module,exports){
var geom = require('pex-geom');
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

function LineBuilder() {
  Geometry.call(this, { vertices: true, colors: true })
}

LineBuilder.prototype = Object.create(Geometry.prototype);

LineBuilder.prototype.addLine = function(a, b, colorA, colorB) {
  colorA = colorA || { r: 1, g: 1, b: 1, a: 1 };
  colorB = colorB || colorA;
  this.vertices.push(Vec3.create().copy(a));
  this.vertices.push(Vec3.create().copy(b));
  this.colors.push(colorA);
  this.colors.push(colorB);
  this.vertices.dirty = true;
  this.colors.dirty = true;
  return this;
};

LineBuilder.prototype.addPath = function(path, color, numSamples, showPoints) {
  numSamples = numSamples || path.points.length;
  color = color || { r: 1, g: 1, b: 1, a: 1 };

  var prevPoint = path.getPointAt(0);
  if (showPoints) this.addCross(prevPoint, 0.1, color);
  for(var i=1; i<numSamples; i++) {
    var point;
    if (path.points.length == numSamples) {
      point = path.getPoint(i/(numSamples-1));
    }
    else {
      point = path.getPointAt(i/(numSamples-1));
    }
    this.addLine(prevPoint, point, color);
    prevPoint = point;
    if (showPoints) this.addCross(prevPoint, 0.1, color);
  }
  this.vertices.dirty = true;
  this.colors.dirty = true;
  return this;
}

LineBuilder.prototype.addCross = function(pos, size, color) {
  size = size || 0.1;
  var halfSize = size / 2;
  color = color || { r: 1, g: 1, b: 1, a: 1 };
  this.vertices.push(Vec3.create().set(pos.x - halfSize, pos.y, pos.z));
  this.vertices.push(Vec3.create().set(pos.x + halfSize, pos.y, pos.z));
  this.vertices.push(Vec3.create().set(pos.x, pos.y - halfSize, pos.z));
  this.vertices.push(Vec3.create().set(pos.x, pos.y + halfSize, pos.z));
  this.vertices.push(Vec3.create().set(pos.x, pos.y, pos.z - halfSize));
  this.vertices.push(Vec3.create().set(pos.x, pos.y, pos.z + halfSize));
  this.colors.push(color);
  this.colors.push(color);
  this.colors.push(color);
  this.colors.push(color);
  this.colors.push(color);
  this.colors.push(color);
  return this;
};

LineBuilder.prototype.reset = function() {
  this.vertices.length = 0;
  this.colors.length = 0;
  this.vertices.dirty = true;
  this.colors.dirty = true;
  return this;
};

module.exports = LineBuilder;

},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Loft.js":[function(require,module,exports){
var merge = require('merge');
var geom = require('pex-geom');
var Geometry = geom.Geometry;
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Mat4 = geom.Mat4;
var Quat = geom.Quat;
var Path = geom.Path;
var Spline1D = geom.Spline1D;
var Spline3D = geom.Spline3D;
var acos = Math.acos;
var PI = Math.PI;
var min = Math.min;
var LineBuilder = require('./LineBuilder');

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

// Version history
// 1. Naive implementation
// https://gist.github.com/roxlu/2859605
// 2. Fixed twists
// http://www.lab4games.net/zz85/blog/2012/04/24/spline-extrusions-tubes-and-knots-of-sorts/
// http://www.cs.cmu.edu/afs/andrew/scs/cs/15-462/web/old/asst2camera.html

var EPSILON = 0.00001;

function Loft(path, options) {
  options = options || {};
  Geometry.call(this, { vertices: true, normals: true, texCoords: true, edges: false, faces: true });
  var defaults = {
    numSteps: 200,
    numSegments: 8,
    r: 0.3,
    shapePath: null,
    xShapeScale: 1,
    caps: false,
    initialNormal: null,
    adjustAngle: 0
  };
  path.samplesCount = 5000;
  if (options.shapePath && !options.numSegments) {
    options.numSegments = options.shapePath.points.length;
  }
  this.options = options = merge(defaults, options);
  this.path = path;
  if (path.isClosed()) options.caps = false;
  this.shapePath = options.shapePath || this.makeShapePath(options.numSegments);
  this.adjustAngle = options.adjustAngle;
  this.rfunc = this.makeRadiusFunction(options.r);
  this.rufunc = options.ru ? this.makeRadiusFunction(options.ru) : this.rfunc;
  this.rvfunc = options.rv ? this.makeRadiusFunction(options.rv) : (options.ru ? this.rufunc : this.rfunc);
  this.points = this.samplePoints(path, options.numSteps, path.isClosed());
  this.tangents = this.sampleTangents(path, options.numSteps, path.isClosed());
  this.frames = this.makeFrames(this.points, this.tangents, path.isClosed());
  this.buildGeometry(options.caps);
}

Loft.prototype = Object.create(Geometry.prototype);

Loft.prototype.buildGeometry = function(caps) {
  caps = typeof caps !== 'undefined' ? caps : false;

  var index = 0;
  var numSteps = this.options.numSteps;
  var numSegments = this.options.numSegments;

  for (var i=0; i<this.frames.length; i++) {
    var frame = this.frames[i];
    var ru = this.rufunc(i, numSteps);
    var rv = this.rvfunc(i, numSteps);
    for (var j=0; j<numSegments; j++) {
      if (numSegments == this.shapePath.points.length) {
        p = this.shapePath.getPoint(j / (numSegments-1));
      }
      else {
        p = this.shapePath.getPointAt(j / (numSegments-1));
      }
      p.x *= ru;
      p.y *= rv;
      p = p.transformMat4(frame.m).add(frame.position);
      this.vertices.push(p);
      this.texCoords.push(new Vec2(j / numSegments, i / numSteps));
      this.normals.push(p.dup().sub(frame.position).normalize());
    }
  }

  if (caps) {
    this.vertices.push(this.frames[0].position);
    this.texCoords.push(new Vec2(0, 0));
    this.normals.push(this.frames[0].tangent.dup().scale(-1));
    this.vertices.push(this.frames[this.frames.length - 1].position);
    this.texCoords.push(new Vec2(0, 0));
    this.normals.push(this.frames[this.frames.length - 1].tangent.dup().scale(-1));
  }

  index = 0;
  for (var i=0; i<this.frames.length; i++) {
    for (var j=0; j<numSegments; j++) {
      if (i < numSteps - 1) {
        this.faces.push([index + (j + 1) % numSegments + numSegments, index + (j + 1) % numSegments, index + j, index + j + numSegments ]);
      }
    }
    index += numSegments;
  }
  if (this.path.isClosed()) {
    index -= numSegments;
    for (var j=0; j<numSegments; j++) {
      this.faces.push([(j + 1) % numSegments, index + (j + 1) % numSegments, index + j, j]);
    }
  }
  if (caps) {
    for (var j=0; j<numSegments; j++) {
      this.faces.push([j, (j + 1) % numSegments, this.vertices.length - 2]);
      this.faces.push([this.vertices.length - 1, index - numSegments + (j + 1) % numSegments, index - numSegments + j]);
    }
  }
};

Loft.prototype.makeShapePath = function(numSegments) {
  var shapePath = new Path();
  for (var i=0; i<numSegments; i++) {
    var t = i / numSegments;
    var a = t * 2 * Math.PI;
    var p = new Vec3(Math.cos(a), Math.sin(a), 0);
    shapePath.addPoint(p);
  }
  shapePath.close();
  return shapePath;
};

Loft.prototype.makeFrames = function(points, tangents, closed, rot) {
  if (rot == null) {
    rot = 0;
  }
  var tangent = tangents[0];
  var atx = Math.abs(tangent.x);
  var aty = Math.abs(tangent.y);
  var atz = Math.abs(tangent.z);
  var v = null;
  if (atz > atx && atz >= aty) {
    v = tangent.dup().cross(new Vec3(0, 1, 0));
  }
  else if (aty > atx && aty >= atz) {
    v = tangent.dup().cross(new Vec3(1, 0, 0));
  }
  else {
    v = tangent.dup().cross(new Vec3(0, 0, 1));
  }
  var normal = this.options.initialNormal || Vec3.create().asCross(tangent, v).normalize();
  var binormal = Vec3.create().asCross(tangent, normal).normalize();
  var prevBinormal = null;
  var prevNormal = null;
  var frames = [];
  var rotation = new Quat();
  v = new Vec3();
  for (var i = 0; i<this.points.length; i++) {
    var position = points[i];
    tangent = tangents[i];
    if (i > 0) {
      normal = normal.dup();
      binormal = binormal.dup();
      prevTangent = tangents[i - 1];
      v.asCross(prevTangent, tangent);
      if (v.length() > EPSILON) {
        v.normalize();
        theta = acos(prevTangent.dot(tangent));
        rotation.setAxisAngle(v, theta * 180 / PI);
        normal.transformQuat(rotation);
      }
      binormal.asCross(tangent, normal);
    }
    var m = new Mat4().set4x4r(binormal.x, normal.x, tangent.x, 0, binormal.y, normal.y, tangent.y, 0, binormal.z, normal.z, tangent.z, 0, 0, 0, 0, 1);
    frames.push({
      tangent: tangent,
      normal: normal,
      binormal: binormal,
      position: position,
      m: m
    });
  }
  if (closed) {
    firstNormal = frames[0].normal;
    lastNormal = frames[frames.length - 1].normal;
    theta = Math.acos(clamp(firstNormal.dot(lastNormal), 0, 1));
    theta /= frames.length - 1;
    if (tangents[0].dot(v.asCross(firstNormal, lastNormal)) > 0) {
      theta = -theta;
    }
    frames.forEach(function(frame, frameIndex) {
      rotation.setAxisAngle(frame.tangent, theta * frameIndex * 180 / PI);
      frame.normal.transformQuat(rotation);
      frame.binormal.asCross(frame.tangent, frame.normal);
      frame.m.set4x4r(frame.binormal.x, frame.normal.x, frame.tangent.x, 0, frame.binormal.y, frame.normal.y, frame.tangent.y, 0, frame.binormal.z, frame.normal.z, frame.tangent.z, 0, 0, 0, 0, 1);
    });
  }
  return frames;
};

Loft.prototype.samplePoints = function(path, numSteps, closed) {
  var points = [];
  var N = closed ? numSteps : (numSteps - 1);
  for(var i=0; i<numSteps; i++) {
    points.push(path.getPointAt(i / N));
  }
  return points;
};

Loft.prototype.sampleTangents = function(path, numSteps, closed) {
  var points = [];
  var N = closed ? numSteps : (numSteps - 1);
  for(var i=0; i<numSteps; i++) {
    points.push(path.getTangentAt(i / N));
  }
  return points;
};

Loft.prototype.makeRadiusFunction = function(r) {
  var rfunc;
  if (r instanceof Spline1D) {
    return rfunc = function(t, n) {
      return r.getPointAt(t / (n - 1));
    };
  }
  else {
    return rfunc = function(t) {
      return r;
    };
  }
};

Loft.prototype.toDebugLines = function(lineLength) {
  lineLength = lineLength || 0.5
  var lineBuilder = new LineBuilder();
  var red = { r: 1, g: 0, b: 0, a: 1};
  var green = { r: 0, g: 1, b: 0, a: 1};
  var blue = { r: 0, g: 0.5, b: 1, a: 1};
  this.frames.forEach(function(frame, frameIndex) {
    lineBuilder.addLine(frame.position, frame.position.dup().add(frame.tangent.dup().scale(lineLength)), red, red);
    lineBuilder.addLine(frame.position, frame.position.dup().add(frame.normal.dup().scale(lineLength)), green, green);
    lineBuilder.addLine(frame.position, frame.position.dup().add(frame.binormal.dup().scale(lineLength)), blue, blue);
  });
  return lineBuilder;
}


module.exports = Loft;

},{"./LineBuilder":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/LineBuilder.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Octahedron.js":[function(require,module,exports){
var geom = require('pex-geom');
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//Octahedron
//Based on http://paulbourke.net/geometry/platonic/
function Octahedron(r) {
  r = r || 0.5;

  var a = 1 / (2 * Math.sqrt(2));
  var b = 1 / 2;

  var s3 = Math.sqrt(3);
  var s6 = Math.sqrt(6);

  var vertices = [
    new Vec3(-a, 0, a), //front left
    new Vec3( a, 0, a), //front right
    new Vec3( a, 0,-a), //back right
    new Vec3(-a, 0,-a), //back left
    new Vec3( 0, b, 0), //top
    new Vec3( 0,-b, 0)  //bottom
  ];

  vertices = vertices.map(function(v) { return v.normalize().scale(r); })

  var faces = [
    [3, 0, 4],
    [2, 3, 4],
    [1, 2, 4],
    [0, 1, 4],
    [3, 2, 5],
    [0, 3, 5],
    [2, 1, 5],
    [1, 0, 5]
  ];

  var edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [0, 5],
    [1, 5],
    [2, 5],
    [3, 5]
  ];

  Geometry.call(this, { vertices: vertices, faces: faces, edges: edges });
}

Octahedron.prototype = Object.create(Geometry.prototype);

module.exports = Octahedron;
},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Plane.js":[function(require,module,exports){
//Plane geometry generator.

//## Parent class : [Geometry](../core/Geometry.html)

//## Example use
//      var plane = new Plane(1, 1, 10, 10, 'x', 'y');
//      var planeMesh = new Mesh(plane, new Materials.TestMaterial());

var geom = require('pex-geom');
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//## Reference
//### Plane ( sx, sy, nx, ny, u, v)
//`su` - size u / width *{ Number }*  
//`sv` - size v / height *{ Number }*  
//`nu` - number of subdivisions on u axis *{ Number/Int }*  
//`nv` - number of subdivisions on v axis *{ Number/Int }*  
//`u` - first axis *{ String }* = "x"
//`v` - second axis *{ Number/Int }* = "y"
function Plane(su, sv, nu, nv, u, v) {
  su = su || 1;
  sv = sv || su || 1;
  nu = nu || 1;
  nv = nv || nu || 1;
  u = u || 'x';
  v = v || 'y';

  Geometry.call(this, { vertices: true, normals: true, texCoords: true, faces: true, edges: true });

  var w = ['x', 'y', 'z'];
  w.splice(w.indexOf(u), 1);
  w.splice(w.indexOf(v), 1);
  w = w[0];

  var vertices = this.vertices;
  var texCoords = this.texCoords;
  var normals = this.normals;
  var faces = this.faces;
  var edges = this.edges;

  // How faces are constructed:
  //
  //     0-----1 . . 2       n  <----  n+1
  //     |   / .     .       |         A
  //     | /   .     .       V         |
  //     3 . . 4 . . 5      n+nu --> n+nu+1
  //     .     .     .
  //     .     .     .
  //     6 . . 7 . . 8
  //
  var vertShift = vertices.length;
  for(var j=0; j<=nv; ++j) {
    for(var i=0; i<=nu; ++i) {
      var vert = new Vec3();
      vert[u] = (-su/2 + i*su/nu);
      vert[v] = ( sv/2 - j*sv/nv);
      vert[w] = 0;
      vertices.push(vert);

      var texCoord = new Vec2(i/nu, 1.0 - j/nv);
      texCoords.push(texCoord);

      var normal = new Vec3();
      normal[u] = 0;
      normal[v] = 0;
      normal[w] = 1;
      normals.push(normal);
    }
  }
  for(var j=0; j<nv; ++j) {
    for(var i=0; i<nu; ++i) {
      var n = vertShift + j * (nu + 1) + i;
      var face = [n, n + nu  + 1, n + nu + 2, n + 1];

      edges.push([n, n + 1]);
      edges.push([n, n + nu + 1]);

      if (j == nv - 1) {
        edges.push([n + nu + 1, n + nu + 2]);
      }
      if (i == nu - 1) {
        edges.push([n + 1, n + nu + 2]);
      }
      faces.push(face);
    }
  }
}

Plane.prototype = Object.create(Geometry.prototype);

module.exports = Plane;
},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Sphere.js":[function(require,module,exports){
//Sphere geometry generator.

//## Parent class : [Geometry](../Geometry.html)

//## Example use
//      var sphere = new Sphere(1, 36, 36);
//      var sphereMesh = new Mesh(sphere, new Materials.TestMaterial());

var geom = require('pex-geom');
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//### Sphere ( r, nsides, nsegments )
//`r` - radius of the sphere *{ Number }*  
//`nsides` - number of subdivisions on XZ axis *{ Number }*  
//`nsegments` - number of subdivisions on Y axis *{ Number }*
function Sphere(r, nsides, nsegments) {
  r = r || 0.5;
  nsides = nsides || 36;
  nsegments = nsegments || 18;

  Geometry.call(this, { vertices: true, normals: true, texCoords: true, faces: true });

  var vertices = this.vertices;
  var texCoords = this.texCoords;
  var normals = this.normals;
  var faces = this.faces;

  var degToRad = 1/180.0 * Math.PI;

  var dphi   = 360.0/nsides;
  var dtheta = 180.0/nsegments;

  function evalPos(theta, phi) {
    var pos = new Vec3();
    pos.x = r * Math.sin(theta * degToRad) * Math.sin(phi * degToRad);
    pos.y = r * Math.cos(theta * degToRad);
    pos.z = r * Math.sin(theta * degToRad) * Math.cos(phi * degToRad);
    return pos;
  }

  for (var segment=0; segment<=nsegments; ++segment) {
    var theta = segment * dtheta;
    for (var side=0; side<=nsides; ++side) {
      var phi = side * dphi;
      var pos = evalPos(theta, phi);
      var normal = pos.dup().normalize();
      var texCoord = new Vec2(phi/360.0, theta/180.0);

      vertices.push(pos);
      normals.push(normal);
      texCoords.push(texCoord);

      if (segment == nsegments) continue;
      if (side == nsides) continue;

      if (segment == 0) {
        faces.push([
          (segment  )*(nsides+1) + side,
          (segment+1)*(nsides+1) + side,
          (segment+1)*(nsides+1) + side + 1
        ]);
      }
      else if (segment == nsegments - 1) {
        faces.push([
          (segment  )*(nsides+1) + side,
          (segment+1)*(nsides+1) + side + 1,
          (segment  )*(nsides+1) + side + 1
        ]);
      }
      else {
        faces.push([
          (segment  )*(nsides+1) + side,
          (segment+1)*(nsides+1) + side,
          (segment+1)*(nsides+1) + side + 1,
          (segment  )*(nsides+1) + side + 1
        ]);
      }
    }
  }

  this.computeEdges();
}

Sphere.prototype = Object.create(Geometry.prototype);

module.exports = Sphere;

},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/lib/Tetrahedron.js":[function(require,module,exports){
var geom = require('pex-geom');
var Vec3 = geom.Vec3;
var Geometry = geom.Geometry;

//Regular tetrahedron
//http://mathworld.wolfram.com/RegularTetrahedron.html
function Tetrahedron(r) {
  r = r || 0.5;

  var s3 = Math.sqrt(3);
  var s6 = Math.sqrt(6);

  var vertices = [
    new Vec3( s3/3, -s6/3 * 0.333 + s6*0.025,    0),   //right
    new Vec3(-s3/6, -s6/3 * 0.333 + s6*0.025,  1/2),   //left front
    new Vec3(-s3/6, -s6/3 * 0.333 + s6*0.025, -1/2),   //left back
    new Vec3(    0,  s6/3 * 0.666 + s6*0.025,    0)    //top
  ];;

  vertices = vertices.map(function(v) { return v.normalize().scale(r); })

  var faces = [
    [0, 1, 2],
    [3, 1, 0],
    [3, 0, 2],
    [3, 2, 1]
  ];

  var edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3]
  ];

  Geometry.call(this, { vertices: vertices, faces: faces, edges: edges });
}

Tetrahedron.prototype = Object.create(Geometry.prototype);

module.exports = Tetrahedron;
},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js":[function(require,module,exports){
module.exports.Vec2 = require('./lib/Vec2');
module.exports.Vec3 = require('./lib/Vec3');
module.exports.Vec4 = require('./lib/Vec4');
module.exports.Mat4 = require('./lib/Mat4');
module.exports.Quat = require('./lib/Quat');
module.exports.Path = require('./lib/Path');
module.exports.Rect = require('./lib/Rect');
module.exports.Spline3D = require('./lib/Spline3D');
module.exports.Spline2D = require('./lib/Spline2D');
module.exports.Spline1D = require('./lib/Spline1D');
module.exports.Ray = require('./lib/Ray');
module.exports.Plane = require('./lib/Plane');
module.exports.Geometry = require('./lib/Geometry');
module.exports.Random = require('./lib/Random');
module.exports.BoundingBox = require('./lib/BoundingBox');
module.exports.Triangle2D = require('./lib/Triangle2D');
module.exports.Triangle3D = require('./lib/Triangle3D');
module.exports.Octree = require('./lib/Octree');

//unpack Random methods to geom package
for(var funcName in module.exports.Random) {
  module.exports[funcName] = module.exports.Random[funcName];
}
},{"./lib/BoundingBox":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/BoundingBox.js","./lib/Geometry":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Geometry.js","./lib/Mat4":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Mat4.js","./lib/Octree":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Octree.js","./lib/Path":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Path.js","./lib/Plane":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Plane.js","./lib/Quat":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Quat.js","./lib/Random":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Random.js","./lib/Ray":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Ray.js","./lib/Rect":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Rect.js","./lib/Spline1D":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Spline1D.js","./lib/Spline2D":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Spline2D.js","./lib/Spline3D":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Spline3D.js","./lib/Triangle2D":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Triangle2D.js","./lib/Triangle3D":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Triangle3D.js","./lib/Vec2":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec2.js","./lib/Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js","./lib/Vec4":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec4.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/BoundingBox.js":[function(require,module,exports){
var Vec3 = require('./Vec3');

function BoundingBox(min, max) {
  this.min = min;
  this.max = max;
}

BoundingBox.fromPositionSize = function(pos, size) {
  return new BoundingBox(Vec3.create(pos.x - size.x / 2, pos.y - size.y / 2, pos.z - size.z / 2), Vec3.create(pos.x + size.x / 2, pos.y + size.y / 2, pos.z + size.z / 2));
};

BoundingBox.fromPoints = function(points) {
  var bbox = new BoundingBox(points[0].clone(), points[0].clone());
  points.forEach(bbox.addPoint.bind(bbox));
  return bbox;
};

BoundingBox.prototype.isEmpty = function() {
  if (!this.min || !this.max) return true;
  else return false;
};

BoundingBox.prototype.addPoint = function(p) {
  if (this.isEmpty()) {
    this.min = p.clone();
    this.max = p.clone();
  }
  if (p.x < this.min.x) this.min.x = p.x;
  if (p.y < this.min.y) this.min.y = p.y;
  if (p.z < this.min.z) this.min.z = p.z;
  if (p.x > this.max.x) this.max.x = p.x;
  if (p.y > this.max.y) this.max.y = p.y;
  if (p.z > this.max.z) this.max.z = p.z;
};

BoundingBox.prototype.getSize = function() {
  return Vec3.create(this.max.x - this.min.x, this.max.y - this.min.y, this.max.z - this.min.z);
};

BoundingBox.prototype.getCenter = function(out) {
  return Vec3.create(this.min.x + (this.max.x - this.min.x) / 2, this.min.y + (this.max.y - this.min.y) / 2, this.min.z + (this.max.z - this.min.z) / 2);
};

module.exports = BoundingBox;
},{"./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Geometry.js":[function(require,module,exports){
var Vec3 = require('./Vec3');

//where does this should go? geom.Utils expanded to geom?
function centroid(points) {
  var n = points.length;
  var center = points.reduce(function(center, p) {
    return center.add(p);
  }, new Vec3(0, 0, 0));
  center.scale(1 / points.length);
  return center;
}

function edgeLoop(edge, cb) {
  var curr = edge;

  var i = 0;
  do {
    cb(curr, i++);
    curr = next(curr);
  }
  while(curr != edge);
}

function vertexEdgeLoop(edge, cb) {
  var curr = edge;

  do {
    cb(curr);
    curr = prev(curr).opposite;
  }
  while(curr != edge);
}

function next(edge) {
  return edge.face.halfEdges[(edge.slot + 1) % edge.face.length]
}

function prev(edge) {
  return edge.face.halfEdges[(edge.slot - 1 + edge.face.length) % edge.face.length]
}

function elements(list, indices) {
  return indices.map(function(i) { return list[i]; })
}

function move(a, b, t) {
  return b.dup().sub(a).normalize().scale(t).add(a);
}

function Geometry(o) {
  o = o || {};
  this.attribs = {};

  if (o.vertices) this.addAttrib('vertices', 'position', o.vertices, false);
  if (o.normals) this.addAttrib('normals', 'normal', o.normals, false);
  if (o.texCoords) this.addAttrib('texCoords', 'texCoord', o.texCoords, false);
  if (o.tangents) this.addAttrib('tangents', 'tangent', o.tangents, false);
  if (o.colors) this.addAttrib('colors', 'color', o.colors, false);
  if (o.indices) this.addIndices(o.indices);
  if (o.edges) this.addEdges(o.edges);
  if (o.faces) this.addFaces(o.faces);
}

Geometry.prototype.addAttrib = function(propertyName, attributeName, data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this[propertyName] = data && data.length ? data : [];
  this[propertyName].name = attributeName;
  this[propertyName].dirty = true;
  this[propertyName].dynamic = dynamic;
  this.attribs[propertyName] = this[propertyName];
  return this;
};

Geometry.prototype.addFaces = function(data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this.faces = data && data.length ? data : [];
  this.faces.dirty = true;
  this.faces.dynamic = false;
  return this;
};

Geometry.prototype.addEdges = function(data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this.edges = data && data.length ? data : [];
  this.edges.dirty = true;
  this.edges.dynamic = false;
  return this;
};

Geometry.prototype.addIndices = function(data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this.indices = data && data.length ? data : [];
  this.indices.dirty = true;
  this.indices.dynamic = false;
  return this;
};

Geometry.prototype.isDirty = function(attibs) {
  var dirty = false;
  dirty || (dirty = this.faces && this.faces.dirty);
  dirty || (dirty = this.edges && this.edges.dirty);
  for (attribAlias in this.attribs) {
    var attrib = this.attribs[attribAlias];
    dirty || (dirty = attrib.dirty);
  }
  return dirty;
};

Geometry.prototype.addEdge = function(a, b) {
  if (!this.edges) {
    this.addEdges();
  }
  if (!this.edgeHash) {
    this.edgeHash = {};
  }
  var ab = a + '_' + b;
  var ba = b + '_' + a;
  if (!this.edgeHash[ab] && !this.edgeHash[ba]) {
    this.edges.push([a, b]);
    return this.edgeHash[ab] = this.edgeHash[ba] = true;
  }
};

Geometry.prototype.computeEdges = function() {
  if (!this.edges) {
    this.addEdges();
  }
  else {
    this.edgeHash = null;
    this.edges.length = 0;
  }

  if (this.faces && this.faces.length) {
    this.faces.forEach(function(face) {
      for(var i=0; i<face.length; i++) {
        this.addEdge(face[i], face[(i+1)%face.length]);
      }
    }.bind(this));
  }
  else {
    for (var i=0; i<this.vertices.length-1; i++) {
      this.addEdge(i, i+1);
    }
  }
};

Geometry.prototype.computeNormals = function() {
  if (!this.faces) {
    throw 'Geometry[2]omputeSmoothNormals no faces found';
  }
  if (!this.normals) {
    this.addAttrib('normals', 'normal', null, false);
  }

  if (this.normals.length > this.vertices.length) {
    this.normals.length = vertices.length;
  }
  else {
    while (this.normals.length < this.vertices.length) {
      this.normals.push(new Vec3(0, 0, 0));
    }
  }

  var count = [];
  this.vertices.forEach(function(v, i) {
    count[i] = 0;
  }.bind(this));

  var ab = new Vec3();
  var ac = new Vec3();
  var n = new Vec3();

  this.faces.forEach(function(f) {
    var a = this.vertices[f[0]];
    var b = this.vertices[f[1]];
    var c = this.vertices[f[2]];
    ab.asSub(b, a).normalize();
    ac.asSub(c, a).normalize();
    n.asCross(ab, ac);
    for(var i=0; i<f.length; i++) {
      this.normals[f[i]].add(n);
      count[f[i]]++;
    }
  }.bind(this));

  this.normals.forEach(function(n, i) {
    n.normalize();
  });
};

Geometry.prototype.toFlatGeometry = function() {
  var g = new Geometry({ vertices: true, faces: true });

  var vertices = this.vertices;

  this.faces.forEach(function(face) {
    var newFace = [];
    face.forEach(function(vi) {
      newFace.push(g.vertices.length);
      g.vertices.push(vertices[vi]);
    });
    g.faces.push(newFace);
  });

  return g;
}

Geometry.prototype.clone = function() {
  var edges = null;
  var vertices = this.vertices.map(function(v) { return v.dup(); });
  var texCoords = this.texCoords ? this.texCoords.map(function(tc) { return tc.dup(); }) : null;
  var faces = this.faces.map(function(f) { return f.slice(0); });
  var edges = this.edges ? this.edges.map(function(e) { return e.slice(0); }) : null;
  return new Geometry({ vertices: vertices, texCoords: texCoords, faces: faces, edges: edges });
}

Geometry.prototype.triangulate = function() {
  var g = this.clone();
  g.faces = [];
  this.faces.forEach(function(face) {
    g.faces.push([face[0],face[1],face[2]]);
    for(var i=2; i<face.length-1; i++) {
      g.faces.push([face[0],face[i],face[i+1]]);
    }

  });
  return g;
}

//Based on ideas from
//http://fgiesen.wordpress.com/2012/04/03/half-edges-redux/
Geometry.prototype.computeHalfEdges = function() {
  var halfEdges = this.halfEdges = [];
  var faces = this.faces;

  faces.forEach(function(face, faceIndex) {
    face.halfEdges = [];
    face.forEach(function(vertexIndex, i) {
      var v0 = vertexIndex;
      var v1 = face[(i + 1) % face.length];
      var halfEdge = {
        edgeIndex: halfEdges.length,
        face: face,
        faceIndex: faceIndex,
        //vertexIndex: vertexIndex,
        slot: i,
        opposite: null,
        v0: Math.min(v0, v1),
        v1: Math.max(v0, v1)
      };
      face.halfEdges.push(halfEdge);
      halfEdges.push(halfEdge);
    });
  });

  halfEdges.sort(function(a, b) {
    if (a.v0 > b.v0) return 1;
    else if (a.v0 < b.v0) return -1;
    else if (a.v1 > b.v1) return 1;
    else if (a.v1 < b.v1) return -1;
    else return 0;
  });

  for(var i=1; i<halfEdges.length; i++) {
    var prev = halfEdges[i-1];
    var curr = halfEdges[i];
    if (prev.v0 == curr.v0 && prev.v1 == curr.v1) {
      prev.opposite = curr;
      curr.opposite = prev;
    }
  }

  return halfEdges;
}

Geometry.prototype.subdivideEdges = function() {
  var vertices = this.vertices;
  var faces = this.faces;

  var halfEdges = this.computeHalfEdges();

  var newVertices = vertices.map(function(v) { return v; });
  var newFaces = [];

  //edge points are an average of both edge vertices
  var edgePoints = [];
  //console.log('halfEdges', halfEdges.length, halfEdges.map(function(e) { return '' + (e.v0) + '-' + (e.v1); }));
  halfEdges.forEach(function(e) {
    if (!edgePoints[e.edgeIndex]) {
      var midPoint = centroid([
        vertices[e.face[e.slot]],
        vertices[next(e).face[next(e).slot]]
      ]);
      edgePoints[e.edgeIndex] = midPoint;
      edgePoints[e.opposite.edgeIndex] = midPoint;
      newVertices.push(midPoint);
    }
  });

  faces.forEach(function(face) {
    var newFace = [];
    edgeLoop(face.halfEdges[0], function(edge) {
      newFace.push(newVertices.indexOf(edgePoints[edge.edgeIndex]));
    });
    newFaces.push(newFace);
  });

  var visitedVertices = [];
  var verts = 0;
  halfEdges.forEach(function(e) {
    if (visitedVertices.indexOf(e.face[e.slot]) !== -1) return;
    visitedVertices.push(e.face[e.slot]);
    var neighborPoints = [];
    vertexEdgeLoop(e, function(edge) {
      neighborPoints.push(newVertices.indexOf(edgePoints[edge.edgeIndex]));
    });
    neighborPoints.forEach(function(point, i) {
      var nextPoint = neighborPoints[(i+1)%neighborPoints.length];
      newFaces.push([e.face[e.slot], point, nextPoint]);
    });
  });

  var g = new Geometry({ vertices: newVertices, faces: newFaces });
  g.computeEdges();

  return g;
}

Geometry.prototype.getFaceVertices = function(face) {
  return face.map(function(i) { return this.vertices[i]; }.bind(this));
}

//Non destructive Catmull-Clark subdivision
//Catmull-Clark subdivision for half-edge meshes
//Based on http://en.wikipedia.org/wiki/Catmull–Clark_subdivision_surface
//TODO: Study Doo-Sabin scheme for new vertices 1/n*F + 1/n*R + (n-2)/n*v
//http://www.cse.ohio-state.edu/~tamaldey/course/784/note20.pdf
//
//The shading part at the moment is that we put all vertices together at the end and have to manually
//calculate offsets at which each vertex, face and edge point end up
Geometry.prototype.catmullClark = function() {
  var vertices = this.vertices;
  var faces = this.faces;
  var halfEdges = this.computeHalfEdges();

  //face points are an average of all face points
  var facePoints = faces.map(this.getFaceVertices.bind(this)).map(centroid);

  //edge points are an average of both edge vertices and center points of two neighbor faces
  var edgePoints = [];
  halfEdges.forEach(function(e) {
    if (!edgePoints[e.edgeIndex]) {
      var midPoint = centroid([
        vertices[e.v0],
        vertices[e.v1],
        facePoints[e.faceIndex],
        facePoints[e.opposite.faceIndex]
      ]);
      edgePoints[e.edgeIndex] = midPoint;
      edgePoints[e.opposite.edgeIndex] = midPoint;
    }
  });

  //vertex points are and average of neighbor edges' edge points and neighbor faces' face points
  var vertexPoints = [];
  halfEdges.map(function(edge) {
    var vertexIndex = faces[edge.faceIndex][edge.slot];
    var vertex = vertices[vertexIndex];
    if (vertexPoints[vertexIndex]) return;
    var neighborFacePoints = [];
    //vertexEdgeLoop(edge).map(function(edge) { return facePoints[edge.faceIndex] } )
    //vertexEdgeLoop(edge).map(function(edge) { return edge.face.facePoint } )
    //extract(facePoints, vertexEdgeLoop(edge).map(prop('faceIndex'))
    var neighborEdgeMidPoints = [];
    vertexEdgeLoop(edge, function(edge) {
      neighborFacePoints.push(facePoints[edge.faceIndex]);
      neighborEdgeMidPoints.push(centroid([vertices[edge.v0], vertices[edge.v1]]));
    });
    var facesCentroid = centroid(neighborFacePoints);
    var edgesCentroid = centroid(neighborEdgeMidPoints);

    var n = neighborFacePoints.length;
    var v = new Vec3(0, 0, 0);
    v.add(facesCentroid);
    v.add(edgesCentroid.dup().scale(2));
    v.add(vertex.dup().scale(n - 3));
    v.scale(1/n);

    vertexPoints[vertexIndex] = v;
  });

  //create list of points for the new mesh
  //vertx poitns and face points are unique
  var newVertices = vertexPoints.concat(facePoints);

  //halfEdge mid points are not (each one is doubled)
  halfEdges.forEach(function(e) {
    if (e.added > -1) return;
    e.added = newVertices.length;
    e.opposite.added = newVertices.length;
    newVertices.push(edgePoints[e.edgeIndex]);
  })

  var newFaces = [];
  var newEdges = [];

  //construct new faces from face point, two edges mid points and a vertex between them
  faces.forEach(function(face, faceIndex) {
    var facePointIndex = faceIndex + vertexPoints.length;
    edgeLoop(face.halfEdges[0], function(edge) {
      var edgeMidPointsIndex = edge.added;
      var nextEdge = next(edge);
      var nextEdgeVertexIndex = face[nextEdge.slot];
      var nextEdgeMidPointIndex = nextEdge.added;
      newEdges.push([facePointIndex, edgeMidPointsIndex]);
      newEdges.push([edgeMidPointsIndex, nextEdgeVertexIndex]);
      newFaces.push([facePointIndex, edgeMidPointsIndex, nextEdgeVertexIndex, nextEdgeMidPointIndex])
    });
  });

  return new Geometry({ vertices: newVertices, faces: newFaces, edges: newEdges });
}

//Doo-Sabin subdivision as desribed in WIRE AND COLUMN MODELING
//http://repository.tamu.edu/bitstream/handle/1969.1/548/etd-tamu-2004A-VIZA-mandal-1.pdf  
Geometry.prototype.dooSabin = function(depth) {
  var vertices = this.vertices;
  var faces = this.faces;
  var halfEdges = this.computeHalfEdges();

  var newVertices = [];
  var newFaces = [];
  var newEdges = [];

  depth = depth || 0.1;

  var facePointsByFace = [];

  var self = this;

  faces.forEach(function(face, faceIndex) {
    var facePoints = facePointsByFace[faceIndex] = [];
    edgeLoop(face.halfEdges[0], function(edge) {
      var v = vertices[edge.face[edge.slot]];
      var p = centroid([
        v,
        centroid(elements(vertices, edge.face)),
        centroid(elements(vertices, [edge.v0, edge.v1])),
        centroid(elements(vertices, [prev(edge).v0, prev(edge).v1]))
      ]);
      facePoints.push(newVertices.length);
      newVertices.push(move(v, p, depth));
      //newVertices.push(p);
    });
    return facePoints;
  });

  //face face
  faces.forEach(function(face, faceIndex) {
    newFaces.push(facePointsByFace[faceIndex]);
  });

  halfEdges.forEach(function(edge, edgeIndex) {
    if (edge.edgeVisited) return;

    edge.edgeVisited = true;
    edge.opposite.edgeVisited = true;

    //edge face
    var e0 = edge;
    var e1 = next(e0.opposite);
    var e2 = e0.opposite;
    var e3 = next(e0);
    var newFace = [
      facePointsByFace[e0.faceIndex][e0.slot],
      facePointsByFace[e1.faceIndex][e1.slot],
      facePointsByFace[e2.faceIndex][e2.slot],
      facePointsByFace[e3.faceIndex][e3.slot]
    ];
    newFaces.push(newFace);
    newEdges.push([newFace[0], newFace[3]]);
    newEdges.push([newFace[1], newFace[2]]);
  });

  halfEdges.forEach(function(edge, edgeIndex) {
    if (edge.vertexVisited) return;

    //vertex face
    var vertexFace = [];
    vertexEdgeLoop(edge, function(e) {
      e.vertexVisited = true;
      vertexFace.push(facePointsByFace[e.faceIndex][e.slot])
    });
    newFaces.push(vertexFace)
    vertexFace.forEach(function(i, index) {
      newEdges.push([i, vertexFace[(index+1)%vertexFace.length]]);
    });
  });

  return new Geometry({ vertices: newVertices, faces: newFaces, edges: newEdges });
}

//Mesh wire modelling as described in
//http://repository.tamu.edu/bitstream/handle/1969.1/548/etd-tamu-2004A-VIZA-mandal-1.pdf  
Geometry.prototype.wire = function(edgeDepth, insetDepth) {
  insetDepth = (insetDepth != null) ? insetDepth : (edgeDepth || 0.1);
  edgeDepth = edgeDepth || 0.1;
  var newGeom = this.dooSabin(edgeDepth);
  newGeom.computeNormals();
  var halfEdges = newGeom.computeHalfEdges();
  var innerGeom = this.dooSabin(edgeDepth);
  innerGeom.computeNormals();

  //shrink the inner geometry
  innerGeom.vertices.forEach(function(v, vi) {
    v.sub(innerGeom.normals[vi].dup().scale(insetDepth));
  });

  //remove middle faces
  var cutFaces = newGeom.faces.splice(0, this.faces.length);
  innerGeom.faces.splice(0, this.faces.length);

  var vertexOffset = newGeom.vertices.length;

  //add inner vertices to new geom
  innerGeom.vertices.forEach(function(v, vi) {
    newGeom.vertices.push(v);
  });

  //add inner faces to new geom
  innerGeom.faces.forEach(function(f) {
    newGeom.faces.push(f.map(function(vi) {
      return vi + vertexOffset;
    }).reverse());
  });

  //add inner edges to new geom
  innerGeom.edges.forEach(function(e) {
    newGeom.edges.push(e.map(function(vi) {
      return vi + vertexOffset;
    }));
  });

  cutFaces.forEach(function(face) {
    edgeLoop(face.halfEdges[0], function(e) {
      var pe = prev(e);
      newGeom.faces.push([
        pe.face[pe.slot],
        e.face[e.slot],
        e.face[e.slot] + vertexOffset,
        pe.face[pe.slot] + vertexOffset
      ]);

      newGeom.edges.push([
        pe.face[pe.slot],
        pe.face[pe.slot] + vertexOffset
      ]);

      newGeom.edges.push([
        e.face[e.slot],
        e.face[e.slot] + vertexOffset
      ]);
    });
  });

  return newGeom;
}

Geometry.prototype.extrude = function(height, faceIndices, shrink) {
  height = height || 0.1;
  shrink = shrink || 0;
  if (!faceIndices) faceIndices = this.faces.map(function(face, faceIndex) { return faceIndex; });
  var g = this.clone();
  var halfEdges = g.computeHalfEdges();

  var ab = new Vec3();
  var ac = new Vec3();
  var faceNormal = new Vec3();
  var tmp = new Vec3();

  faceIndices.forEach(function(faceIndex) {
    var face = g.faces[faceIndex];
    var faceVerts = elements(g.vertices, face);
    var faceTexCoords = g.texCoords ? elements(g.texCoords, face) : null;

    var a = faceVerts[0];
    var b = faceVerts[1];
    var c = faceVerts[2];
    ab.asSub(b, a).normalize();
    ac.asSub(c, a).normalize();
    faceNormal.asCross(ab, ac).normalize();
    faceNormal.scale(height);

    var newVerts = faceVerts.map(function(v) {
      return v.dup().add(faceNormal);
    });

    var newVertsIndices = [];

    newVerts.forEach(function(nv) {
      newVertsIndices.push(g.vertices.length);
      g.vertices.push(nv);
    });

    if (faceTexCoords) {
      var newTexCoords = faceTexCoords.map(function(tc) {
        return tc.dup();
      });

      newTexCoords.forEach(function(tc) {
        g.texCoords.push(tc);
      });
    }

    if (shrink) {
      var c = centroid(newVerts);
      newVerts.forEach(function(nv) {
        tmp.asSub(c, nv);
        tmp.scale(shrink);
        nv.add(tmp);
      })
    }

    //add new face for each extruded edge
    edgeLoop(face.halfEdges[0], function(e) {
      g.faces.push([
        face[e.slot],
        face[next(e).slot],
        newVertsIndices[next(e).slot],
        newVertsIndices[e.slot]
      ]);
    });

    //add edges
    if (g.edges) {
      newVertsIndices.forEach(function(i, index) {
        g.edges.push([i, face[index]]);
      });
      newVertsIndices.forEach(function(i, index) {
        g.edges.push([i, newVertsIndices[(index+1)%newVertsIndices.length]]);
      });
    }

    //push the old face outside
    newVertsIndices.forEach(function(nvi, i) {
      face[i] = nvi;
    });
  });

  return g;
}

module.exports = Geometry;

},{"./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Mat4.js":[function(require,module,exports){
var Vec3 = require('./Vec3');

function Mat4() {
  this.reset();
}

Mat4.create = function() {
  return new Mat4();
};

Mat4.prototype.equals = function(m, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(m.a11 - this.a11) <= tolerance) && (Math.abs(m.a12 - this.a12) <= tolerance) && (Math.abs(m.a13 - this.a13) <= tolerance) && (Math.abs(m.a14 - this.a14) <= tolerance) && (Math.abs(m.a21 - this.a21) <= tolerance) && (Math.abs(m.a22 - this.a22) <= tolerance) && (Math.abs(m.a23 - this.a23) <= tolerance) && (Math.abs(m.a24 - this.a24) <= tolerance) && (Math.abs(m.a31 - this.a31) <= tolerance) && (Math.abs(m.a32 - this.a32) <= tolerance) && (Math.abs(m.a33 - this.a33) <= tolerance) && (Math.abs(m.a34 - this.a34) <= tolerance) && (Math.abs(m.a41 - this.a41) <= tolerance) && (Math.abs(m.a42 - this.a42) <= tolerance) && (Math.abs(m.a43 - this.a43) <= tolerance) && (Math.abs(m.a44 - this.a44) <= tolerance);
};

Mat4.prototype.hash = function() {
  return this.a11 * 0.01 + this.a12 * 0.02 + this.a13 * 0.03 + this.a14 * 0.04 + this.a21 * 0.05 + this.a22 * 0.06 + this.a23 * 0.07 + this.a24 * 0.08 + this.a31 * 0.09 + this.a32 * 0.10 + this.a33 * 0.11 + this.a34 * 0.12 + this.a41 * 0.13 + this.a42 * 0.14 + this.a43 * 0.15 + this.a44 * 0.16;
};

Mat4.prototype.set4x4r = function(a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44) {
  this.a11 = a11;
  this.a12 = a12;
  this.a13 = a13;
  this.a14 = a14;
  this.a21 = a21;
  this.a22 = a22;
  this.a23 = a23;
  this.a24 = a24;
  this.a31 = a31;
  this.a32 = a32;
  this.a33 = a33;
  this.a34 = a34;
  this.a41 = a41;
  this.a42 = a42;
  this.a43 = a43;
  this.a44 = a44;
  return this;
};

Mat4.prototype.copy = function(m) {
  this.a11 = m.a11;
  this.a12 = m.a12;
  this.a13 = m.a13;
  this.a14 = m.a14;
  this.a21 = m.a21;
  this.a22 = m.a22;
  this.a23 = m.a23;
  this.a24 = m.a24;
  this.a31 = m.a31;
  this.a32 = m.a32;
  this.a33 = m.a33;
  this.a34 = m.a34;
  this.a41 = m.a41;
  this.a42 = m.a42;
  this.a43 = m.a43;
  this.a44 = m.a44;
  return this;
};

Mat4.prototype.dup = function() {
  return Mat4.create().copy(this);
};

Mat4.prototype.reset = function() {
  this.set4x4r(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  return this;
};

Mat4.prototype.identity = function() {
  this.reset();
  return this;
};

Mat4.prototype.mul4x4r = function(b11, b12, b13, b14, b21, b22, b23, b24, b31, b32, b33, b34, b41, b42, b43, b44) {
  var a11 = this.a11;
  var a12 = this.a12;
  var a13 = this.a13;
  var a14 = this.a14;
  var a21 = this.a21;
  var a22 = this.a22;
  var a23 = this.a23;
  var a24 = this.a24;
  var a31 = this.a31;
  var a32 = this.a32;
  var a33 = this.a33;
  var a34 = this.a34;
  var a41 = this.a41;
  var a42 = this.a42;
  var a43 = this.a43;
  var a44 = this.a44;
  this.a11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
  this.a12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
  this.a13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
  this.a14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
  this.a21 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
  this.a22 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
  this.a23 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
  this.a24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
  this.a31 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
  this.a32 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
  this.a33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
  this.a34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
  this.a41 = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
  this.a42 = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
  this.a43 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
  this.a44 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
  return this;
};

Mat4.prototype.perspective = function(fovy, aspect, znear, zfar) {
  var f = 1.0 / Math.tan(fovy / 180 * Math.PI / 2);
  var nf = 1.0 / (znear - zfar);
  this.mul4x4r(f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (zfar + znear) * nf, 2 * znear * zfar * nf, 0, 0, -1, 0);
  return this;
};

Mat4.prototype.ortho = function(l, r, b, t, n, f) {
  this.mul4x4r(2 / (r - l), 0, 0, (r + l) / (l - r), 0, 2 / (t - b), 0, (t + b) / (b - t), 0, 0, 2 / (n - f), (f + n) / (n - f), 0, 0, 0, 1);
  return this;
};

Mat4.prototype.lookAt = function(eye, target, up) {
  var z = (Vec3.create(eye.x - target.x, eye.y - target.y, eye.z - target.z)).normalize();
  var x = (Vec3.create(up.x, up.y, up.z)).cross(z).normalize();
  var y = Vec3.create().copy(z).cross(x).normalize();
  this.mul4x4r(x.x, x.y, x.z, 0, y.x, y.y, y.z, 0, z.x, z.y, z.z, 0, 0, 0, 0, 1);
  this.translate(-eye.x, -eye.y, -eye.z);
  return this;
};

Mat4.prototype.translate = function(dx, dy, dz) {
  this.mul4x4r(1, 0, 0, dx, 0, 1, 0, dy, 0, 0, 1, dz, 0, 0, 0, 1);
  return this;
};

Mat4.prototype.rotate = function(theta, x, y, z) {
  var s = Math.sin(theta);
  var c = Math.cos(theta);
  this.mul4x4r(x * x * (1 - c) + c, x * y * (1 - c) - z * s, x * z * (1 - c) + y * s, 0, y * x * (1 - c) + z * s, y * y * (1 - c) + c, y * z * (1 - c) - x * s, 0, x * z * (1 - c) - y * s, y * z * (1 - c) + x * s, z * z * (1 - c) + c, 0, 0, 0, 0, 1);
  return this;
};

Mat4.prototype.asMul = function(a, b) {
  var a11 = a.a11;
  var a12 = a.a12;
  var a13 = a.a13;
  var a14 = a.a14;
  var a21 = a.a21;
  var a22 = a.a22;
  var a23 = a.a23;
  var a24 = a.a24;
  var a31 = a.a31;
  var a32 = a.a32;
  var a33 = a.a33;
  var a34 = a.a34;
  var a41 = a.a41;
  var a42 = a.a42;
  var a43 = a.a43;
  var a44 = a.a44;
  var b11 = b.a11;
  var b12 = b.a12;
  var b13 = b.a13;
  var b14 = b.a14;
  var b21 = b.a21;
  var b22 = b.a22;
  var b23 = b.a23;
  var b24 = b.a24;
  var b31 = b.a31;
  var b32 = b.a32;
  var b33 = b.a33;
  var b34 = b.a34;
  var b41 = b.a41;
  var b42 = b.a42;
  var b43 = b.a43;
  var b44 = b.a44;
  this.a11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
  this.a12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
  this.a13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
  this.a14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
  this.a21 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
  this.a22 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
  this.a23 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
  this.a24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
  this.a31 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
  this.a32 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
  this.a33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
  this.a34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
  this.a41 = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
  this.a42 = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
  this.a43 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
  this.a44 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
  return this;
};

Mat4.prototype.mul = function(b) {
  return this.asMul(this, b);
};

Mat4.prototype.scale = function(sx, sy, sz) {
  this.mul4x4r(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
  return this;
};

Mat4.prototype.invert = function() {
  var x0 = this.a11;
  var x1 = this.a12;
  var x2 = this.a13;
  var x3 = this.a14;
  var x4 = this.a21;
  var x5 = this.a22;
  var x6 = this.a23;
  var x7 = this.a24;
  var x8 = this.a31;
  var x9 = this.a32;
  var x10 = this.a33;
  var x11 = this.a34;
  var x12 = this.a41;
  var x13 = this.a42;
  var x14 = this.a43;
  var x15 = this.a44;
  var a0 = x0 * x5 - x1 * x4;
  var a1 = x0 * x6 - x2 * x4;
  var a2 = x0 * x7 - x3 * x4;
  var a3 = x1 * x6 - x2 * x5;
  var a4 = x1 * x7 - x3 * x5;
  var a5 = x2 * x7 - x3 * x6;
  var b0 = x8 * x13 - x9 * x12;
  var b1 = x8 * x14 - x10 * x12;
  var b2 = x8 * x15 - x11 * x12;
  var b3 = x9 * x14 - x10 * x13;
  var b4 = x9 * x15 - x11 * x13;
  var b5 = x10 * x15 - x11 * x14;
  var invdet = 1 / (a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0);
  this.a11 = (+x5 * b5 - x6 * b4 + x7 * b3) * invdet;
  this.a12 = (-x1 * b5 + x2 * b4 - x3 * b3) * invdet;
  this.a13 = (+x13 * a5 - x14 * a4 + x15 * a3) * invdet;
  this.a14 = (-x9 * a5 + x10 * a4 - x11 * a3) * invdet;
  this.a21 = (-x4 * b5 + x6 * b2 - x7 * b1) * invdet;
  this.a22 = (+x0 * b5 - x2 * b2 + x3 * b1) * invdet;
  this.a23 = (-x12 * a5 + x14 * a2 - x15 * a1) * invdet;
  this.a24 = (+x8 * a5 - x10 * a2 + x11 * a1) * invdet;
  this.a31 = (+x4 * b4 - x5 * b2 + x7 * b0) * invdet;
  this.a32 = (-x0 * b4 + x1 * b2 - x3 * b0) * invdet;
  this.a33 = (+x12 * a4 - x13 * a2 + x15 * a0) * invdet;
  this.a34 = (-x8 * a4 + x9 * a2 - x11 * a0) * invdet;
  this.a41 = (-x4 * b3 + x5 * b1 - x6 * b0) * invdet;
  this.a42 = (+x0 * b3 - x1 * b1 + x2 * b0) * invdet;
  this.a43 = (-x12 * a3 + x13 * a1 - x14 * a0) * invdet;
  this.a44 = (+x8 * a3 - x9 * a1 + x10 * a0) * invdet;
  return this;
};

Mat4.prototype.transpose = function() {
  var a11 = this.a11;
  var a12 = this.a12;
  var a13 = this.a13;
  var a14 = this.a14;
  var a21 = this.a21;
  var a22 = this.a22;
  var a23 = this.a23;
  var a24 = this.a24;
  var a31 = this.a31;
  var a32 = this.a32;
  var a33 = this.a33;
  var a34 = this.a34;
  var a41 = this.a41;
  var a42 = this.a42;
  var a43 = this.a43;
  var a44 = this.a44;
  this.a11 = a11;
  this.a12 = a21;
  this.a13 = a31;
  this.a14 = a41;
  this.a21 = a12;
  this.a22 = a22;
  this.a23 = a32;
  this.a24 = a42;
  this.a31 = a13;
  this.a32 = a23;
  this.a33 = a33;
  this.a34 = a43;
  this.a41 = a14;
  this.a42 = a24;
  this.a43 = a34;
  this.a44 = a44;
  return this;
};

Mat4.prototype.toArray = function() {
  return [this.a11, this.a21, this.a31, this.a41, this.a12, this.a22, this.a32, this.a42, this.a13, this.a23, this.a33, this.a43, this.a14, this.a24, this.a34, this.a44];
};

Mat4.prototype.fromArray = function(a) {
  this.a11 = a[0](this.a21 = a[1](this.a31 = a[2](this.a41 = a[3])));
  this.a12 = a[4](this.a22 = a[5](this.a32 = a[6](this.a42 = a[7])));
  this.a13 = a[8](this.a23 = a[9](this.a33 = a[10](this.a43 = a[11])));
  this.a14 = a[12](this.a24 = a[13](this.a34 = a[14](this.a44 = a[15])));
  return this;
};

module.exports = Mat4;

},{"./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Octree.js":[function(require,module,exports){
var geom = require('pex-geom');

var Vec3 = geom.Vec3;

//position is bottom left corner of the cell
function Octree(position, size, accuracy) {
  this.maxDistance = Math.max(size.x, Math.max(size.y, size.z));
  this.accuracy = 0;
  this.root = new Octree.Cell(this, position, size, 0);
}

Octree.fromBoundingBox = function (bbox) {
  return new Octree(bbox.min.clone(), bbox.getSize().clone());
};

Octree.MaxLevel = 8;

Octree.prototype.add = function (p, data) {
  this.root.add(p, data);
};

//check if the point was already added to the octreee
Octree.prototype.has = function (p) {
  return this.root.has(p);
};

Octree.prototype.findNearestPoint = function (p, options) {
  options = options || { };
  var result = this.root.findNearestPoint(p, Infinity, options);
  if (result) {
    if (options.includeData) return result;
    else return result.point;
  }
  else return null;
};

Octree.prototype.findNearbyPoints = function (p, r, options) {
  options = options || { };
  var result = { points: [], data: [] };
  this.root.findNearbyPoints(p, r, result, options);
  return result;
};

Octree.prototype.getAllCellsAtLevel = function (cell, level, result) {
  if (typeof level == 'undefined') {
    level = cell;
    cell = this.root;
  }
  result = result || [];
  if (cell.level == level) {
    if (cell.points.length > 0) {
      result.push(cell);
    }
    return result;
  } else {
    cell.children.forEach(function (child) {
      this.getAllCellsAtLevel(child, level, result);
    }.bind(this));
    return result;
  }
};

Octree.Cell = function (tree, position, size, level) {
  this.tree = tree;
  this.position = position;
  this.size = size;
  this.level = level;
  this.points = [];
  this.data = [];
  this.temp = new Vec3(); //temp vector for distance calculation
  this.children = [];
};

Octree.Cell.prototype.has = function (p) {
  if (!this.contains(p))
    return null;
  if (this.children.length > 0) {
    for (var i = 0; i < this.children.length; i++) {
      var duplicate = this.children[i].has(p);
      if (duplicate) {
        return duplicate;
      }
    }
    return null;
  } else {
    var minDistSqrt = this.tree.accuracy * this.tree.accuracy;
    for (var i = 0; i < this.points.length; i++) {
      var o = this.points[i];
      var distSq = p.squareDistance(o);
      if (distSq <= minDistSqrt) {
        return o;
      }
    }
    return null;
  }
};

Octree.Cell.prototype.add = function (p, data) {
  this.points.push(p);
  this.data.push(data);
  if (this.children.length > 0) {
    this.addToChildren(p, data);
  } else {
    if (this.points.length > 1 && this.level < Octree.MaxLevel) {
      this.split();
    }
  }
};

Octree.Cell.prototype.addToChildren = function (p, data) {
  for (var i = 0; i < this.children.length; i++) {
    if (this.children[i].contains(p)) {
      this.children[i].add(p, data);
      break;
    }
  }
};

Octree.Cell.prototype.contains = function (p) {
  return p.x >= this.position.x - this.tree.accuracy
      && p.y >= this.position.y - this.tree.accuracy
      && p.z >= this.position.z - this.tree.accuracy
      && p.x < this.position.x + this.size.x + this.tree.accuracy
      && p.y < this.position.y + this.size.y + this.tree.accuracy
      && p.z < this.position.z + this.size.z + this.tree.accuracy;
};

// 1 2 3 4
// 5 6 7 8
Octree.Cell.prototype.split = function () {
  var x = this.position.x;
  var y = this.position.y;
  var z = this.position.z;
  var w2 = this.size.x / 2;
  var h2 = this.size.y / 2;
  var d2 = this.size.z / 2;
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y + h2, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y + h2, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y + h2, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y + h2, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  for (var i = 0; i < this.points.length; i++) {
    this.addToChildren(this.points[i], this.data[i]);
  }
};

Octree.Cell.prototype.squareDistanceToCenter = function(p) {
  var dx = p.x - (this.position.x + this.size.x / 2);
  var dy = p.y - (this.position.y + this.size.y / 2);
  var dz = p.z - (this.position.z + this.size.z / 2);
  return dx * dx + dy * dy + dz * dz;
}

Octree.Cell.prototype.findNearestPoint = function (p, bestDist, options) {
  var nearest = null;
  var nearestData = null;
  if (this.points.length > 0 && this.children.length == 0) {
    for (var i = 0; i < this.points.length; i++) {
      var dist = this.points[i].distance(p);
      if (dist <= bestDist) {
        if (dist == 0 && options.notSelf)
          continue;
        bestDist = dist;
        nearest = this.points[i];
        nearestData = this.data[i];
      }
    }
  }

  var children = this.children;

  //traverse children in order from closest to furthest
  var children = this.children
    .map(function(child) { return { child: child, dist: child.squareDistanceToCenter(p) } })
    .sort(function(a, b) { return a.dist - b.dist; })
    .map(function(c) { return c.child; });

  if (children.length > 0) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.points.length > 0) {
        if (p.x < child.position.x - bestDist || p.x > child.position.x + child.size.x + bestDist ||
            p.y < child.position.y - bestDist || p.y > child.position.y + child.size.y + bestDist ||
            p.z < child.position.z - bestDist || p.z > child.position.z + child.size.z + bestDist
          ) {
          continue;
        }
        var childNearest = child.findNearestPoint(p, bestDist, options);
        if (!childNearest || !childNearest.point) {
          continue;
        }
        var childNearestDist = childNearest.point.distance(p);
        if (childNearestDist < bestDist) {
          nearest = childNearest.point;
          bestDist = childNearestDist;
          nearestData = childNearest.data;
        }
      }
    }
  }
  return {
    point: nearest,
    data: nearestData
  }
};

Octree.Cell.prototype.findNearbyPoints = function (p, r, result, options) {
  if (this.points.length > 0 && this.children.length == 0) {
    for (var i = 0; i < this.points.length; i++) {
      var dist = this.points[i].distance(p);
      if (dist <= r) {
        if (dist == 0 && options.notSelf)
          continue;
        result.points.push(this.points[i]);
        if (options.includeData) result.data.push(this.data[i]);
      }
    }
  }

  //children order doesn't matter
  var children = this.children;

  if (children.length > 0) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.points.length > 0) {
        if (p.x < child.position.x - r || p.x > child.position.x + child.size.x + r ||
            p.y < child.position.y - r || p.y > child.position.y + child.size.y + r ||
            p.z < child.position.z - r || p.z > child.position.z + child.size.z + r
          ) {
          continue;
        }
        child.findNearbyPoints(p, r, result, options);
      }
    }
  }
};

module.exports = Octree;
},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Path.js":[function(require,module,exports){
var Vec3 = require('./Vec3');

function Path(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 1000;
}

Path.prototype.addPoint = function(p) {
  return this.points.push(p);
};

Path.prototype.getPoint = function(t, debug) {
  var point = t * (this.points.length - 1);
  var intPoint = Math.floor(point);
  var weight = point - intPoint;
  var c0 = intPoint;
  var c1 = intPoint + 1;
  if (intPoint === this.points.length - 1) {
    c0 = intPoint;
    c1 = intPoint;
  }
  var vec = new Vec3();
  vec.x = this.points[c0].x + (this.points[c1].x - this.points[c0].x) * weight;
  vec.y = this.points[c0].y + (this.points[c1].y - this.points[c0].y) * weight;
  vec.z = this.points[c0].z + (this.points[c1].z - this.points[c0].z) * weight;
  return vec;
};

Path.prototype.getPointAt = function(d) {
  if (!this.closed) {
    d = Math.max(0, Math.min(d, 1));
  }
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var k = 0;
  for (var i=0; i<this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }
  return this.getPoint(k, true);
};

//naive implementation
Path.prototype.getClosestPoint = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p };
    }
    else return best;
  }, { dist: Infinity, point: null });
  return closesPoint.point;
}

Path.prototype.getClosestPointRatio = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p, pIndex) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p, index: pIndex };
    }
    else return best;
  }, { dist: Infinity, point: null, index: -1 });
  return this.accumulatedLengthRatios[closesPoint.index];
}

Path.prototype.close = function() {
  return this.closed = true;
};

Path.prototype.isClosed = function() {
  return this.closed;
};

Path.prototype.reverse = function() {
  this.points = this.points.reverse();
  return this.dirtyLength = true;
};

Path.prototype.precalculateLength = function() {
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];
  this.precalculatedPoints = [];

  var step = 1 / this.samplesCount;
  var k = 0;
  var totalLength = 0;
  var point = null;
  var prevPoint = null;

  for (var i=0; i<this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);
    if (i > 0) {
      totalLength += point.dup().sub(prevPoint).length();;
    }
    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength);
    this.precalculatedPoints.push(point);
    k += step;
  }
  for (var i=0; i<this.accumulatedLengths.length - 1; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }
  this.length = totalLength;
  return this.dirtyLength = false;
};

module.exports = Path;

},{"./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Plane.js":[function(require,module,exports){
var Vec2 = require('./Vec2');
var Vec3 = require('./Vec3');

function Plane(point, normal) {
  this.point = point;
  this.normal = normal;
  this.u = new Vec3();
  this.v = new Vec3();
  this.updateUV();
}

Plane.prototype.set = function(point, normal) {
  this.point = point;
  this.normal = normal;
}

Plane.prototype.setPoint = function(point) {
  this.point = point;
}

Plane.prototype.setNormal = function(normal) {
  this.normal = normal;
}

Plane.prototype.project = function(p) {
  var D = Vec3.create().asSub(p, this.point);
  var scale = D.dot(this.normal);
  var scaled = this.normal.clone().scale(scale);
  var projected = p.clone().sub(scaled);
  return projected;
}

Plane.prototype.intersectRay = function(ray) {
  return ray.hitTestPlane(this.point, this.normal)[0];
}

Plane.prototype.updateUV = function() {
  if (Math.abs(this.normal.x) > Math.abs(this.normal.y)) {
    var invLen = 1 / Math.sqrt(this.normal.x * this.normal.x + this.normal.z * this.normal.z);
    this.u.set( this.normal.x * invLen, 0, -this.normal.z * invLen);
  }
  else {
    var invLen = 1 / Math.sqrt(this.normal.y * this.normal.y + this.normal.z * this.normal.z);
    this.u.set( 0, this.normal.z * invLen, -this.normal.y * invLen);
  }

  this.v.setVec3(this.normal).cross(this.u);
}

Plane.prototype.project = function(p) {
  var D = Vec3.create().asSub(p, this.point);
  var scale = D.dot(this.normal);
  var scaled = this.normal.clone().scale(scale);
  var projected = p.clone().sub(scaled);
  return projected;
}

Plane.prototype.rebase = function(p) {
  var diff = p.dup().sub(this.point);
  var x = this.u.dot(diff);
  var y = this.v.dot(diff);
  return new Vec2(x, y);
}

module.exports = Plane;
},{"./Vec2":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec2.js","./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Quat.js":[function(require,module,exports){
var Mat4 = require('./Mat4');
var Vec3 = require('./Vec3');
var kEpsilon = Math.pow(2, -24);

function Quat(x, y, z, w) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
  this.z = z != null ? z : 0;
  this.w = w != null ? w : 1;
}

Quat.create = function(x, y, z, w) {
  return new Quat(x, y, z, w);
};

Quat.prototype.identity = function() {
  this.set(0, 0, 0, 1);
  return this;
};

Quat.prototype.equals = function(q, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(q.x - this.x) <= tolerance) && (Math.abs(q.y - this.y) <= tolerance) && (Math.abs(q.z - this.z) <= tolerance) && (Math.abs(q.w - this.w) <= tolerance);
};

Quat.prototype.hash = function() {
  return 1 * this.x + 12 * this.y + 123 * this.z + 1234 * this.w;
};

Quat.prototype.copy = function(q) {
  this.x = q.x;
  this.y = q.y;
  this.z = q.z;
  this.w = q.w;
  return this;
};

Quat.prototype.clone = function() {
  return new Quat(this.x, this.y, this.z, this.w);
};

Quat.prototype.dup = function() {
  return this.clone();
};

Quat.prototype.setAxisAngle = function(v, a) {
  a = a * 0.5;
  var s = Math.sin(a / 180 * Math.PI);
  this.x = s * v.x;
  this.y = s * v.y;
  this.z = s * v.z;
  this.w = Math.cos(a / 180 * Math.PI);
  return this;
};

Quat.prototype.setQuat = function(q) {
  this.x = q.x;
  this.y = q.y;
  this.z = q.z;
  this.w = q.w;
  return this;
};

Quat.prototype.set = function(x, y, z, w) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  return this;
};

Quat.prototype.asMul = function(p, q) {
  var px = p.x;
  var py = p.y;
  var pz = p.z;
  var pw = p.w;
  var qx = q.x;
  var qy = q.y;
  var qz = q.z;
  var qw = q.w;
  this.x = px * qw + pw * qx + py * qz - pz * qy;
  this.y = py * qw + pw * qy + pz * qx - px * qz;
  this.z = pz * qw + pw * qz + px * qy - py * qx;
  this.w = pw * qw - px * qx - py * qy - pz * qz;
  return this;
};

Quat.prototype.mul = function(q) {
  this.asMul(this, q);
  return this;
};

Quat.prototype.mul4 = function(x, y, z, w) {
  var ax = this.x;
  var ay = this.y;
  var az = this.z;
  var aw = this.w;
  this.x = w * ax + x * aw + y * az - z * ay;
  this.y = w * ay + y * aw + z * ax - x * az;
  this.z = w * az + z * aw + x * ay - y * ax;
  this.w = w * aw - x * ax - y * ay - z * az;
  return this;
};

Quat.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
};

Quat.prototype.normalize = function() {
  var len = this.length();
  if (len > kEpsilon) {
    this.x /= len;
    this.y /= len;
    this.z /= len;
    this.w /= len;
  }
  return this;
};

Quat.prototype.toMat4 = function(out) {
  var xs = this.x + this.x;
  var ys = this.y + this.y;
  var zs = this.z + this.z;
  var wx = this.w * xs;
  var wy = this.w * ys;
  var wz = this.w * zs;
  var xx = this.x * xs;
  var xy = this.x * ys;
  var xz = this.x * zs;
  var yy = this.y * ys;
  var yz = this.y * zs;
  var zz = this.z * zs;
  var m = out || new Mat4();
  return m.set4x4r(1 - (yy + zz), xy - wz, xz + wy, 0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx, 1 - (xx + yy), 0, 0, 0, 0, 1);
};

Quat.prototype.setDirection = function(direction, debug) {
  var dir = Vec3.create().copy(direction).normalize();

  var up = Vec3.create(0, 1, 0);

  var right = Vec3.create().asCross(up, dir);

  //if debug then console.log('right', right)

  if (right.length() == 0) {
    up.set(1, 0, 0)
    right.asCross(up, dir);
  }

  up.asCross(dir, right);
  right.normalize();
  up.normalize();

  if (debug) console.log('dir', dir);
  if (debug) console.log('up', up);
  if (debug) console.log('right', right);

  var m = new Mat4();
  m.set4x4r(
    right.x, right.y, right.z, 0,
    up.x, up.y, up.z, 0,
    dir.x, dir.y, dir.z, 0,
    0, 0, 0, 1
  );

  //Step 3. Build a quaternion from the matrix
  var q = new Quat()
  if (1.0 + m.a11 + m.a22 + m.a33 < 0.001) {
    if (debug) console.log('singularity');
    dir = direction.dup();
    dir.z *= -1;
    dir.normalize();
    up.set(0, 1, 0);
    right.asCross(up, dir);
    up.asCross(dir, right);
    right.normalize();
    up.normalize();
    m = new Mat4();
    m.set4x4r(
      right.x, right.y, right.z, 0,
      up.x, up.y, up.z, 0,
      dir.x, dir.y, dir.z, 0,
      0, 0, 0, 1
    );
    q.w = Math.sqrt(1.0 + m.a11 + m.a22 + m.a33) / 2.0;
    var dfWScale = q.w * 4.0;
    q.x = ((m.a23 - m.a32) / dfWScale);
    q.y = ((m.a31 - m.a13) / dfWScale);
    q.z = ((m.a12 - m.a21) / dfWScale);
    if (debug) console.log('dir', dir);
    if (debug) console.log('up', up);
    if (debug) console.log('right', right);

    q2 = new Quat();
    q2.setAxisAngle(new Vec3(0,1,0), 180)
    q2.mul(q);
    return q2;
  }
  q.w = Math.sqrt(1.0 + m.a11 + m.a22 + m.a33) / 2.0;
  dfWScale = q.w * 4.0;
  q.x = ((m.a23 - m.a32) / dfWScale);
  q.y = ((m.a31 - m.a13) / dfWScale);
  q.z = ((m.a12 - m.a21) / dfWScale);

  this.copy(q);
  return this;
}

Quat.fromAxisAngle = function(v, a) {
  return new Quat().setAxisAngle(v, a);
}

Quat.fromDirection = function(direction) {
  return new Quat().setDirection(direction);
}


module.exports = Quat;

},{"./Mat4":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Mat4.js","./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Random.js":[function(require,module,exports){
var seedrandom = require('seedrandom');
var Vec2 = require('./Vec2');
var Vec3 = require('./Vec3');

function Random() {

}

Random.randomSeed = function(s) {
  Math.seedrandom(s);
};

Random.randomFloat = function(min, max) {
  if (typeof max == 'undefined') {
    min = 1;
  }
  if (typeof max == 'undefined') {
    max = min;
    min = 0;
  }
  return min + (max - min) * Math.random();
};

Random.randomInt = function(min, max) {
  return Math.floor(Random.randomFloat(min, max));
};

Random.randomVec3 = function(r) {
  r = r || 0.5;
  var x = 2 * Math.random() - 1;
  var y = 2 * Math.random() - 1;
  var z = 2 * Math.random() - 1;
  return Vec3.create(x * r, y * r, z * r);
};

Random.randomVec3InBoundingBox = function(bbox) {
  var x = bbox.min.x + Math.random() * (bbox.max.x - bbox.min.x);
  var y = bbox.min.y + Math.random() * (bbox.max.y - bbox.min.y);
  var z = bbox.min.z + Math.random() * (bbox.max.z - bbox.min.z);
  return Vec3.create(x, y, z);
};

Random.randomVec2InRect = function(rect) {
  return Vec2.create(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
};

Random.randomChance = function(probability) {
  return Math.random() <= probability;
};

Random.randomElement = function(list) {
  return list[Math.floor(Math.random() * list.length)];
};

module.exports = Random;
},{"./Vec2":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec2.js","./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js","seedrandom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/node_modules/seedrandom/seedrandom.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Ray.js":[function(require,module,exports){
var Vec3 = require('./Vec3');

//A ray.  
//
//Consists of the starting point *origin* and the *direction* vector.  
//Used for collision detection.
//### Ray ( )
function Ray(origin, direction) {
  this.origin = origin || new Vec3(0, 0, 0);
  this.direction = direction || new Vec3(0, 0, 1);
}

//http://wiki.cgsociety.org/index.php/Ray_Sphere_Intersection
Ray.prototype.hitTestSphere = function (pos, r) {
  var hits = [];
  var d = this.direction;
  var o = this.origin;
  var osp = o.dup().sub(pos);
  var A = d.dot(d);
  if (A == 0) {
    return hits;
  }
  var B = 2 * osp.dot(d);
  var C = osp.dot(osp) - r * r;
  var sq = Math.sqrt(B * B - 4 * A * C);
  if (isNaN(sq)) {
    return hits;
  }
  var t0 = (-B - sq) / (2 * A);
  var t1 = (-B + sq) / (2 * A);
  hits.push(o.dup().add(d.dup().scale(t0)));
  if (t0 != t1) {
    hits.push(o.dup().add(d.dup().scale(t1)));
  }
  return hits;
};

//http://www.cs.princeton.edu/courses/archive/fall00/cs426/lectures/raycast/sld017.htm
//http://cgafaq.info/wiki/Ray_Plane_Intersection
Ray.prototype.hitTestPlane = function (pos, normal) {
  if (this.direction.dot(normal) == 0) {
    return [];
  }
  var t = normal.dup().scale(-1).dot(this.origin.dup().sub(pos)) / this.direction.dot(normal);
  return [this.origin.dup().add(this.direction.dup().scale(t))];
};

Ray.prototype.hitTestBoundingBox = function (bbox) {
  var hits = [];
  var self = this;
  function testFace(pos, size, normal, u, v) {
    var faceHits = self.hitTestPlane(pos, normal);
    if (faceHits.length > 0) {
      var hit = faceHits[0];
      if (hit[u] > pos[u] - size[u] / 2 && hit[u] < pos[u] + size[u] / 2 && hit[v] > pos[v] - size[v] / 2 && hit[v] < pos[v] + size[v] / 2) {
        hits.push(hit);
      }
    }
  }
  var bboxCenter = bbox.getCenter();
  var bboxSize = bbox.getSize();
  testFace(bboxCenter.dup().add(new Vec3(0, 0, bboxSize.z / 2)), bboxSize, new Vec3(0, 0, 1), 'x', 'y');
  testFace(bboxCenter.dup().add(new Vec3(0, 0, -bboxSize.z / 2)), bboxSize, new Vec3(0, 0, -1), 'x', 'y');
  testFace(bboxCenter.dup().add(new Vec3(bboxSize.x / 2, 0, 0)), bboxSize, new Vec3(1, 0, 0), 'y', 'z');
  testFace(bboxCenter.dup().add(new Vec3(-bboxSize.x / 2, 0, 0)), bboxSize, new Vec3(-1, 0, 0), 'y', 'z');
  testFace(bboxCenter.dup().add(new Vec3(0, bboxSize.y / 2, 0)), bboxSize, new Vec3(0, 1, 0), 'x', 'z');
  testFace(bboxCenter.dup().add(new Vec3(0, -bboxSize.y / 2, 0)), bboxSize, new Vec3(0, -1, 0), 'x', 'z');

  hits.forEach(function (hit) {
    hit._distance = hit.distance(self.origin);
  });

  hits.sort(function (a, b) {
    return a._distance - b._distance;
  });

  hits.forEach(function (hit) {
    delete hit._distance;
  });

  if (hits.length > 0) {
    hits = [hits[0]];
  }

  return hits;
};

module.exports = Ray;
},{"./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Rect.js":[function(require,module,exports){
function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.prototype.set = function(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

Rect.prototype.contains = function(point) {
  return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height;
};

module.exports = Rect;
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Spline1D.js":[function(require,module,exports){
//Camtull-Rom spline implementation  
//Inspired by code from [Tween.js][1]
//[1]: http://sole.github.com/tween.js/examples/05_spline.html

//## Example use 
//
//     var points = [ 
//       -2, 
//       -1, 
//        1, 
//        2
//     ];
//
//     var spline = new Spline1D(points);
//
//     spline.getPointAt(0.25);

//## Reference

//### Spline1D ( points, [ closed ] )
//`points` - *{ Array of Vec3 }* = [ ]  
//`closed` - is the spline a closed loop? *{ Boolean }* = false
function Spline1D(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 2000;
}

//### getPoint ( t )
//Gets position based on t-value.
//It is fast, but resulting points will not be evenly distributed.
//
//`t` - *{ Number } <0, 1>*
Spline1D.prototype.getPoint = function ( t ) {
  if (this.closed) {
    t = (t + 1 ) % 1;
  }
  else {
    t = Math.max(0, Math.min(t, 1));
  }

  var points = this.points;
  var len = this.closed ? points.length : points.length - 1;
  var point = t * len;
  var intPoint = Math.floor( point );
  var weight = point - intPoint;

  var c0, c1, c2, c3;
  if (this.closed) {
    c0 = (intPoint - 1 + points.length ) % points.length;
    c1 = intPoint % points.length;
    c2 = (intPoint + 1 ) % points.length;
    c3 = (intPoint + 2 ) % points.length;
  }
  else {
    c0 = intPoint == 0 ? intPoint : intPoint - 1;
    c1 = intPoint;
    c2 = intPoint > points.length - 2 ? intPoint : intPoint + 1;
    c3 = intPoint > points.length - 3 ? intPoint : intPoint + 2;
  }

  return this.interpolate( points[ c0 ], points[ c1 ], points[ c2 ], points[ c3 ], weight );
}

//### addPoint ( p )
//Adds point to the spline
//
//`p` - point to be added *{ Vec3 }* 
Spline1D.prototype.addPoint = function ( p ) {
  this.dirtyLength = true;
  this.points.push(p)
}

//### getPointAt ( d )
//Gets position based on d-th of total length of the curve.
//Precise but might be slow at the first use due to need to precalculate length.
//
//`d` - *{ Number } <0, 1>*
Spline1D.prototype.getPointAt = function ( d ) {
  if (this.closed) {
    d = (d + 1 ) % 1;
  }
  else {
    d = Math.max(0, Math.min(d, 1));
  }

  if (this.dirtyLength) {
    this.precalculateLength();
  }

  //TODO: try binary search
  var k = 0;
  for(var i=0; i<this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }

  return this.getPoint(k);
}

//### getPointAtIndex ( i )
//Returns position of i-th point forming the curve
//
//`i` - *{ Number } <0, Spline1D.points.length)*
Spline1D.prototype.getPointAtIndex = function ( i ) {
  if (i < this.points.length) {
    return this.points[i];
  }
  else {
    return null;
  }
}

//### getNumPoints ( )
//Return number of base points in the spline
Spline1D.prototype.getNumPoints = function() {
  return this.points.length;
}

//### getLength ( )
//Returns the total length of the spline.
Spline1D.prototype.getLength = function() {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  return this.length;
}

//### precalculateLength ( )
//Goes through all the segments of the curve and calculates total length and
//the ratio of each segment.
Spline1D.prototype.precalculateLength = function() {
  var step = 1/this.samplesCount;
  var k = 0;
  var totalLength = 0;
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];

  var point;
  var prevPoint;
  var k = 0;
  for(var i=0; i<this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);

    if (i > 0) {
      var len = Math.sqrt(1 + (point - prevPoint)*(point - prevPoint));
      totalLength += len;
    }

    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength)

    k += step;
  }

  for(var i=0; i<this.samplesCount; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }

  this.length = totalLength;
  this.dirtyLength = false;
}

//### close ( )
//Closes the spline. It will form a closed now.
Spline1D.prototype.close = function( ) {
  this.closed = true;
}

//### isClosed ( )
//Returns true if spline is closed (forms a closed) *{ Boolean }*
Spline1D.prototype.isClosed = function() {
  return this.closed;
}

//### interpolate ( p0, p1, p2, p3, t)
//Helper function to calculate Catmul-Rom spline equation  
//
//`p0` - previous value *{ Number }*  
//`p1` - current value *{ Number }*  
//`p2` - next value *{ Number }*  
//`p3` - next next value *{ Number }*  
//`t` - parametric distance between p1 and p2 *{ Number } <0, 1>*
Spline1D.prototype.interpolate = function(p0, p1, p2, p3, t) {
  var v0 = ( p2 - p0 ) * 0.5;
  var v1 = ( p3 - p1 ) * 0.5;
  var t2 = t * t;
  var t3 = t * t2;
  return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
}

module.exports = Spline1D;

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Spline2D.js":[function(require,module,exports){
//Camtull-Rom spline implementation  
//Inspired by code from [Tween.js][1]
//[1]: http://sole.github.com/tween.js/examples/05_spline.html
//## Example use 
//
//     var points = [ 
//       new Vec2(-2,  0), 
//       new Vec2(-1,  0), 
//       new Vec2( 1,  1), 
//       new Vec2( 2, -1) 
//     ];
//
//     var spline = new Spline2D(points);
//
//     spline.getPointAt(0.25);
//## Reference

var Vec2 = require('./Vec2');

//### Spline2D ( points, [ closed ] )
//`points` - *{ Array of Vec2 }* = [ ]  
//`closed` - is the spline a closed loop? *{ Boolean }* = false
function Spline2D(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 100;
}
//### getPoint ( t )
//Gets position based on t-value.
//It is fast, but resulting points will not be evenly distributed.
//
//`t` - *{ Number } <0, 1>*
//returns [Vec2](Vec2.html)
Spline2D.prototype.getPoint = function (t) {
  if (this.closed) {
    t = (t + 1) % 1;
  } else {
    t = Math.max(0, Math.min(t, 1));
  }
  var points = this.points;
  var len = this.closed ? points.length : points.length - 1;
  var point = t * len;
  var intPoint = Math.floor(point);
  var weight = point - intPoint;
  var c0, c1, c2, c3;
  if (this.closed) {
    c0 = (intPoint - 1 + points.length) % points.length;
    c1 = intPoint % points.length;
    c2 = (intPoint + 1) % points.length;
    c3 = (intPoint + 2) % points.length;
  } else {
    c0 = intPoint == 0 ? intPoint : intPoint - 1;
    c1 = intPoint;
    c2 = intPoint > points.length - 2 ? intPoint : intPoint + 1;
    c3 = intPoint > points.length - 3 ? intPoint : intPoint + 2;
  }
  var vec = new Vec2();
  vec.x = this.interpolate(points[c0].x, points[c1].x, points[c2].x, points[c3].x, weight);
  vec.y = this.interpolate(points[c0].y, points[c1].y, points[c2].y, points[c3].y, weight);
  return vec;
};
//### addPoint ( p )
//Adds point to the spline
//
//`p` - point to be added *{ Vec2 }* 
Spline2D.prototype.addPoint = function (p) {
  this.dirtyLength = true;
  this.points.push(p);
};
//### getPointAt ( d )
//Gets position based on d-th of total length of the curve.
//Precise but might be slow at the first use due to need to precalculate length.
//
//`d` - *{ Number } <0, 1>*
Spline2D.prototype.getPointAt = function (d) {
  if (this.closed) {
    d = (d + 1) % 1;
  } else {
    d = Math.max(0, Math.min(d, 1));
  }
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  //TODO: try binary search
  var k = 0;
  for (var i = 0; i < this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }
  return this.getPoint(k);
};

//naive implementation
Spline2D.prototype.getClosestPoint = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p };
    }
    else return best;
  }, { dist: Infinity, point: null });
  return closesPoint.point;
}

Spline2D.prototype.getClosestPointRatio = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p, pIndex) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p, index: pIndex };
    }
    else return best;
  }, { dist: Infinity, point: null, index: -1 });
  return this.accumulatedLengthRatios[closesPoint.index];
}

//### getPointAtIndex ( i )
//Returns position of i-th point forming the curve
//
//`i` - *{ Number } <0, Spline2D.points.length)*
Spline2D.prototype.getPointAtIndex = function (i) {
  if (i < this.points.length) {
    return this.points[i];
  } else {
    return null;
  }
};
//### getNumPoints ( )
//Return number of base points in the spline
Spline2D.prototype.getNumPoints = function () {
  return this.points.length;
};
//### getLength ( )
//Returns the total length of the spline.
Spline2D.prototype.getLength = function () {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  return this.length;
};
//### precalculateLength ( )
//Goes through all the segments of the curve and calculates total length and
//the ratio of each segment.
Spline2D.prototype.precalculateLength = function () {
  var step = 1 / this.samplesCount;
  var k = 0;
  var totalLength = 0;
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];
  this.precalculatedPoints = [];
  var point;
  var prevPoint;
  for (var i = 0; i < this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);
    if (i > 0) {
      var len = point.dup().sub(prevPoint).length();
      totalLength += len;
    }
    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength);
    this.precalculatedPoints.push(point);
    k += step;
  }
  for (var i = 0; i < this.samplesCount; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }
  this.length = totalLength;
  this.dirtyLength = false;
};
//### close ( )
//Closes the spline. It will form a closed now.
Spline2D.prototype.close = function () {
  this.closed = true;
};
//### isClosed ( )
//Returns true if spline is closed (forms a closed) *{ Boolean }*
Spline2D.prototype.isClosed = function () {
  return this.closed;
};
//### interpolate ( p0, p1, p2, p3, t)
//Helper function to calculate Catmul-Rom spline equation  
//
//`p0` - previous value *{ Number }*  
//`p1` - current value *{ Number }*  
//`p2` - next value *{ Number }*  
//`p3` - next next value *{ Number }*  
//`t` - parametric distance between p1 and p2 *{ Number } <0, 1>*
Spline2D.prototype.interpolate = function (p0, p1, p2, p3, t) {
  var v0 = (p2 - p0) * 0.5;
  var v1 = (p3 - p1) * 0.5;
  var t2 = t * t;
  var t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
};

module.exports = Spline2D;
},{"./Vec2":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec2.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Spline3D.js":[function(require,module,exports){
//Camtull-Rom spline implementation  
//Inspired by code from [Tween.js][1]
//[1]: http://sole.github.com/tween.js/examples/05_spline.html
//## Example use 
//
//     var points = [ 
//       new Vec3(-2,  0, 0), 
//       new Vec3(-1,  0, 0), 
//       new Vec3( 1,  1, 0), 
//       new Vec3( 2, -1, 0) 
//     ];
//
//     var spline = new Spline3D(points);
//
//     spline.getPointAt(0.25);
//## Reference

var Vec3 = require('./Vec3');

//### Spline3D ( points, [ closed ] )
//`points` - *{ Array of Vec3 }* = [ ]  
//`closed` - is the spline a closed loop? *{ Boolean }* = false
function Spline3D(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 1000;
}
//### getPoint ( t )
//Gets position based on t-value.
//It is fast, but resulting points will not be evenly distributed.
//
//`t` - *{ Number } <0, 1>*
//returns [Vec3](Vec3.html)
Spline3D.prototype.getPoint = function (t) {
  if (this.closed) {
    t = (t + 1) % 1;
  } else {
    t = Math.max(0, Math.min(t, 1));
  }
  var points = this.points;
  var len = this.closed ? points.length : points.length - 1;
  var point = t * len;
  var intPoint = Math.floor(point);
  var weight = point - intPoint;
  var c0, c1, c2, c3;
  if (this.closed) {
    c0 = (intPoint - 1 + points.length) % points.length;
    c1 = intPoint % points.length;
    c2 = (intPoint + 1) % points.length;
    c3 = (intPoint + 2) % points.length;
  } else {
    c0 = intPoint == 0 ? intPoint : intPoint - 1;
    c1 = intPoint;
    c2 = intPoint > points.length - 2 ? intPoint : intPoint + 1;
    c3 = intPoint > points.length - 3 ? intPoint : intPoint + 2;
  }
  var vec = new Vec3();
  vec.x = this.interpolate(points[c0].x, points[c1].x, points[c2].x, points[c3].x, weight);
  vec.y = this.interpolate(points[c0].y, points[c1].y, points[c2].y, points[c3].y, weight);
  vec.z = this.interpolate(points[c0].z, points[c1].z, points[c2].z, points[c3].z, weight);
  return vec;
};
//### addPoint ( p )
//Adds point to the spline
//
//`p` - point to be added *{ Vec3 }* 
Spline3D.prototype.addPoint = function (p) {
  this.dirtyLength = true;
  this.points.push(p);
};
//### getPointAt ( d )
//Gets position based on d-th of total length of the curve.
//Precise but might be slow at the first use due to need to precalculate length.
//
//`d` - *{ Number } <0, 1>*
Spline3D.prototype.getPointAt = function (d) {
  if (this.closed) {
    d = (d + 1) % 1;
  } else {
    d = Math.max(0, Math.min(d, 1));
  }
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  //TODO: try binary search
  var k = 0;
  for (var i = 0; i < this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }
  return this.getPoint(k);
};

//naive implementation
Spline3D.prototype.getClosestPoint = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p };
    }
    else return best;
  }, { dist: Infinity, point: null });
  return closesPoint.point;
}

Spline3D.prototype.getClosestPointRatio = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p, pIndex) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p, index: pIndex };
    }
    else return best;
  }, { dist: Infinity, point: null, index: -1 });
  return this.accumulatedLengthRatios[closesPoint.index];
}

//### getTangentAt ( t )
Spline3D.prototype.getTangentAt = function(t) {
  var currT = (t < 0.99) ? t : t - 0.01;
  var nextT  = (t < 0.99) ? t + 0.01 : t;
  var p = this.getPointAt(currT);
  var np = this.getPointAt(nextT);
  return Vec3.create().asSub(np, p).normalize();
};
//### getPointAtIndex ( i )
//Returns position of i-th point forming the curve
//
//`i` - *{ Number } <0, Spline3D.points.length)*
Spline3D.prototype.getPointAtIndex = function (i) {
  if (i < this.points.length) {
    return this.points[i];
  } else {
    return null;
  }
};
//### getNumPoints ( )
//Return number of base points in the spline
Spline3D.prototype.getNumPoints = function () {
  return this.points.length;
};
//### getLength ( )
//Returns the total length of the spline.
Spline3D.prototype.getLength = function () {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  return this.length;
};
//### precalculateLength ( )
//Goes through all the segments of the curve and calculates total length and
//the ratio of each segment.
Spline3D.prototype.precalculateLength = function () {
  var step = 1 / this.samplesCount;
  var k = 0;
  var totalLength = 0;
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];
  this.precalculatedPoints = [];
  var point;
  var prevPoint;
  for (var i = 0; i < this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);
    if (i > 0) {
      var len = point.dup().sub(prevPoint).length();
      totalLength += len;
    }
    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength);
    this.precalculatedPoints.push(point);
    k += step;
  }
  for (var i = 0; i < this.samplesCount; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }
  this.length = totalLength;
  this.dirtyLength = false;
};
//### close ( )
//Closes the spline. It will form a closed now.
Spline3D.prototype.close = function () {
  this.closed = true;
};
//### isClosed ( )
//Returns true if spline is closed (forms a closed) *{ Boolean }*
Spline3D.prototype.isClosed = function () {
  return this.closed;
};
//### interpolate ( p0, p1, p2, p3, t)
//Helper function to calculate Catmul-Rom spline equation  
//
//`p0` - previous value *{ Number }*  
//`p1` - current value *{ Number }*  
//`p2` - next value *{ Number }*  
//`p3` - next next value *{ Number }*  
//`t` - parametric distance between p1 and p2 *{ Number } <0, 1>*
Spline3D.prototype.interpolate = function (p0, p1, p2, p3, t) {
  var v0 = (p2 - p0) * 0.5;
  var v1 = (p3 - p1) * 0.5;
  var t2 = t * t;
  var t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
};

module.exports = Spline3D;
},{"./Vec3":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Triangle2D.js":[function(require,module,exports){
function sign(a, b, c) {
  return (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y);
}

function Triangle2D(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

//http://stackoverflow.com/a/2049593
//doesn't properly handle points on the edge of the triangle
Triangle2D.prototype.contains = function (p) {
  var signAB = sign(this.a, this.b, p) < 0;
  var signBC = sign(this.b, this.c, p) < 0;
  var signCA = sign(this.c, this.a, p) < 0;
  return signAB == signBC && signBC == signCA;
};

//Calculates triangle area using Heron's formula
//http://en.wikipedia.org/wiki/Triangle#Using_Heron.27s_formula
Triangle2D.prototype.getArea = function() {
  var ab = this.a.distance(this.b);
  var ac = this.a.distance(this.c);
  var bc = this.b.distance(this.c);

  var s = (ab + ac + bc) / 2; //perimeter
  return Math.sqrt(s * (s - ab) * (s - ac) * (s - bc));
}


module.exports = Triangle2D;
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Triangle3D.js":[function(require,module,exports){
function Triangle3D(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

//Calculates triangle area using Heron's formula
//http://en.wikipedia.org/wiki/Triangle#Using_Heron.27s_formula
Triangle3D.prototype.getArea = function() {
  var ab = this.a.distance(this.b);
  var ac = this.a.distance(this.c);
  var bc = this.b.distance(this.c);

  var s = (ab + ac + bc) / 2; //perimeter
  return Math.sqrt(s * (s - ab) * (s - ac) * (s - bc));
}

module.exports = Triangle3D;
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec2.js":[function(require,module,exports){
function Vec2(x, y) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
}

Vec2.create = function(x, y) {
  return new Vec2(x, y);
};

Vec2.prototype.set = function(x, y) {
  this.x = x;
  this.y = y;
  return this;
};

Vec2.prototype.equals = function(v, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(v.x - this.x) <= tolerance) && (Math.abs(v.y - this.y) <= tolerance);
};

Vec2.prototype.hash = function() {
  return 1 * this.x + 12 * this.y;
};

Vec2.prototype.setVec2 = function(v) {
  this.x = v.x;
  this.y = v.y;
  return this;
};

Vec2.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
  return this;
};

Vec2.prototype.sub = function(v) {
  this.x -= v.x;
  this.y -= v.y;
  return this;
};

Vec2.prototype.scale = function(f) {
  this.x *= f;
  this.y *= f;
  return this;
};

Vec2.prototype.distance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  return Math.sqrt(dx * dx + dy * dy);
};

Vec2.prototype.squareDistance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  return dx * dx + dy * dy;
};

Vec2.prototype.dot = function(b) {
  return this.x * b.x + this.y * b.y;
};

Vec2.prototype.copy = function(v) {
  this.x = v.x;
  this.y = v.y;
  return this;
};

Vec2.prototype.clone = function() {
  return new Vec2(this.x, this.y);
};

Vec2.prototype.dup = function() {
  return this.clone();
};

Vec2.prototype.asAdd = function(a, b) {
  this.x = a.x + b.x;
  this.y = a.y + b.y;
  return this;
};

Vec2.prototype.asSub = function(a, b) {
  this.x = a.x - b.x;
  this.y = a.y - b.y;
  return this;
};

Vec2.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec2.prototype.normalize = function() {
  var len = this.length();
  if (len > 0) {
    this.scale(1 / len);
  }
  return this;
};

Vec2.prototype.toString = function() {
  return "{" + Math.floor(this.x*1000)/1000 + ", " + Math.floor(this.y*1000)/1000 + "}";
};

module.exports = Vec2;

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec3.js":[function(require,module,exports){
function Vec3(x, y, z) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
  this.z = z != null ? z : 0;
}

Vec3.create = function(x, y, z) {
  return new Vec3(x, y, z);
};

Vec3.prototype.hash = function() {
  return 1 * this.x + 12 * this.y + 123 * this.z;
};

Vec3.prototype.set = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};

Vec3.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
  this.z += v.z;
  return this;
};

Vec3.prototype.sub = function(v) {
  this.x -= v.x;
  this.y -= v.y;
  this.z -= v.z;
  return this;
};

Vec3.prototype.scale = function(f) {
  this.x *= f;
  this.y *= f;
  this.z *= f;
  return this;
};

Vec3.prototype.distance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  var dz = v.z - this.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

Vec3.prototype.squareDistance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  var dz = v.z - this.z;
  return dx * dx + dy * dy + dz * dz;
};

Vec3.prototype.copy = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  return this;
};

Vec3.prototype.setVec3 = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  return this;
};

Vec3.prototype.clone = function() {
  return new Vec3(this.x, this.y, this.z);
};

Vec3.prototype.dup = function() {
  return this.clone();
};

Vec3.prototype.cross = function(v) {
  var x = this.x;
  var y = this.y;
  var z = this.z;
  var vx = v.x;
  var vy = v.y;
  var vz = v.z;
  this.x = y * vz - z * vy;
  this.y = z * vx - x * vz;
  this.z = x * vy - y * vx;
  return this;
};

Vec3.prototype.dot = function(b) {
  return this.x * b.x + this.y * b.y + this.z * b.z;
};

Vec3.prototype.asAdd = function(a, b) {
  this.x = a.x + b.x;
  this.y = a.y + b.y;
  this.z = a.z + b.z;
  return this;
};

Vec3.prototype.asSub = function(a, b) {
  this.x = a.x - b.x;
  this.y = a.y - b.y;
  this.z = a.z - b.z;
  return this;
};

Vec3.prototype.asCross = function(a, b) {
  return this.copy(a).cross(b);
};

Vec3.prototype.addScaled = function(a, f) {
  this.x += a.x * f;
  this.y += a.y * f;
  this.z += a.z * f;
  return this;
};

Vec3.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

Vec3.prototype.lengthSquared = function() {
  return this.x * this.x + this.y * this.y + this.z * this.z;
};

Vec3.prototype.normalize = function() {
  var len = this.length();
  if (len > 0) {
    this.scale(1 / len);
  }
  return this;
};

Vec3.prototype.transformQuat = function(q) {
  var x = this.x;
  var y = this.y;
  var z = this.z;
  var qx = q.x;
  var qy = q.y;
  var qz = q.z;
  var qw = q.w;
  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z;
  this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return this;
};

Vec3.prototype.transformMat4 = function(m) {
  var x = m.a14 + m.a11 * this.x + m.a12 * this.y + m.a13 * this.z;
  var y = m.a24 + m.a21 * this.x + m.a22 * this.y + m.a23 * this.z;
  var z = m.a34 + m.a31 * this.x + m.a32 * this.y + m.a33 * this.z;
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};

Vec3.prototype.equals = function(v, tolerance) {
  tolerance = tolerance != null ? tolerance : 0.0000001;
  return (Math.abs(v.x - this.x) <= tolerance) && (Math.abs(v.y - this.y) <= tolerance) && (Math.abs(v.z - this.z) <= tolerance);
};

Vec3.prototype.toString = function() {
  return "{" + Math.floor(this.x*1000)/1000 + ", " + Math.floor(this.y*1000)/1000 + ", " + Math.floor(this.z*1000)/1000 + "}";
};

Vec3.Zero = new Vec3(0, 0, 0);

module.exports = Vec3;

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/lib/Vec4.js":[function(require,module,exports){
function Vec4(x, y, z, w) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
  this.z = z != null ? z : 0;
  this.w = w != null ? w : 0;
}

Vec4.prototype.equals = function(v, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(v.x - this.x) <= tolerance) && (Math.abs(v.y - this.y) <= tolerance) && (Math.abs(v.z - this.z) <= tolerance) && (Math.abs(v.w - this.w) <= tolerance);
};

Vec4.prototype.hash = function() {
  return 1 * this.x + 12 * this.y + 123 * this.z + 1234 * this.w;
};

Vec4.create = function(x, y, z, w) {
  return new Vec4(x, y, z, w);
};

Vec4.prototype.set = function(x, y, z, w) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  return this;
};

Vec4.prototype.setVec4 = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  this.w = v.w;
  return this;
};

Vec4.prototype.transformMat4 = function(m) {
  var x = m.a14 * this.w + m.a11 * this.x + m.a12 * this.y + m.a13 * this.z;
  var y = m.a24 * this.w + m.a21 * this.x + m.a22 * this.y + m.a23 * this.z;
  var z = m.a34 * this.w + m.a31 * this.x + m.a32 * this.y + m.a33 * this.z;
  var w = m.a44 * this.w + m.a41 * this.x + m.a42 * this.y + m.a43 * this.z;
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  return this;
};

Vec4.prototype.toString = function() {
  return "{" + Math.floor(this.x*1000)/1000 + ", " + Math.floor(this.y*1000)/1000 + ", " + Math.floor(this.z*1000)/1000 + ", " + Math.floor(this.w*1000)/1000 + "}";
};

module.exports = Vec4;

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/node_modules/seedrandom/seedrandom.js":[function(require,module,exports){
// seedrandom.js version 2.3.4
// Author: David Bau
// Date: 2014 Mar 9
//
// Defines a method Math.seedrandom() that, when called, substitutes
// an explicitly seeded RC4-based algorithm for Math.random().  Also
// supports automatic seeding from local or network sources of entropy.
// Can be used as a node.js or AMD module.  Can be called with "new"
// to create a local PRNG without changing Math.random.
//
// Basic usage:
//
//   <script src=http://davidbau.com/encode/seedrandom.min.js></script>
//
//   Math.seedrandom('yay.');  // Sets Math.random to a function that is
//                             // initialized using the given explicit seed.
//
//   Math.seedrandom();        // Sets Math.random to a function that is
//                             // seeded using the current time, dom state,
//                             // and other accumulated local entropy.
//                             // The generated seed string is returned.
//
//   Math.seedrandom('yowza.', true);
//                             // Seeds using the given explicit seed mixed
//                             // together with accumulated entropy.
//
//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
//   </script>                 <!-- Seeds using urandom bits from a server. -->
//
//   Math.seedrandom("hello.");           // Behavior is the same everywhere:
//   document.write(Math.random());       // Always 0.9282578795792454
//   document.write(Math.random());       // Always 0.3752569768646784
//
// Math.seedrandom can be used as a constructor to return a seeded PRNG
// that is independent of Math.random:
//
//   var myrng = new Math.seedrandom('yay.');
//   var n = myrng();          // Using "new" creates a local prng without
//                             // altering Math.random.
//
// When used as a module, seedrandom is a function that returns a seeded
// PRNG instance without altering Math.random:
//
//   // With node.js (after "npm install seedrandom"):
//   var seedrandom = require('seedrandom');
//   var rng = seedrandom('hello.');
//   console.log(rng());                  // always 0.9282578795792454
//
//   // With require.js or other AMD loader:
//   require(['seedrandom'], function(seedrandom) {
//     var rng = seedrandom('hello.');
//     console.log(rng());                // always 0.9282578795792454
//   });
//
// More examples:
//
//   var seed = Math.seedrandom();        // Use prng with an automatic seed.
//   document.write(Math.random());       // Pretty much unpredictable x.
//
//   var rng = new Math.seedrandom(seed); // A new prng with the same seed.
//   document.write(rng());               // Repeat the 'unpredictable' x.
//
//   function reseed(event, count) {      // Define a custom entropy collector.
//     var t = [];
//     function w(e) {
//       t.push([e.pageX, e.pageY, +new Date]);
//       if (t.length < count) { return; }
//       document.removeEventListener(event, w);
//       Math.seedrandom(t, true);        // Mix in any previous entropy.
//     }
//     document.addEventListener(event, w);
//   }
//   reseed('mousemove', 100);            // Reseed after 100 mouse moves.
//
// The callback third arg can be used to get both the prng and the seed.
// The following returns both an autoseeded prng and the seed as an object,
// without mutating Math.random:
//
//   var obj = Math.seedrandom(null, false, function(prng, seed) {
//     return { random: prng, seed: seed };
//   });
//
// Version notes:
//
// The random number sequence is the same as version 1.0 for string seeds.
// * Version 2.0 changed the sequence for non-string seeds.
// * Version 2.1 speeds seeding and uses window.crypto to autoseed if present.
// * Version 2.2 alters non-crypto autoseeding to sweep up entropy from plugins.
// * Version 2.3 adds support for "new", module loading, and a null seed arg.
// * Version 2.3.1 adds a build environment, module packaging, and tests.
// * Version 2.3.3 fixes bugs on IE8, and switches to MIT license.
// * Version 2.3.4 fixes documentation to contain the MIT license.
//
// The standard ARC4 key scheduler cycles short keys, which means that
// seedrandom('ab') is equivalent to seedrandom('abab') and 'ababab'.
// Therefore it is a good idea to add a terminator to avoid trivial
// equivalences on short string seeds, e.g., Math.seedrandom(str + '\0').
// Starting with version 2.0, a terminator is added automatically for
// non-string seeds, so seeding with the number 111 is the same as seeding
// with '111\0'.
//
// When seedrandom() is called with zero args or a null seed, it uses a
// seed drawn from the browser crypto object if present.  If there is no
// crypto support, seedrandom() uses the current time, the native rng,
// and a walk of several DOM objects to collect a few bits of entropy.
//
// Each time the one- or two-argument forms of seedrandom are called,
// entropy from the passed seed is accumulated in a pool to help generate
// future seeds for the zero- and two-argument forms of seedrandom.
//
// On speed - This javascript implementation of Math.random() is several
// times slower than the built-in Math.random() because it is not native
// code, but that is typically fast enough.  Some details (timings on
// Chrome 25 on a 2010 vintage macbook):
//
// seeded Math.random()          - avg less than 0.0002 milliseconds per call
// seedrandom('explicit.')       - avg less than 0.2 milliseconds per call
// seedrandom('explicit.', true) - avg less than 0.2 milliseconds per call
// seedrandom() with crypto      - avg less than 0.2 milliseconds per call
//
// Autoseeding without crypto is somewhat slower, about 20-30 milliseconds on
// a 2012 windows 7 1.5ghz i5 laptop, as seen on Firefox 19, IE 10, and Opera.
// Seeded rng calls themselves are fast across these browsers, with slowest
// numbers on Opera at about 0.0005 ms per seeded Math.random().
//
// LICENSE (MIT):
//
// Copyright (c)2014 David Bau.
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

/**
 * All code is in an anonymous closure to keep the global namespace clean.
 */
(function (
    global, pool, math, width, chunks, digits, module, define, rngname) {

//
// The following constants are related to IEEE 754 limits.
//
var startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,

//
// seedrandom()
// This is the seedrandom function described above.
//
impl = math['seed' + rngname] = function(seed, use_entropy, callback) {
  var key = [];

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    use_entropy ? [seed, tostring(pool)] :
    (seed == null) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (callback ||
      // If called as a method of Math (Math.seedrandom()), mutate Math.random
      // because that is how seedrandom.js has worked since v1.0.  Otherwise,
      // it is a newer calling convention, so return the prng directly.
      function(prng, seed, is_math_call) {
        if (is_math_call) { math[rngname] = prng; return seed; }
        else return prng;
      })(

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  }, shortseed, this == math);
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability discard an initial batch of values.
    // See http://www.rsa.com/rsalabs/node.asp?id=2009
  })(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj), prop;
  if (depth && typ == 'object') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto if available.
//
/** @param {Uint8Array|Navigator=} seed */
function autoseed(seed) {
  try {
    global.crypto.getRandomValues(seed = new Uint8Array(width));
    return tostring(seed);
  } catch (e) {
    return [+new Date, global, (seed = global.navigator) && seed.plugins,
            global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math[rngname](), pool);

//
// Nodejs and AMD support: export the implemenation as a module using
// either convention.
//
if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
}

// End anonymous scope, and pass initial values.
})(
  this,   // global window object
  [],     // pool: entropy pool starts empty
  Math,   // math: package containing random, pow, and seedrandom
  256,    // width: each RC4 output is 0 <= x < 256
  6,      // chunks: at least six RC4 outputs for each double
  52,     // digits: there are 52 significant digits in a double
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define,  // present with an AMD loader
  'random'// rngname: name for Math.random and Math.seedrandom
);

},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js":[function(require,module,exports){
module.exports.Context = require('./lib/Context');
module.exports.Texture = require('./lib/Texture');
module.exports.Texture2D = require('./lib/Texture2D');
module.exports.TextureCube = require('./lib/TextureCube');
module.exports.Program = require('./lib/Program');
module.exports.Material = require('./lib/Material');
module.exports.Mesh = require('./lib/Mesh');
module.exports.OrthographicCamera = require('./lib/OrthographicCamera');
module.exports.PerspectiveCamera = require('./lib/PerspectiveCamera');
module.exports.Arcball = require('./lib/Arcball');
module.exports.ScreenImage = require('./lib/ScreenImage');
module.exports.RenderTarget = require('./lib/RenderTarget');

//export all functions from Utils to module exports
var Utils = require('./lib/Utils');
for(var funcName in Utils) {
  module.exports[funcName] = Utils[funcName];
}


},{"./lib/Arcball":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Arcball.js","./lib/Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","./lib/Material":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Material.js","./lib/Mesh":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Mesh.js","./lib/OrthographicCamera":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/OrthographicCamera.js","./lib/PerspectiveCamera":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/PerspectiveCamera.js","./lib/Program":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Program.js","./lib/RenderTarget":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/RenderTarget.js","./lib/ScreenImage":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/ScreenImage.js","./lib/Texture":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Texture.js","./lib/Texture2D":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Texture2D.js","./lib/TextureCube":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/TextureCube.js","./lib/Utils":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Utils.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Arcball.js":[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var Arcball, Mat4, Plane, Quat, Vec2, Vec3, Vec4, _ref;

_ref = require('pex-geom'), Vec2 = _ref.Vec2, Vec3 = _ref.Vec3, Vec4 = _ref.Vec4, Quat = _ref.Quat, Mat4 = _ref.Mat4, Plane = _ref.Plane;

Arcball = (function() {
  function Arcball(window, camera, distance) {
    this.camera = camera;
    this.window = window;
    this.radius = Math.min(window.width / 2, window.height / 2) * 2;
    this.center = Vec2.create(window.width / 2, window.height / 2);
    this.currRot = Quat.create();
    this.currRot.setAxisAngle(Vec3.create(0, 1, 0), 0);
    this.clickRot = Quat.create();
    this.dragRot = Quat.create();
    this.clickPos = Vec3.create();
    this.clickPosWindow = Vec2.create();
    this.dragPos = Vec3.create();
    this.dragPosWindow = Vec2.create();
    this.rotAxis = Vec3.create();
    this.allowZooming = true;
    this.enabled = true;
    this.clickTarget = Vec3.create(0, 0, 0);
    this.setDistance(distance || 2);
    this.updateCamera();
    this.addEventHanlders();
  }

  Arcball.prototype.setTarget = function(target) {
    this.camera.setTarget(target);
    return this.updateCamera();
  };

  Arcball.prototype.setOrientation = function(dir) {
    this.currRot.setDirection(dir);
    this.currRot.w *= -1;
    this.updateCamera();
    return this;
  };

  Arcball.prototype.setPosition = function(pos) {
    var dir;
    dir = Vec3.create().asSub(pos, this.camera.getTarget());
    this.setOrientation(dir.dup().normalize());
    this.setDistance(dir.length());
    return this.updateCamera();
  };

  Arcball.prototype.addEventHanlders = function() {
    this.window.on('leftMouseDown', (function(_this) {
      return function(e) {
        if (e.handled || !_this.enabled) {
          return;
        }
        return _this.down(e.x, e.y, e.shift);
      };
    })(this));
    this.window.on('leftMouseUp', (function(_this) {
      return function(e) {
        return _this.up(e.x, e.y, e.shift);
      };
    })(this));
    this.window.on('mouseDragged', (function(_this) {
      return function(e) {
        if (e.handled || !_this.enabled) {
          return;
        }
        return _this.drag(e.x, e.y, e.shift);
      };
    })(this));
    return this.window.on('scrollWheel', (function(_this) {
      return function(e) {
        if (e.handled || !_this.enabled) {
          return;
        }
        if (!_this.allowZooming) {
          return;
        }
        _this.distance = Math.min(_this.maxDistance, Math.max(_this.distance + e.dy / 100 * (_this.maxDistance - _this.minDistance), _this.minDistance));
        return _this.updateCamera();
      };
    })(this));
  };

  Arcball.prototype.mouseToSphere = function(x, y) {
    var dist, v;
    y = this.window.height - y;
    v = Vec3.create((x - this.center.x) / this.radius, (y - this.center.y) / this.radius, 0);
    dist = v.x * v.x + v.y * v.y;
    if (dist > 1) {
      v.normalize();
    } else {
      v.z = Math.sqrt(1.0 - dist);
    }
    return v;
  };

  Arcball.prototype.down = function(x, y, shift) {
    var target, targetInViewSpace;
    this.dragging = true;
    this.clickPos = this.mouseToSphere(x, y);
    this.clickRot.copy(this.currRot);
    this.updateCamera();
    if (shift) {
      this.clickPosWindow.set(x, y);
      target = this.camera.getTarget();
      this.clickTarget = target.dup();
      targetInViewSpace = target.dup().transformMat4(this.camera.getViewMatrix());
      this.panPlane = new Plane(targetInViewSpace, new Vec3(0, 0, 1));
      this.clickPosPlane = this.panPlane.intersectRay(this.camera.getViewRay(this.clickPosWindow.x, this.clickPosWindow.y, this.window.width, this.window.height));
      return this.dragPosPlane = this.panPlane.intersectRay(this.camera.getViewRay(this.dragPosWindow.x, this.dragPosWindow.y, this.window.width, this.window.height));
    } else {
      return this.panPlane = null;
    }
  };

  Arcball.prototype.up = function(x, y, shift) {
    this.dragging = false;
    return this.panPlane = null;
  };

  Arcball.prototype.drag = function(x, y, shift) {
    var invViewMatrix, theta;
    if (!this.dragging) {
      return;
    }
    if (shift && this.panPlane) {
      this.dragPosWindow.set(x, y);
      this.clickPosPlane = this.panPlane.intersectRay(this.camera.getViewRay(this.clickPosWindow.x, this.clickPosWindow.y, this.window.width, this.window.height));
      this.dragPosPlane = this.panPlane.intersectRay(this.camera.getViewRay(this.dragPosWindow.x, this.dragPosWindow.y, this.window.width, this.window.height));
      invViewMatrix = this.camera.getViewMatrix().dup().invert();
      this.clickPosWorld = this.clickPosPlane.dup().transformMat4(invViewMatrix);
      this.dragPosWorld = this.dragPosPlane.dup().transformMat4(invViewMatrix);
      this.diffWorld = this.dragPosWorld.dup().sub(this.clickPosWorld);
      this.camera.setTarget(this.clickTarget.dup().sub(this.diffWorld));
      this.updateCamera();
    } else {
      this.dragPos = this.mouseToSphere(x, y);
      this.rotAxis.asCross(this.clickPos, this.dragPos);
      theta = this.clickPos.dot(this.dragPos);
      this.dragRot.set(this.rotAxis.x, this.rotAxis.y, this.rotAxis.z, theta);
      this.currRot.asMul(this.dragRot, this.clickRot);
    }
    return this.updateCamera();
  };

  Arcball.prototype.updateCamera = function() {
    var eye, offset, q, target, up;
    q = this.currRot.clone();
    q.w *= -1;
    target = this.camera.getTarget();
    offset = Vec3.create(0, 0, this.distance).transformQuat(q);
    eye = Vec3.create().asAdd(target, offset);
    up = Vec3.create(0, 1, 0).transformQuat(q);
    return this.camera.lookAt(target, eye, up);
  };

  Arcball.prototype.disableZoom = function() {
    return this.allowZooming = false;
  };

  Arcball.prototype.setDistance = function(distance) {
    this.distance = distance || 2;
    this.minDistance = distance / 2 || 0.3;
    this.maxDistance = distance * 2 || 5;
    return this.updateCamera();
  };

  return Arcball;

})();

module.exports = Arcball;

},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Buffer.js":[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var Buffer, Color, Context, Edge, Face3, Face4, FacePolygon, Vec2, Vec3, Vec4, hasProperties, _ref;

_ref = require('pex-geom'), Vec2 = _ref.Vec2, Vec3 = _ref.Vec3, Vec4 = _ref.Vec4, Edge = _ref.Edge, Face3 = _ref.Face3, Face4 = _ref.Face4, FacePolygon = _ref.FacePolygon;

Color = require('pex-color').Color;

Context = require('./Context');

hasProperties = function(obj, list) {
  var prop, _i, _len;
  for (_i = 0, _len = list.length; _i < _len; _i++) {
    prop = list[_i];
    if (typeof obj[prop] === 'undefined') {
      return false;
    }
  }
  return true;
};

Buffer = (function() {
  function Buffer(target, type, data, usage) {
    this.gl = Context.currentContext;
    this.target = target;
    this.type = type;
    this.usage = usage || gl.STATIC_DRAW;
    this.dataBuf = null;
    if (data) {
      this.update(data, this.usage);
    }
  }

  Buffer.prototype.dispose = function() {
    this.gl.deleteBuffer(this.handle);
    return this.handle = null;
  };

  Buffer.prototype.update = function(data, usage) {
    var e, face, i, index, numIndices, v, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _p;
    if (!this.handle) {
      this.handle = this.gl.createBuffer();
    }
    this.usage = usage || this.usage;
    if (!data || data.length === 0) {
      return;
    }
    if (!isNaN(data[0])) {
      if (!this.dataBuf || this.dataBuf.length !== data.length) {
        this.dataBuf = new this.type(data.length);
      }
      for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
        v = data[i];
        this.dataBuf[i] = v;
        this.elementSize = 1;
      }
    } else if (hasProperties(data[0], ['x', 'y', 'z', 'w'])) {
      if (!this.dataBuf || this.dataBuf.length !== data.length * 4) {
        this.dataBuf = new this.type(data.length * 4);
        this.elementSize = 4;
      }
      for (i = _j = 0, _len1 = data.length; _j < _len1; i = ++_j) {
        v = data[i];
        this.dataBuf[i * 4 + 0] = v.x;
        this.dataBuf[i * 4 + 1] = v.y;
        this.dataBuf[i * 4 + 2] = v.z;
        this.dataBuf[i * 4 + 3] = v.w;
      }
    } else if (hasProperties(data[0], ['x', 'y', 'z'])) {
      if (!this.dataBuf || this.dataBuf.length !== data.length * 3) {
        this.dataBuf = new this.type(data.length * 3);
        this.elementSize = 3;
      }
      for (i = _k = 0, _len2 = data.length; _k < _len2; i = ++_k) {
        v = data[i];
        this.dataBuf[i * 3 + 0] = v.x;
        this.dataBuf[i * 3 + 1] = v.y;
        this.dataBuf[i * 3 + 2] = v.z;
      }
    } else if (hasProperties(data[0], ['x', 'y'])) {
      if (!this.dataBuf || this.dataBuf.length !== data.length * 2) {
        this.dataBuf = new this.type(data.length * 2);
        this.elementSize = 2;
      }
      for (i = _l = 0, _len3 = data.length; _l < _len3; i = ++_l) {
        v = data[i];
        this.dataBuf[i * 2 + 0] = v.x;
        this.dataBuf[i * 2 + 1] = v.y;
      }
    } else if (hasProperties(data[0], ['r', 'g', 'b', 'a'])) {
      if (!this.dataBuf || this.dataBuf.length !== data.length * 4) {
        this.dataBuf = new this.type(data.length * 4);
        this.elementSize = 4;
      }
      for (i = _m = 0, _len4 = data.length; _m < _len4; i = ++_m) {
        v = data[i];
        this.dataBuf[i * 4 + 0] = v.r;
        this.dataBuf[i * 4 + 1] = v.g;
        this.dataBuf[i * 4 + 2] = v.b;
        this.dataBuf[i * 4 + 3] = v.a;
      }
    } else if (data[0].length === 2) {
      if (!this.dataBuf || this.dataBuf.length !== data.length * 2) {
        this.dataBuf = new this.type(data.length * 2);
        this.elementSize = 1;
      }
      for (i = _n = 0, _len5 = data.length; _n < _len5; i = ++_n) {
        e = data[i];
        this.dataBuf[i * 2 + 0] = e[0];
        this.dataBuf[i * 2 + 1] = e[1];
      }
    } else if (data[0].length >= 3) {
      numIndices = 0;
      for (_o = 0, _len6 = data.length; _o < _len6; _o++) {
        face = data[_o];
        if (face.length === 3) {
          numIndices += 3;
        }
        if (face.length === 4) {
          numIndices += 6;
        }
        if (face.length > 4) {
          throw 'FacePolygons ' + face.length + ' + are not supported in RenderableGeometry Buffers';
        }
      }
      if (!this.dataBuf || this.dataBuf.length !== numIndices) {
        this.dataBuf = new this.type(numIndices);
        this.elementSize = 1;
      }
      index = 0;
      for (_p = 0, _len7 = data.length; _p < _len7; _p++) {
        face = data[_p];
        if (face.length === 3) {
          this.dataBuf[index + 0] = face[0];
          this.dataBuf[index + 1] = face[1];
          this.dataBuf[index + 2] = face[2];
          index += 3;
        }
        if (face.length === 4) {
          this.dataBuf[index + 0] = face[0];
          this.dataBuf[index + 1] = face[1];
          this.dataBuf[index + 2] = face[3];
          this.dataBuf[index + 3] = face[3];
          this.dataBuf[index + 4] = face[1];
          this.dataBuf[index + 5] = face[2];
          index += 6;
        }
      }
    } else {
      console.log('Buffer.unknown type', data.name, data[0]);
    }
    this.gl.bindBuffer(this.target, this.handle);
    return this.gl.bufferData(this.target, this.dataBuf, this.usage);
  };

  return Buffer;

})();

module.exports = Buffer;

},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js":[function(require,module,exports){
var sys = require('pex-sys');

var currentGLContext = null;

var Context = {
};

Object.defineProperty(Context, 'currentContext', {
  get: function() { 
    if (currentGLContext) {
      return currentGLContext;
    }
    else if (sys.Window.currentWindow) {
      return sys.Window.currentWindow.gl;
    }
    else {
      return null;
    }
  },
  set: function(gl) {
    currentGLContext = gl;
  },
  enumerable: true,
  configurable: true
});

module.exports = Context;
},{"pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Material.js":[function(require,module,exports){
var Context = require('./Context');

function Material(program, uniforms) {
  this.gl = Context.currentContext;
  this.program = program;
  this.uniforms = uniforms || {};
  this.prevUniforms = {};
}

Material.prototype.use = function () {
  this.program.use();
  var numTextures = 0;
  for (var name in this.uniforms) {
    if (this.program.uniforms[name]) {
      if (this.program.uniforms[name].type == this.gl.SAMPLER_2D || this.program.uniforms[name].type == this.gl.SAMPLER_CUBE) {
        this.gl.activeTexture(this.gl.TEXTURE0 + numTextures);
        if (this.uniforms[name].width > 0 && this.uniforms[name].height > 0) {
          this.gl.bindTexture(this.uniforms[name].target, this.uniforms[name].handle);
          this.program.uniforms[name](numTextures);
        }
        numTextures++;
      } else {
        var newValue = this.uniforms[name];
        var oldValue = this.prevUniforms[name];
        var newHash = null;
        if (oldValue !== null) {
          if (newValue.hash) {
            newHash = newValue.hash();
            if (newHash == oldValue) {
              continue;
            }
          } else if (newValue == oldValue) {
            continue;
          }
        }
        this.program.uniforms[name](this.uniforms[name]);
        this.prevUniforms[name] = newHash ? newHash : newValue;
      }
    }
  }
};

module.exports = Material;
},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Mesh.js":[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var BoundingBox, Context, Mat4, Mesh, Quat, RenderableGeometry, Vec3, merge, _ref;

merge = require('merge');

_ref = require('pex-geom'), Vec3 = _ref.Vec3, Quat = _ref.Quat, Mat4 = _ref.Mat4, BoundingBox = _ref.BoundingBox;

Context = require('./Context');

RenderableGeometry = require('./RenderableGeometry');

Mesh = (function() {
  function Mesh(geometry, material, options) {
    this.gl = Context.currentContext;
    this.geometry = merge(geometry, RenderableGeometry);
    this.material = material;
    options = options || {};
    this.primitiveType = options.primitiveType;
    if (this.primitiveType == null) {
      this.primitiveType = this.gl.TRIANGLES;
    }
    if (options.lines) {
      this.primitiveType = this.gl.LINES;
    }
    if (options.triangles) {
      this.primitiveType = this.gl.TRIANGLES;
    }
    if (options.points) {
      this.primitiveType = this.gl.POINTS;
    }
    this.position = Vec3.create(0, 0, 0);
    this.rotation = Quat.create();
    this.scale = Vec3.create(1, 1, 1);
    this.projectionMatrix = Mat4.create();
    this.viewMatrix = Mat4.create();
    this.invViewMatrix = Mat4.create();
    this.modelWorldMatrix = Mat4.create();
    this.modelViewMatrix = Mat4.create();
    this.rotationMatrix = Mat4.create();
    this.normalMatrix = Mat4.create();
  }

  Mesh.prototype.draw = function(camera) {
    var num;
    if (this.geometry.isDirty()) {
      this.geometry.compile();
    }
    if (camera) {
      this.updateMatrices(camera);
      this.updateMatricesUniforms(this.material);
    }
    this.material.use();
    this.bindAttribs();
    if (this.geometry.faces && this.geometry.faces.length > 0 && this.primitiveType !== this.gl.LINES && this.primitiveType !== this.gl.POINTS) {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.faces.buffer.handle);
      this.gl.drawElements(this.primitiveType, this.geometry.faces.buffer.dataBuf.length, this.gl.UNSIGNED_SHORT, 0);
    } else if (this.geometry.edges && this.geometry.edges.length > 0 && this.primitiveType === this.gl.LINES) {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.edges.buffer.handle);
      this.gl.drawElements(this.primitiveType, this.geometry.edges.buffer.dataBuf.length, this.gl.UNSIGNED_SHORT, 0);
    } else if (this.geometry.vertices) {
      num = this.geometry.vertices.length;
      this.gl.drawArrays(this.primitiveType, 0, num);
    }
    return this.unbindAttribs();
  };

  Mesh.prototype.drawInstances = function(camera, instances) {
    var instance, num, _i, _j, _k, _len, _len1, _len2;
    if (this.geometry.isDirty()) {
      this.geometry.compile();
    }
    this.material.use();
    this.bindAttribs();
    if (this.geometry.faces && this.geometry.faces.length > 0 && !this.useEdges) {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.faces.buffer.handle);
      for (_i = 0, _len = instances.length; _i < _len; _i++) {
        instance = instances[_i];
        if (camera) {
          this.updateMatrices(camera, instance);
          this.updateMatricesUniforms(this.material);
          this.updateUniforms(this.material, instance);
          this.material.use();
        }
        this.gl.drawElements(this.primitiveType, this.geometry.faces.buffer.dataBuf.length, this.gl.UNSIGNED_SHORT, 0);
      }
    } else if (this.geometry.edges && this.useEdges) {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.edges.buffer.handle);
      for (_j = 0, _len1 = instances.length; _j < _len1; _j++) {
        instance = instances[_j];
        if (camera) {
          this.updateMatrices(camera, instance);
          this.updateMatricesUniforms(this.material);
          this.updateUniforms(this.material, instance);
          this.material.use();
        }
        this.gl.drawElements(this.primitiveType, this.geometry.edges.buffer.dataBuf.length, this.gl.UNSIGNED_SHORT, 0);
      }
    } else if (this.geometry.vertices) {
      num = this.geometry.vertices.length;
      for (_k = 0, _len2 = instances.length; _k < _len2; _k++) {
        instance = instances[_k];
        if (camera) {
          this.updateMatrices(camera, instance);
          this.updateMatricesUniforms(this.material);
          this.updateUniforms(this.material, instance);
          this.material.use();
        }
        this.gl.drawArrays(this.primitiveType, 0, num);
      }
    }
    return this.unbindAttribs();
  };

  Mesh.prototype.bindAttribs = function() {
    var attrib, name, program, _ref1, _results;
    program = this.material.program;
    _ref1 = this.geometry.attribs;
    _results = [];
    for (name in _ref1) {
      attrib = _ref1[name];
      attrib.location = this.gl.getAttribLocation(program.handle, attrib.name);
      if (attrib.location >= 0) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attrib.buffer.handle);
        this.gl.vertexAttribPointer(attrib.location, attrib.buffer.elementSize, this.gl.FLOAT, false, 0, 0);
        _results.push(this.gl.enableVertexAttribArray(attrib.location));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Mesh.prototype.unbindAttribs = function() {
    var attrib, name, _ref1, _results;
    _ref1 = this.geometry.attribs;
    _results = [];
    for (name in _ref1) {
      attrib = _ref1[name];
      if (attrib.location >= 0) {
        _results.push(this.gl.disableVertexAttribArray(attrib.location));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Mesh.prototype.resetAttribLocations = function() {
    var attrib, name, _results;
    _results = [];
    for (name in this.attributes) {
      attrib = this.attributes[name];
      _results.push(attrib.location = -1);
    }
    return _results;
  };

  Mesh.prototype.updateMatrices = function(camera, instance) {
    var position, rotation, scale;
    position = instance && instance.position ? instance.position : this.position;
    rotation = instance && instance.rotation ? instance.rotation : this.rotation;
    scale = instance && instance.scale ? instance.scale : this.scale;
    rotation.toMat4(this.rotationMatrix);
    this.modelWorldMatrix.identity().translate(position.x, position.y, position.z).mul(this.rotationMatrix).scale(scale.x, scale.y, scale.z);
    if (camera) {
      this.projectionMatrix.copy(camera.getProjectionMatrix());
      this.viewMatrix.copy(camera.getViewMatrix());
      this.invViewMatrix.copy(camera.getViewMatrix().dup().invert());
      this.modelViewMatrix.copy(camera.getViewMatrix()).mul(this.modelWorldMatrix);
      return this.normalMatrix.copy(this.modelViewMatrix).invert().transpose();
    }
  };

  Mesh.prototype.updateUniforms = function(material, instance) {
    var uniformName, uniformValue, _ref1, _results;
    _ref1 = instance.uniforms;
    _results = [];
    for (uniformName in _ref1) {
      uniformValue = _ref1[uniformName];
      _results.push(material.uniforms[uniformName] = uniformValue);
    }
    return _results;
  };

  Mesh.prototype.updateMatricesUniforms = function(material) {
    var materialUniforms, programUniforms;
    programUniforms = this.material.program.uniforms;
    materialUniforms = this.material.uniforms;
    if (programUniforms.projectionMatrix) {
      materialUniforms.projectionMatrix = this.projectionMatrix;
    }
    if (programUniforms.viewMatrix) {
      materialUniforms.viewMatrix = this.viewMatrix;
    }
    if (programUniforms.invViewMatrix) {
      materialUniforms.invViewMatrix = this.invViewMatrix;
    }
    if (programUniforms.modelWorldMatrix) {
      materialUniforms.modelWorldMatrix = this.modelWorldMatrix;
    }
    if (programUniforms.modelViewMatrix) {
      materialUniforms.modelViewMatrix = this.modelViewMatrix;
    }
    if (programUniforms.normalMatrix) {
      return materialUniforms.normalMatrix = this.normalMatrix;
    }
  };

  Mesh.prototype.getMaterial = function() {
    return this.material;
  };

  Mesh.prototype.setMaterial = function(material) {
    this.material = material;
    return this.resetAttribLocations();
  };

  Mesh.prototype.getProgram = function() {
    return this.material.program;
  };

  Mesh.prototype.setProgram = function(program) {
    this.material.program = program;
    return this.resetAttribLocations();
  };

  Mesh.prototype.dispose = function() {
    return this.geometry.dispose();
  };

  Mesh.prototype.getBoundingBox = function() {
    if (!this.boundingBox) {
      this.updateBoundingBox();
    }
    return this.boundingBox;
  };

  Mesh.prototype.updateBoundingBox = function() {
    this.updateMatrices();
    return this.boundingBox = BoundingBox.fromPoints(this.geometry.vertices.map((function(_this) {
      return function(v) {
        return v.dup().transformMat4(_this.modelWorldMatrix);
      };
    })(this)));
  };

  return Mesh;

})();

module.exports = Mesh;

},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","./RenderableGeometry":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/RenderableGeometry.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/OrthographicCamera.js":[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var Mat4, OrthographicCamera, Ray, Vec2, Vec3, Vec4, _ref;

_ref = require('pex-geom'), Vec2 = _ref.Vec2, Vec3 = _ref.Vec3, Vec4 = _ref.Vec4, Mat4 = _ref.Mat4, Ray = _ref.Ray;

OrthographicCamera = (function() {
  var projected;

  function OrthographicCamera(x, y, width, height, near, far, position, target, up) {
    var b, l, r, t;
    l = x;
    r = x + width;
    t = y;
    b = y + height;
    this.left = l;
    this.right = r;
    this.bottom = b;
    this.top = t;
    this.near = near || 0.1;
    this.far = far || 100;
    this.position = position || Vec3.create(0, 0, 5);
    this.target = target || Vec3.create(0, 0, 0);
    this.up = up || Vec3.create(0, 1, 0);
    this.projectionMatrix = Mat4.create();
    this.viewMatrix = Mat4.create();
    this.updateMatrices();
  }

  OrthographicCamera.prototype.getFov = function() {
    return this.fov;
  };

  OrthographicCamera.prototype.getAspectRatio = function() {
    return this.aspectRatio;
  };

  OrthographicCamera.prototype.getNear = function() {
    return this.near;
  };

  OrthographicCamera.prototype.getFar = function() {
    return this.far;
  };

  OrthographicCamera.prototype.getPosition = function() {
    return this.position;
  };

  OrthographicCamera.prototype.getTarget = function() {
    return this.target;
  };

  OrthographicCamera.prototype.getUp = function() {
    return this.up;
  };

  OrthographicCamera.prototype.getViewMatrix = function() {
    return this.viewMatrix;
  };

  OrthographicCamera.prototype.getProjectionMatrix = function() {
    return this.projectionMatrix;
  };

  OrthographicCamera.prototype.setFov = function(fov) {
    this.fov = fov;
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.setAspectRatio = function(ratio) {
    this.aspectRatio = ratio;
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.setFar = function(far) {
    this.far = far;
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.setNear = function(near) {
    this.near = near;
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.setPosition = function(position) {
    this.position = position;
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.setTarget = function(target) {
    this.target = target;
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.setUp = function(up) {
    this.up = up;
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.lookAt = function(target, eyePosition, up) {
    if (target) {
      this.target = target;
    }
    if (eyePosition) {
      this.position = eyePosition;
    }
    if (up) {
      this.up = up;
    }
    return this.updateMatrices();
  };

  OrthographicCamera.prototype.updateMatrices = function() {
    this.projectionMatrix.identity().ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
    return this.viewMatrix.identity().lookAt(this.position, this.target, this.up);
  };

  projected = Vec4.create();

  OrthographicCamera.prototype.getScreenPos = function(point, windowWidth, windowHeight) {
    var out;
    projected.set(point.x, point.y, point.z, 1.0);
    projected.transformMat4(this.viewMatrix);
    projected.transformMat4(this.projectionMatrix);
    out = Vec2.create().set(projected.x, projected.y);
    out.x /= projected.w;
    out.y /= projected.w;
    out.x = out.x * 0.5 + 0.5;
    out.y = out.y * 0.5 + 0.5;
    out.x *= windowWidth;
    out.y *= windowHeight;
    return out;
  };

  OrthographicCamera.prototype.getWorldRay = function(x, y, windowWidth, windowHeight) {
    var hNear, invViewMatrix, vOrigin, vTarget, wDirection, wNear, wOrigin, wTarget;
    x = (x - windowWidth / 2) / (windowWidth / 2);
    y = -(y - windowHeight / 2) / (windowHeight / 2);
    hNear = 2 * Math.tan(this.getFov() / 180 * Math.PI / 2) * this.getNear();
    wNear = hNear * this.getAspectRatio();
    x *= wNear / 2;
    y *= hNear / 2;
    vOrigin = new Vec3(0, 0, 0);
    vTarget = new Vec3(x, y, -this.getNear());
    invViewMatrix = this.getViewMatrix().dup().invert();
    wOrigin = vOrigin.dup().transformMat4(invViewMatrix);
    wTarget = vTarget.dup().transformMat4(invViewMatrix);
    wDirection = wTarget.dup().sub(wOrigin);
    return new Ray(wOrigin, wDirection);
  };

  return OrthographicCamera;

})();

module.exports = OrthographicCamera;

},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/PerspectiveCamera.js":[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var Mat4, PerspectiveCamera, Ray, Vec2, Vec3, Vec4, _ref;

_ref = require('pex-geom'), Vec2 = _ref.Vec2, Vec3 = _ref.Vec3, Vec4 = _ref.Vec4, Mat4 = _ref.Mat4, Ray = _ref.Ray;

PerspectiveCamera = (function() {
  var projected;

  function PerspectiveCamera(fov, aspectRatio, near, far, position, target, up) {
    this.fov = fov || 60;
    this.aspectRatio = aspectRatio || 4 / 3;
    this.near = near || 0.1;
    this.far = far || 100;
    this.position = position || Vec3.create(0, 0, 5);
    this.target = target || Vec3.create(0, 0, 0);
    this.up = up || Vec3.create(0, 1, 0);
    this.projectionMatrix = Mat4.create();
    this.viewMatrix = Mat4.create();
    this.updateMatrices();
  }

  PerspectiveCamera.prototype.getFov = function() {
    return this.fov;
  };

  PerspectiveCamera.prototype.getAspectRatio = function() {
    return this.aspectRatio;
  };

  PerspectiveCamera.prototype.getNear = function() {
    return this.near;
  };

  PerspectiveCamera.prototype.getFar = function() {
    return this.far;
  };

  PerspectiveCamera.prototype.getPosition = function() {
    return this.position;
  };

  PerspectiveCamera.prototype.getTarget = function() {
    return this.target;
  };

  PerspectiveCamera.prototype.getUp = function() {
    return this.up;
  };

  PerspectiveCamera.prototype.getViewMatrix = function() {
    return this.viewMatrix;
  };

  PerspectiveCamera.prototype.getProjectionMatrix = function() {
    return this.projectionMatrix;
  };

  PerspectiveCamera.prototype.setFov = function(fov) {
    this.fov = fov;
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.setAspectRatio = function(ratio) {
    this.aspectRatio = ratio;
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.setFar = function(far) {
    this.far = far;
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.setNear = function(near) {
    this.near = near;
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.setPosition = function(position) {
    this.position = position;
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.setTarget = function(target) {
    this.target = target;
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.setUp = function(up) {
    this.up = up;
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.lookAt = function(target, eyePosition, up) {
    if (target) {
      this.target = target;
    }
    if (eyePosition) {
      this.position = eyePosition;
    }
    if (up) {
      this.up = up;
    }
    return this.updateMatrices();
  };

  PerspectiveCamera.prototype.updateMatrices = function() {
    this.projectionMatrix.identity().perspective(this.fov, this.aspectRatio, this.near, this.far);
    return this.viewMatrix.identity().lookAt(this.position, this.target, this.up);
  };

  projected = Vec4.create();

  PerspectiveCamera.prototype.getScreenPos = function(point, windowWidth, windowHeight) {
    var out;
    projected.set(point.x, point.y, point.z, 1.0);
    projected.transformMat4(this.viewMatrix);
    projected.transformMat4(this.projectionMatrix);
    out = Vec2.create().set(projected.x, projected.y);
    out.x /= projected.w;
    out.y /= projected.w;
    out.x = out.x * 0.5 + 0.5;
    out.y = out.y * 0.5 + 0.5;
    out.x *= windowWidth;
    out.y *= windowHeight;
    return out;
  };

  PerspectiveCamera.prototype.getViewRay = function(x, y, windowWidth, windowHeight) {
    var hNear, px, py, vDirection, vOrigin, vTarget, wNear;
    px = (x - windowWidth / 2) / (windowWidth / 2);
    py = -(y - windowHeight / 2) / (windowHeight / 2);
    hNear = 2 * Math.tan(this.getFov() / 180 * Math.PI / 2) * this.getNear();
    wNear = hNear * this.getAspectRatio();
    px *= wNear / 2;
    py *= hNear / 2;
    vOrigin = new Vec3(0, 0, 0);
    vTarget = new Vec3(px, py, -this.getNear());
    vDirection = vTarget.dup().sub(vOrigin).normalize();
    return new Ray(vOrigin, vDirection);
  };

  PerspectiveCamera.prototype.getWorldRay = function(x, y, windowWidth, windowHeight) {
    var hNear, invViewMatrix, vOrigin, vTarget, wDirection, wNear, wOrigin, wTarget;
    x = (x - windowWidth / 2) / (windowWidth / 2);
    y = -(y - windowHeight / 2) / (windowHeight / 2);
    hNear = 2 * Math.tan(this.getFov() / 180 * Math.PI / 2) * this.getNear();
    wNear = hNear * this.getAspectRatio();
    x *= wNear / 2;
    y *= hNear / 2;
    vOrigin = new Vec3(0, 0, 0);
    vTarget = new Vec3(x, y, -this.getNear());
    invViewMatrix = this.getViewMatrix().dup().invert();
    wOrigin = vOrigin.dup().transformMat4(invViewMatrix);
    wTarget = vTarget.dup().transformMat4(invViewMatrix);
    wDirection = wTarget.dup().sub(wOrigin);
    return new Ray(wOrigin, wDirection);
  };

  return PerspectiveCamera;

})();

module.exports = PerspectiveCamera;

},{"pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Program.js":[function(require,module,exports){
var Context = require('./Context');
var sys = require('pex-sys');
var IO = sys.IO;

var kVertexShaderPrefix = '' +
  '#ifdef GL_ES\n' +
  'precision highp float;\n' +
  '#endif\n' +
  '#define VERT\n';

var kFragmentShaderPrefix = '' +
  '#ifdef GL_ES\n' +
  '#ifdef GL_FRAGMENT_PRECISION_HIGH\n' +
  '  precision highp float;\n' +
  '#else\n' +
  '  precision mediump float;\n' +
  '#endif\n' +
  '#endif\n' +
  '#define FRAG\n';

function Program(vertSrc, fragSrc) {
  this.gl = Context.currentContext;
  this.handle = this.gl.createProgram();
  this.uniforms = {};
  this.attributes = {};
  this.addSources(vertSrc, fragSrc);
  this.ready = false;
  if (this.vertShader && this.fragShader) {
    this.link();
  }
}

Program.prototype.addSources = function(vertSrc, fragSrc) {
  if (fragSrc == null) {
    fragSrc = vertSrc;
  }
  if (vertSrc) {
    this.addVertexSource(vertSrc);
  }
  if (fragSrc) {
    return this.addFragmentSource(fragSrc);
  }
};

Program.prototype.addVertexSource = function(vertSrc) {
  this.vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
  this.gl.shaderSource(this.vertShader, kVertexShaderPrefix + vertSrc + '\n');
  this.gl.compileShader(this.vertShader);
  if (!this.gl.getShaderParameter(this.vertShader, this.gl.COMPILE_STATUS)) {
    throw this.gl.getShaderInfoLog(this.vertShader);
  }
};

Program.prototype.addFragmentSource = function(fragSrc) {
  this.fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
  this.gl.shaderSource(this.fragShader, kFragmentShaderPrefix + fragSrc + '\n');
  this.gl.compileShader(this.fragShader);
  if (!this.gl.getShaderParameter(this.fragShader, this.gl.COMPILE_STATUS)) {
    throw this.gl.getShaderInfoLog(this.fragShader);
  }
};

Program.prototype.link = function() {
  this.gl.attachShader(this.handle, this.vertShader);
  this.gl.attachShader(this.handle, this.fragShader);
  this.gl.linkProgram(this.handle);

  if (!this.gl.getProgramParameter(this.handle, this.gl.LINK_STATUS)) {
    throw this.gl.getProgramInfoLog(this.handle);
  }

  var numUniforms = this.gl.getProgramParameter(this.handle, this.gl.ACTIVE_UNIFORMS);

  for (var i=0; i<numUniforms; i++) {
    var info = this.gl.getActiveUniform(this.handle, i);
    if (info.size > 1) {
      for (var j=0; j<info.size; j++) {
        var arrayElementName = info.name.replace(/\[\d+\]/, '[' + j + ']');
        var location = this.gl.getUniformLocation(this.handle, arrayElementName);
        this.uniforms[arrayElementName] = Program.makeUniformSetter(this.gl, info.type, location);
      }
    } else {
      var location = this.gl.getUniformLocation(this.handle, info.name);
      this.uniforms[info.name] = Program.makeUniformSetter(this.gl, info.type, location);
    }
  }

  var numAttributes = this.gl.getProgramParameter(this.handle, this.gl.ACTIVE_ATTRIBUTES);
  for (var i=0; i<numAttributes; i++) {
    info = this.gl.getActiveAttrib(this.handle, i);
    var location = this.gl.getAttribLocation(this.handle, info.name);
    this.attributes[info.name] = location;
  }
  this.ready = true;
  return this;
};

Program.prototype.use = function() {
  if (Program.currentProgram !== this.handle) {
    Program.currentProgram = this.handle;
    return this.gl.useProgram(this.handle);
  }
};

Program.prototype.dispose = function() {
  this.gl.deleteShader(this.vertShader);
  this.gl.deleteShader(this.fragShader);
  return this.gl.deleteProgram(this.handle);
};

Program.load = function(url, callback, options) {
  var program;
  program = new Program();
  IO.loadTextFile(url, function(source) {
    console.log("Program.Compiling " + url);
    program.addSources(source);
    program.link();
    if (callback) {
      callback();
    }
    if (options && options.autoreload) {
      return IO.watchTextFile(url, function(source) {
        var e;
        try {
          program.gl.detachShader(program.handle, program.vertShader);
          program.gl.detachShader(program.handle, program.fragShader);
          program.addSources(source);
          return program.link();
        } catch (_error) {
          e = _error;
          console.log("Program.load : failed to reload " + url);
          return console.log(e);
        }
      });
    }
  });
  return program;
};

Program.makeUniformSetter = function(gl, type, location) {
  var setterFun = null;
  switch (type) {
    case gl.BOOL:
    case gl.INT:
      setterFun = function(value) {
        return gl.uniform1i(location, value);
      };
      break;
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      setterFun = function(value) {
        return gl.uniform1i(location, value);
      };
      break;
    case gl.FLOAT:
      setterFun = function(value) {
        return gl.uniform1f(location, value);
      };
      break;
    case gl.FLOAT_VEC2:
      setterFun = function(v) {
        return gl.uniform2f(location, v.x, v.y);
      };
      break;
    case gl.FLOAT_VEC3:
      setterFun = function(v) {
        return gl.uniform3f(location, v.x, v.y, v.z);
      };
      break;
    case gl.FLOAT_VEC4:
      setterFun = function(v) {
        if (v.r != null) {
          gl.uniform4f(location, v.r, v.g, v.b, v.a);
        }
        if (v.x != null) {
          return gl.uniform4f(location, v.x, v.y, v.z, v.w);
        }
      };
      break;
    case gl.FLOAT_MAT4:
      var mv = new Float32Array(16);
      setterFun = function(m) {
        mv[0] = m.a11;
        mv[1] = m.a21;
        mv[2] = m.a31;
        mv[3] = m.a41;
        mv[4] = m.a12;
        mv[5] = m.a22;
        mv[6] = m.a32;
        mv[7] = m.a42;
        mv[8] = m.a13;
        mv[9] = m.a23;
        mv[10] = m.a33;
        mv[11] = m.a43;
        mv[12] = m.a14;
        mv[13] = m.a24;
        mv[14] = m.a34;
        mv[15] = m.a44;
        return gl.uniformMatrix4fv(location, false, mv);
      };
  }
  if (setterFun) {
    setterFun.type = type;
    return setterFun;
  } else {
    return function() {
      throw "Unknown uniform type: " + type;
    };
  }
};

module.exports = Program;
},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/RenderTarget.js":[function(require,module,exports){
var Context = require('./Context');
var Texture2D = require('./Texture2D');
var merge = require('merge');
var sys = require('pex-sys');
var Platform = sys.Platform;

function RenderTarget(width, height, options) {
  var gl = this.gl = Context.currentContext;

  var defaultOptions = {
    color: true,
    depth: false
  };
  options = merge(defaultOptions, options);

  this.width = width;
  this.height = height;

  //save current state to recover after we are done
  this.oldBinding = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  this.handle = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);

  this.colorAttachments = [];
  this.colorAttachmentsPositions = [];
  this.depthAttachments = [];

  //color buffer

  if (options.color === true) { //make our own
    var texture = Texture2D.create(width, height, options);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texture.target, texture.handle, 0);
    this.colorAttachments.push(texture);
    this.colorAttachmentsPositions.push(gl.COLOR_ATTACHMENT0);
  }
  else if (options.color.length !== undefined && options.color.length > 0) { //use supplied textures for MRT
    options.color.forEach(function(colorBuf, colorBufIndex) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + colorBufIndex, colorBuf.target, colorBuf.handle, 0);
      this.colorAttachments.push(colorBuf);
      this.colorAttachmentsPositions.push(gl.COLOR_ATTACHMENT0 + colorBufIndex);
    }.bind(this));
  }
  else if (options.color !== false) { //use supplied texture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, options.color.target, options.color.handle, 0);
    this.colorAttachments.push(options.color);
    this.colorAttachmentsPositions.push(gl.COLOR_ATTACHMENT0);
  }

  //depth buffer

  if (options.depth) {
    if (options.depth === true) {
      var oldRenderBufferBinding = gl.getParameter(gl.RENDERBUFFER_BINDING);

      this.depthAttachments[0] = { handle:  gl.createRenderbuffer() };
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthAttachments[0].handle);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
      gl.bindRenderbuffer(gl.RENDERBUFFER, oldRenderBufferBinding);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthAttachments[0].handle);
    }
    else { //use supplied depth texture
      this.depthAttachments[0] = options.depth;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthAttachments[0].handle, 0);
    }
  }

  this.checkFramebuffer();
  this.checkExtensions();

  //revert to old framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.oldBinding);
  this.oldBinding = null;
}

RenderTarget.prototype.checkExtensions = function() {
  var gl = this.gl;
  if (Platform.isBrowser) {
    if (this.colorAttachments.length > 1) {
      this.webglDrawBuffersExt = gl.getExtension('WEBGL_draw_buffers');
      if (!this.webglDrawBuffersExt) {
        throw 'RenderTarget creating multiple render targets:' + this.colorAttachments.length + ' but WEBGL_draw_buffers is not available';
      }
    }
  }
}

RenderTarget.prototype.bind = function () {
  var gl = this.gl;
  this.oldBinding = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
  if (this.colorAttachmentsPositions.length > 1) {
    if (Platform.isBrowser) {
      this.webglDrawBuffersExt.drawBuffersWEBGL(this.colorAttachmentsPositions);
    }
    else {
     gl.drawBuffers(this.colorAttachmentsPositions);
    }
  }
};

RenderTarget.prototype.bindAndClear = function () {
  var gl = this.gl;
  this.bind();

  gl.clearColor(0, 0, 0, 1);
  if (this.depthAttachments.length > 0) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  else {
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
};

RenderTarget.prototype.unbind = function () {
  var gl = this.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.oldBinding);
  this.oldBinding = null;
  if (this.colorAttachmentsPositions.length > 1) {
    if (Platform.isBrowser) {
      this.webglDrawBuffersExt.drawBuffersWEBGL([gl.COLOR_ATTACHMENT0]);
    }
    else {
     gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    }
  }
};

//assumes that the framebuffer is bound
RenderTarget.prototype.checkFramebuffer = function() {
  var gl = this.gl;
  var valid = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  switch(valid) {
    case gl.FRAMEBUFFER_UNSUPPORTED:                    throw 'Framebuffer is unsupported';
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:          throw 'Framebuffer incomplete attachment';
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:          throw 'Framebuffer incomplete dimensions';
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:  throw 'Framebuffer incomplete missing attachment';
  }
}

RenderTarget.prototype.getColorAttachment = function (index) {
  index = index || 0;
  return this.colorAttachments[index];
};

RenderTarget.prototype.getDepthAttachement = function() {
  return this.depthAttachments[0];
}

 module.exports = RenderTarget;
},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","./Texture2D":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Texture2D.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/RenderableGeometry.js":[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var Buffer, Context, Geometry, RenderableGeometry, indexTypes;

Geometry = require('pex-geom').Geometry;

Context = require('./Context');

Buffer = require('./Buffer');

indexTypes = ['faces', 'edges', 'indices'];

RenderableGeometry = {
  compile: function() {
    var attrib, attribName, indexName, usage, _i, _len, _ref, _results;
    if (this.gl == null) {
      this.gl = Context.currentContext;
    }
    _ref = this.attribs;
    for (attribName in _ref) {
      attrib = _ref[attribName];
      if (!attrib.buffer) {
        usage = attrib.dynamic ? this.gl.DYNAMIC_DRAW : this.gl.STATIC_DRAW;
        attrib.buffer = new Buffer(this.gl.ARRAY_BUFFER, Float32Array, null, usage);
        attrib.dirty = true;
      }
      if (attrib.dirty) {
        attrib.buffer.update(attrib);
        attrib.dirty = false;
      }
    }
    _results = [];
    for (_i = 0, _len = indexTypes.length; _i < _len; _i++) {
      indexName = indexTypes[_i];
      if (this[indexName]) {
        if (!this[indexName].buffer) {
          usage = this[indexName].dynamic ? this.gl.DYNAMIC_DRAW : this.gl.STATIC_DRAW;
          this[indexName].buffer = new Buffer(this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array, null, usage);
          this[indexName].dirty = true;
        }
        if (this[indexName].dirty) {
          this[indexName].buffer.update(this[indexName]);
          _results.push(this[indexName].dirty = false);
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  },
  dispose: function() {
    var attrib, attribName, indexName, _i, _len, _ref, _results;
    _ref = this.attribs;
    for (attribName in _ref) {
      attrib = _ref[attribName];
      if (attrib && attrib.buffer) {
        attrib.buffer.dispose();
      }
    }
    _results = [];
    for (_i = 0, _len = indexTypes.length; _i < _len; _i++) {
      indexName = indexTypes[_i];
      if (this[indexName] && this[indexName].buffer) {
        _results.push(this[indexName].buffer.dispose());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  }
};

module.exports = RenderableGeometry;

},{"./Buffer":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Buffer.js","./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/ScreenImage.js":[function(require,module,exports){
(function (__dirname){
var geom = require('pex-geom');
var Vec2 = geom.Vec2;
var Geometry = geom.Geometry;
var Program = require('./Program');
var Material = require('./Material');
var Mesh = require('./Mesh');


var ScreenImageGLSL = "#ifdef VERT\n\nattribute vec2 position;\nattribute vec2 texCoord;\nuniform vec2 screenSize;\nuniform vec2 pixelPosition;\nuniform vec2 pixelSize;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  float tx = position.x * 0.5 + 0.5; //-1 -> 0, 1 -> 1\n  float ty = -position.y * 0.5 + 0.5; //-1 -> 1, 1 -> 0\n  //(x + 0)/sw * 2 - 1, (x + w)/sw * 2 - 1\n  float x = (pixelPosition.x + pixelSize.x * tx)/screenSize.x * 2.0 - 1.0;  //0 -> -1, 1 -> 1\n  //1.0 - (y + h)/sh * 2, 1.0 - (y + h)/sh * 2\n  float y = 1.0 - (pixelPosition.y + pixelSize.y * ty)/screenSize.y * 2.0;  //0 -> 1, 1 -> -1\n  gl_Position = vec4(x, y, 0.0, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec2 vTexCoord;\nuniform sampler2D image;\nuniform float alpha;\n\nvoid main() {\n  gl_FragColor = texture2D(image, vTexCoord);\n  gl_FragColor.a *= alpha;\n}\n\n#endif";

function ScreenImage(image, x, y, w, h, screenWidth, screenHeight) {
  x = x !== undefined ? x : 0;
  y = y !== undefined ? y : 0;
  w = w !== undefined ? w : 1;
  h = h !== undefined ? h : 1;
  screenWidth = screenWidth !== undefined ? screenWidth : 1;
  screenHeight = screenHeight !== undefined ? screenHeight : 1;
  this.image = image;
  var program = new Program(ScreenImageGLSL);
  var uniforms = {
    screenSize: Vec2.create(screenWidth, screenHeight),
    pixelPosition: Vec2.create(x, y),
    pixelSize: Vec2.create(w, h),
    alpha: 1
  };
  if (image) {
    uniforms.image = image;
  }
  var material = new Material(program, uniforms);
  var vertices = [
    new Vec2(-1, 1),
    new Vec2(-1, -1),
    new Vec2(1, -1),
    new Vec2(1, 1)
  ];
  var texCoords = [
    new Vec2(0, 1),
    new Vec2(0, 0),
    new Vec2(1, 0),
    new Vec2(1, 1)
  ];
  var geometry = new Geometry({
    vertices: vertices,
    texCoords: texCoords,
    faces: true
  });
  // 0----3  0,1   1,1
  // | \  |      u
  // |  \ |      v
  // 1----2  0,0   0,1
  geometry.faces.push([0, 1, 2]);
  geometry.faces.push([0, 2, 3]);
  this.mesh = new Mesh(geometry, material);
}

ScreenImage.prototype.setAlpha = function (alpha) {
  this.mesh.material.uniforms.alpha = alpha;
};

ScreenImage.prototype.setPosition = function (position) {
  this.mesh.material.uniforms.pixelPosition = position;
};

ScreenImage.prototype.setSize = function (size) {
  this.mesh.material.uniforms.pixelSize = size;
};

ScreenImage.prototype.setWindowSize = function (size) {
  this.mesh.material.uniforms.windowSize = size;
};

ScreenImage.prototype.setBounds = function (bounds) {
  this.mesh.material.uniforms.pixelPosition.x = bounds.x;
  this.mesh.material.uniforms.pixelPosition.y = bounds.y;
  this.mesh.material.uniforms.pixelSize.x = bounds.width;
  this.mesh.material.uniforms.pixelSize.y = bounds.height;
};

ScreenImage.prototype.setImage = function (image) {
  this.image = image;
  this.mesh.material.uniforms.image = image;
};

ScreenImage.prototype.draw = function (image, program) {
  var oldImage = null;
  if (image) {
    oldImage = this.mesh.material.uniforms.image;
    this.mesh.material.uniforms.image = image;
  }
  var oldProgram = null;
  if (program) {
    oldProgram = this.mesh.getProgram();
    this.mesh.setProgram(program);
  }
  this.mesh.draw();
  if (oldProgram) {
    this.mesh.setProgram(oldProgram);
  }
  if (oldImage) {
    this.mesh.material.uniforms.image = oldImage;
  }
};

module.exports = ScreenImage;
}).call(this,"/node_modules/pex-glu/lib")
},{"./Material":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Material.js","./Mesh":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Mesh.js","./Program":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Program.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Texture.js":[function(require,module,exports){
var Context = require('./Context');

function Texture(target) {
  if (target) {
    this.init(target);
  }
}

Texture.RGBA32F = 34836;

Texture.prototype.init = function(target) {
  this.gl = Context.currentContext;
  this.target = target;
  this.handle = this.gl.createTexture();
};

//### bind ( unit )
//Binds the texture to the current GL context.
//`unit` - texture unit in which to place the texture *{ Number/Int }* = 0

Texture.prototype.bind = function(unit) {
  unit = unit ? unit : 0;
  this.gl.activeTexture(this.gl.TEXTURE0 + unit);
  this.gl.bindTexture(this.target, this.handle);
};

module.exports = Texture;
},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Texture2D.js":[function(require,module,exports){
var sys = require('pex-sys');
var merge = require('merge');
var IO = sys.IO;
var Context = require('./Context');
var Texture = require('./Texture');
var Platform = sys.Platform;

function Texture2D() {
  this.gl = Context.currentContext;
  Texture.call(this, this.gl.TEXTURE_2D);
}

Texture2D.prototype = Object.create(Texture.prototype);

Texture2D.create = function(w, h, options) {
  var gl = Context.currentContext;

  var defaultOptions = {
    repeat: false,
    mipmap: false,
    nearest: false,
    internalFormat: gl.RGBA,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE
  };
  options = merge(defaultOptions, options);

  var texture = new Texture2D();
  texture.bind();

  var isWebGL = gl.getExtension ? true : false;
  if (options.bpp == 32) {
    options.internalFormat = isWebGL ? gl.RGBA : 34836;
    options.type = gl.FLOAT;
  }
  else {
    options.internalFormat = options.format;
  }

  texture.checkExtensions(options);

  gl.texImage2D(gl.TEXTURE_2D, 0, options.format, w, h, 0, options.format, options.type, null);

  var wrapS = options.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  var wrapT = options.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  var magFilter = gl.LINEAR;
  var minFilter = gl.LINEAR;

  if (options.nearest) {
    magFilter = gl.NEAREST;
    minFilter = gl.NEAREST;
  }

  if (options.mipmap) {
    minFilter = gl.LINEAR_MIPMAP_LINEAR;
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.bindTexture(gl.TEXTURE_2D, null);

  texture.width = w;
  texture.height = h;
  texture.target = gl.TEXTURE_2D;
  return texture;
};

Texture2D.prototype.checkExtensions = function(options) {
  var gl = this.gl;
  if (Platform.isBrowser) {
    if (options.format == gl.DEPTH_COMPONENT) {
      var depthTextureExt = gl.getExtension('WEBGL_depth_texture');
      if (!depthTextureExt) {
        throw 'Texture2D creating texture with format:gl.DEPTH_COMPONENT but WEBGL_depth_texture is not available';
      }
    }
    if (options.type == gl.FLOAT) {
      var textureFloatExt = gl.getExtension('OES_texture_float');
      if (!textureFloatExt) {
        throw 'Texture2D creating texture with type:gl.FLOAT but OES_texture_float is not available';
      }
    }
  }
}

Texture2D.prototype.bind = function(unit) {
  unit = unit ? unit : 0;
  this.gl.activeTexture(this.gl.TEXTURE0 + unit);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.handle);
};

Texture2D.genNoise = function(w, h) {
  w = w || 256;
  h = h || 256;
  var gl = Context.currentContext;
  var texture = new Texture2D();
  texture.bind();
  //TODO: should check unpack alignment as explained here https://groups.google.com/forum/#!topic/webgl-dev-list/wuUZP7iTr9Q
  var b = new ArrayBuffer(w * h * 2);
  var pixels = new Uint8Array(b);
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      pixels[y * w + x] = Math.floor(Math.random() * 255);
    }
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, pixels);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  texture.width = w;
  texture.height = h;
  return texture;
};

Texture2D.genNoiseRGBA = function(w, h) {
  w = w || 256;
  h = h || 256;
  var gl = Context.currentContext;
  var handle = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, handle);
  var b = new ArrayBuffer(w * h * 4);
  var pixels = new Uint8Array(b);
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      pixels[(y * w + x) * 4 + 0] = y;
      pixels[(y * w + x) * 4 + 1] = Math.floor(255 * Math.random());
      pixels[(y * w + x) * 4 + 2] = Math.floor(255 * Math.random());
      pixels[(y * w + x) * 4 + 3] = Math.floor(255 * Math.random());
    }
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  var texture = new Texture2D();
  texture.handle = handle;
  texture.width = w;
  texture.height = h;
  texture.target = gl.TEXTURE_2D;
  texture.gl = gl;
  return texture;
};

Texture2D.load = function(src, options, callback) {
  if (!callback && typeof(options) == 'function') {
    callback = options;
    optiosn = null;
  }
  var defaultOptions = {
    repeat: false,
    mipmap: false,
    nearest: false
  };
  options = merge(defaultOptions, options);

  var gl = Context.currentContext;
  var texture = Texture2D.create(0, 0, options);
  texture.ready = false;
  IO.loadImageData(gl, texture.handle, texture.target, texture.target, src, { flip: true, crossOrigin: options.crossOrigin }, function(image) {
    if (!image) {
      texture.dispose();
      var noise = Texture2D.getNoise();
      texture.handle = noise.handle;
      texture.width = noise.width;
      texture.height = noise.height;
    }
    if (options.mipmap) {
      texture.generateMipmap();
    }
    gl.bindTexture(texture.target, null);
    texture.width = image.width;
    texture.height = image.height;
    texture.ready = true;
    if (callback) {
      callback(texture);
    }
  });
  return texture;
};

Texture2D.prototype.dispose = function() {
  if (this.handle) {
    this.gl.deleteTexture(this.handle);
    this.handle = null;
  }
};

Texture2D.prototype.generateMipmap = function() {
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.handle);
  this.gl.generateMipmap(this.gl.TEXTURE_2D);
}

module.exports = Texture2D;
},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","./Texture":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Texture.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/TextureCube.js":[function(require,module,exports){
var sys = require('pex-sys');
var IO = sys.IO;
var Platform = sys.Platform;
var Context = require('./Context');
var Texture = require('./Texture');
var merge = require('merge');

//### TextureCube ( )
//Does nothing, use *load()* method instead.
function TextureCube() {
  this.gl = Context.currentContext;
  Texture.call(this, this.gl.TEXTURE_CUBE_MAP);
}

TextureCube.prototype = Object.create(Texture.prototype);

//### load ( src )
//Load texture from file (in Plask) or url (in the web browser).
//
//`src` - path to file or url (e.g. *path/file_####.jpg*) *{ String }*
//
//Returns the loaded texture *{ Texture2D }*
//
//*Note* the path or url must contain #### that will be replaced by
//id (e.g. *posx*) of the cube side*
//
//*Note: In Plask the texture is ready immediately, in the web browser it's
//first black until the file is loaded and texture can be populated with the image data.*
TextureCube.load = function (files, options, callback) {
  var defaultOptions = {
    mipmap: false,
    nearest: false
  };
  options = merge(defaultOptions, options);

  var gl = Context.currentContext;
  var texture = new TextureCube();
  var cubeMapTargets = [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
  ];

  var minFilter = gl.LINEAR;
  var magFilter = gl.LINEAR;

  if (options.nearest) {
    magFilter = gl.NEAREST;
    minFilter = gl.NEAREST;
  }

  if (options.mipmap || files.length > 6) {
    minFilter = gl.LINEAR_MIPMAP_LINEAR;
  }

  gl.bindTexture(texture.target, texture.handle);
  gl.texParameteri(texture.target, gl.TEXTURE_MAG_FILTER, magFilter);
  gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(texture.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(texture.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  texture.ready = false;
  var loadedImages = 0;
  for (var i = 0; i < files.length; i++) {
    IO.loadImageData(gl, texture.handle, texture.target, cubeMapTargets[i%6], files[i], { flip: false, lod: Math.floor(i/6) }, function (image) {
      texture.width = image.width;
      texture.height = image.height;
      if (++loadedImages == files.length) {
        if (options.mipmap) {
          gl.bindTexture(texture.target, texture.handle);
          gl.generateMipmap(texture.target);
        }
        texture.ready = true;
        if (callback) callback(texture);
      }
    });
  }
  return texture;
};

//### dispose ( )
//Frees the texture data.
TextureCube.prototype.dispose = function () {
  if (this.handle) {
    this.gl.deleteTexture(this.handle);
    this.handle = null;
  }
};

module.exports = TextureCube;

},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js","./Texture":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Texture.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Utils.js":[function(require,module,exports){
var Context = require('./Context');

module.exports.getCurrentContext = function() {
  return Context.currentContext;
}

module.exports.clearColor = function(color) {
  var gl = Context.currentContext;
  if (color)
    gl.clearColor(color.r, color.g, color.b, color.a);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return this;
};

module.exports.clearDepth = function() {
  var gl = Context.currentContext;
  gl.clear(gl.DEPTH_BUFFER_BIT);
  return this;
};

module.exports.clearColorAndDepth = function(color) {
  var gl = Context.currentContext;
  color = color || { r: 0, g:0, b:0, a: 1};
  gl.clearColor(color.r, color.g, color.b, color.a);
  gl.depthMask(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  return this;
};

module.exports.enableDepthReadAndWrite = function(depthRead, depthWrite) {
  if (arguments.length == 2) {
    //do nothing, just use the values
  }
  else if (arguments.length == 1) {
    //use the same value for both read and write
    depthWrite = depthRead;
  }
  else {
    //defaults
    depthRead = true;
    depthWrite = true;
  }

  var gl = Context.currentContext;

  if (depthWrite) gl.depthMask(1);
  else gl.depthMask(0);

  if (depthRead) gl.enable(gl.DEPTH_TEST);
  else gl.disable(gl.DEPTH_TEST);

  return this;
};

module.exports.enableAdditiveBlending = function() {
  return this.enableBlending("ONE", "ONE");
};

module.exports.enableAlphaBlending = function(src, dst) {
  return this.enableBlending("SRC_ALPHA", "ONE_MINUS_SRC_ALPHA");
};

module.exports.enableBlending = function(src, dst) {
  var gl = Context.currentContext;
  if (src === false) {
    gl.disable(gl.BLEND);
    return this;
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl[src], gl[dst]);
  return this;
};

//OpenGL viewport 0,0 is in bottom left corner
//
//  0,h-----w,h
//   |       |
//   |       |
//  0,0-----w,0
//
module.exports.viewport = function(x, y, w, h) {
  var gl = Context.currentContext;
  gl.viewport(x, y, w, h);
  return this;
};

module.exports.scissor = function(x, y, w, h) {
  var gl = Context.currentContext;
  if (x === false) {
    gl.disable(gl.SCISSOR_TEST);
  }
  else if (x.width != null) {
    var rect = x;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(rect.x, rect.y, rect.width, rect.height);
  }
  else {
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
  }
  return this;
};

module.exports.cullFace = function(enabled) {
  enabled = (enabled !== undefined) ? enabled : true
  var gl = Context.currentContext;
  if (enabled)
    gl.enable(gl.CULL_FACE);
  else
    gl.disable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  return this;
};

module.exports.lineWidth = function(width) {
  var gl = Context.currentContext;
  gl.lineWidth(width);
  return this;
}
},{"./Context":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/lib/Context.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/index.js":[function(require,module,exports){
module.exports.GUI = require('./lib/GUI');
},{"./lib/GUI":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/GUI.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/GUI.js":[function(require,module,exports){
var glu = require('pex-glu');
var geom = require('pex-geom');
var sys = require('pex-sys');
var color = require('pex-color');
var Platform = sys.Platform;
var GUIControl = require('./GUIControl');
var SkiaRenderer = require('./SkiaRenderer');
var HTMLCanvasRenderer = require('./HTMLCanvasRenderer');
var Context = glu.Context;
var ScreenImage = glu.ScreenImage;
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Rect = geom.Rect;
var Spline1D = geom.Spline1D;
var Spline2D = geom.Spline2D;
var IO = sys.IO;
var Color = color.Color;

//`window` - parent window
//`x` - gui x position
//`y` - gui y position
//`scale` - slider scale, usefull for touch
//do not mistake that for highdpi as his is handled automatically based on window.settings.highdpi
function GUI(window, x, y, scale) {
  this.gl = Context.currentContext;
  this.window = window;
  this.x = x === undefined ? 0 : x;
  this.y = y === undefined ? 0 : y;
  this.mousePos = Vec2.create();
  this.scale = scale || 1;
  this.highdpi = window.settings.highdpi || 1;
  if (Platform.isPlask) {
    this.renderer = new SkiaRenderer(window.width, window.height, this.highdpi);
  }
  else if (Platform.isBrowser) {
    this.renderer = new HTMLCanvasRenderer(window.width, window.height, this.highdpi);
  }
  this.screenBounds = new Rect(this.x, this.y, window.width, window.height);
  this.screenImage = new ScreenImage(this.renderer.getTexture(), this.x, this.y, window.width, window.height, window.width, window.height);
  this.items = [];
  this.bindEventListeners(window);
}

GUI.prototype.bindEventListeners = function (window) {
  var self = this;
  window.on('leftMouseDown', function (e) {
    self.onMouseDown(e);
  });
  window.on('mouseDragged', function (e) {
    self.onMouseDrag(e);
  });
  window.on('leftMouseUp', function (e) {
    self.onMouseUp(e);
  });
};

GUI.prototype.onMouseDown = function (e) {
  this.activeControl = null;
  this.mousePos.set(e.x / this.highdpi - this.x, e.y / this.highdpi - this.y);
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i].activeArea.contains(this.mousePos)) {
      this.activeControl = this.items[i];
      this.activeControl.active = true;
      this.activeControl.dirty = true;
      if (this.activeControl.type == 'button') {
        this.activeControl.contextObject[this.activeControl.methodName]();
      }
      else if (this.activeControl.type == 'toggle') {
        this.activeControl.contextObject[this.activeControl.attributeName] = !this.activeControl.contextObject[this.activeControl.attributeName];
        if (this.activeControl.onchange) {
          this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
        }
      }
      else if (this.activeControl.type == 'radiolist') {
        var hitY = this.mousePos.y - this.activeControl.activeArea.y;
        var hitItemIndex = Math.floor(this.activeControl.items.length * hitY / this.activeControl.activeArea.height);
        if (hitItemIndex < 0)
          continue;
        if (hitItemIndex >= this.activeControl.items.length)
          continue;
        this.activeControl.contextObject[this.activeControl.attributeName] = this.activeControl.items[hitItemIndex].value;
        if (this.activeControl.onchange) {
          this.activeControl.onchange(this.activeControl.items[hitItemIndex].value);
        }
      }
      e.handled = true;
      this.onMouseDrag(e);
      break;
    }
  }
};

GUI.prototype.onMouseDrag = function (e) {
  if (this.activeControl) {
    var aa = this.activeControl.activeArea;
    if (this.activeControl.type == 'slider') {
      var val = (e.x / this.highdpi - aa.x) / aa.width;
      val = Math.max(0, Math.min(val, 1));
      this.activeControl.setNormalizedValue(val);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    else if (this.activeControl.type == 'multislider') {
      var val = (e.x / this.highdpi - aa.x) / aa.width;
      val = Math.max(0, Math.min(val, 1));
      var idx = Math.floor(this.activeControl.getValue().length * (e.y / this.highdpi - aa.y) / aa.height);
      if (!isNaN(this.activeControl.clickedSlider)) {
        idx = this.activeControl.clickedSlider;
      }
      else {
        this.activeControl.clickedSlider = idx;
      }
      this.activeControl.setNormalizedValue(val, idx);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    else if (this.activeControl.type == 'vec2') {
      var numSliders = 2;
      var val = (e.x / this.highdpi - aa.x) / aa.width;
      val = Math.max(0, Math.min(val, 1));
      var idx = Math.floor(numSliders * (e.y / this.highdpi - aa.y) / aa.height);
      if (!isNaN(this.activeControl.clickedSlider)) {
        idx = this.activeControl.clickedSlider;
      }
      else {
        this.activeControl.clickedSlider = idx;
      }
      this.activeControl.setNormalizedValue(val, idx);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    else if (this.activeControl.type == 'vec3') {
      var numSliders = 3;
      var val = (e.x / this.highdpi - aa.x) / aa.width;
      val = Math.max(0, Math.min(val, 1));
      var idx = Math.floor(numSliders * (e.y / this.highdpi - aa.y) / aa.height);
      if (!isNaN(this.activeControl.clickedSlider)) {
        idx = this.activeControl.clickedSlider;
      }
      else {
        this.activeControl.clickedSlider = idx;
      }
      this.activeControl.setNormalizedValue(val, idx);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    else if (this.activeControl.type == 'color') {
      var numSliders = this.activeControl.options.alpha ? 4 : 3;
      var val = (e.x / this.highdpi - aa.x) / aa.width;
      val = Math.max(0, Math.min(val, 1));
      var idx = Math.floor(numSliders * (e.y / this.highdpi - aa.y) / aa.height);
      if (!isNaN(this.activeControl.clickedSlider)) {
        idx = this.activeControl.clickedSlider;
      }
      else {
        this.activeControl.clickedSlider = idx;
      }
      this.activeControl.setNormalizedValue(val, idx);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    e.handled = true;
  }
};

GUI.prototype.onMouseUp = function (e) {
  if (this.activeControl) {
    this.activeControl.active = false;
    this.activeControl.dirty = true;
    this.activeControl.clickedSlider = undefined;
    this.activeControl = null;
  }
};

GUI.prototype.addHeader = function (title) {
  var ctrl = new GUIControl({
    type: 'header',
    title: title,
    dirty: true,
    activeArea: new Rect(0, 0, 0, 0),
    setTitle: function (title) {
      this.title = title;
      this.dirty = true;
    }
  });
  this.items.push(ctrl);
  return ctrl;
};

GUI.prototype.addLabel = function (title) {
  var ctrl = new GUIControl({
    type: 'label',
    title: title,
    dirty: true,
    activeArea: new Rect(0, 0, 0, 0),
    setTitle: function (title) {
      this.title = title;
      this.dirty = true;
    }
  });
  this.items.push(ctrl);
  return ctrl;
};

GUI.prototype.addParam = function (title, contextObject, attributeName, options, onchange) {
  options = options || {};
  if (typeof(options.min) == 'undefined') options.min = 0;
  if (typeof(options.max) == 'undefined') options.max = 1;
  if (contextObject[attributeName] instanceof Array) {
    var ctrl = new GUIControl({
      type: 'multislider',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
  else if (contextObject[attributeName] instanceof Vec2) {
    var ctrl = new GUIControl({
      type: 'vec2',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
  else if (contextObject[attributeName] instanceof Vec3) {
    var ctrl = new GUIControl({
      type: 'vec3',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
  else if (contextObject[attributeName] instanceof Color) {
    var ctrl = new GUIControl({
      type: 'color',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
  else if (contextObject[attributeName] instanceof Spline1D) {
    var ctrl = new GUIControl({
      type: 'spline1D',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
  else if (contextObject[attributeName] instanceof Spline2D) {
    var ctrl = new GUIControl({
      type: 'spline2D',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
  else if (contextObject[attributeName] === false || contextObject[attributeName] === true) {
    var ctrl = new GUIControl({
      type: 'toggle',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
  else {
    var ctrl = new GUIControl({
      type: 'slider',
      title: title,
      contextObject: contextObject,
      attributeName: attributeName,
      activeArea: new Rect(0, 0, 0, 0),
      options: options,
      onchange: onchange,
      dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
  }
};

GUI.prototype.addButton = function (title, contextObject, methodName, options) {
  var ctrl = new GUIControl({
    type: 'button',
    title: title,
    contextObject: contextObject,
    methodName: methodName,
    activeArea: new Rect(0, 0, 0, 0),
    dirty: true,
    options: options || {}
  });
  this.items.push(ctrl);
  return ctrl;
};

GUI.prototype.addRadioList = function (title, contextObject, attributeName, items, onchange) {
  var ctrl = new GUIControl({
    type: 'radiolist',
    title: title,
    contextObject: contextObject,
    attributeName: attributeName,
    activeArea: new Rect(0, 0, 0, 0),
    items: items,
    onchange: onchange,
    dirty: true
  });
  this.items.push(ctrl);
  return ctrl;
};

GUI.prototype.addTexture2D = function (title, texture) {
  var ctrl = new GUIControl({
    type: 'texture2D',
    title: title,
    texture: texture,
    activeArea: new Rect(0, 0, 0, 0),
    dirty: true
  });
  this.items.push(ctrl);
  return ctrl;
};

GUI.prototype.dispose = function () {
};

GUI.prototype.draw = function () {
  if (this.items.length === 0) {
    return;
  }
  this.renderer.draw(this.items, this.scale);

  glu.enableDepthReadAndWrite(false, false);

  var gl = Context.currentContext;
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  this.screenImage.draw();
  gl.disable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
  this.drawTextures();
};

GUI.prototype.drawTextures = function () {
  //for (var i = 0; i < this.items.length; i++) {
  //  var item = this.items[i];
  //  if (item.type == 'texture2D') {
  //    var bounds = new Rect(item.activeArea.x * this.scale, item.activeArea.y * this.scale, item.activeArea.width * this.scale, item.activeArea.height * this.scale);
  //    this.screenImage.setBounds(bounds);
  //    this.screenImage.setImage(item.texture);
  //    this.screenImage.draw();
  //  }
  //}
  //this.screenImage.setBounds(this.screenBounds);
  //this.screenImage.setImage(this.renderer.getTexture());
};

GUI.prototype.serialize = function () {
  var data = {};
  this.items.forEach(function (item, i) {
    data[item.title] = item.getSerializedValue();
  });
  return data;
};

GUI.prototype.deserialize = function (data) {
  this.items.forEach(function (item, i) {
    if (data[item.title] !== undefined) {
      item.setSerializedValue(data[item.title]);
      item.dirty = true;
    }
  });
};

GUI.prototype.save = function (path) {
  var data = this.serialize();
  IO.saveTextFile(path, JSON.stringify(data));
};

GUI.prototype.load = function (path, callback) {
  var self = this;
  IO.loadTextFile(path, function (dataStr) {
    var data = JSON.parse(dataStr);
    self.deserialize(data);
    if (callback) {
      callback();
    }
  });
};

module.exports = GUI;
},{"./GUIControl":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/GUIControl.js","./HTMLCanvasRenderer":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/HTMLCanvasRenderer.js","./SkiaRenderer":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/SkiaRenderer.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/GUIControl.js":[function(require,module,exports){
function GUIControl(o) {
  for (var i in o) {
    this[i] = o[i];
  }
}

GUIControl.prototype.setPosition = function(x, y) {
  this.px = x;
  this.py = y;
};

GUIControl.prototype.getNormalizedValue = function(idx) {
  if (!this.contextObject) {
    return 0;
  }

  var val = this.contextObject[this.attributeName];
  var options = this.options;
  if (options && options.min !== undefined && options.max !== undefined) {
    if (this.type == 'multislider') {
      val = (val[idx] - options.min) / (options.max - options.min);
    }
    else if (this.type == 'vec2') {
      if (idx == 0) val = val.x;
      if (idx == 1) val = val.y;
      val = (val - options.min) / (options.max - options.min);
    }
    else if (this.type == 'vec3') {
      if (idx == 0) val = val.x;
      if (idx == 1) val = val.y;
      if (idx == 2) val = val.z;
      val = (val - options.min) / (options.max - options.min);
    }
    else if (this.type == 'color') {
      var hsla = val.getHSL();
      if (idx == 0) val = hsla.h;
      if (idx == 1) val = hsla.s;
      if (idx == 2) val = hsla.l;
      if (idx == 3) val = hsla.a;
    }
    else {
      val = (val - options.min) / (options.max - options.min);
    }
  }
  return val;
};

GUIControl.prototype.setNormalizedValue = function(val, idx) {
  if (!this.contextObject) {
    return;
  }

  var options = this.options;
  if (options && options.min !== undefined && options.max !== undefined) {
    if (this.type == 'multislider') {
      var a = this.contextObject[this.attributeName];
      if (idx >= a.length) {
        return;
      }
      a[idx] = options.min + val * (options.max - options.min);
      val = a;
    }
    else if (this.type == 'vec2') {
      var c = this.contextObject[this.attributeName];
      var val = options.min + val * (options.max - options.min);
      if (idx == 0) c.x = val;
      if (idx == 1) c.y = val;
      val = c;
    }
    else if (this.type == 'vec3') {
      var val = options.min + val * (options.max - options.min);
      var c = this.contextObject[this.attributeName];
      if (idx == 0) c.x = val;
      if (idx == 1) c.y = val;
      if (idx == 2) c.z = val;
      val = c;
    }
    else if (this.type == 'color') {
      var c = this.contextObject[this.attributeName];
      var hsla = c.getHSL();
      if (idx == 0) hsla.h = val;
      if (idx == 1) hsla.s = val;
      if (idx == 2) hsla.l = val;
      if (idx == 3) hsla.a = val;
      c.setHSL(hsla.h, hsla.s, hsla.l, hsla.a);
      val = c;
    }
    else {
      val = options.min + val * (options.max - options.min);
    }
    if (options && options.step) {
      val = val - val % options.step;
    }
  }
  this.contextObject[this.attributeName] = val;
};

GUIControl.prototype.getSerializedValue = function() {
  if (this.contextObject) {
    return this.contextObject[this.attributeName];
  }
  else {
    return '';
  }

}

GUIControl.prototype.setSerializedValue = function(value) {
  if (this.type == 'slider') {
    this.contextObject[this.attributeName] = value;
  }
  else if (this.type == 'multislider') {
    this.contextObject[this.attributeName] = value;
  }
  else if (this.type == 'vec2') {
    this.contextObject[this.attributeName].x = value.x;
    this.contextObject[this.attributeName].y = value.y;
  }
  else if (this.type == 'vec3') {
    this.contextObject[this.attributeName].x = value.x;
    this.contextObject[this.attributeName].y = value.y;
    this.contextObject[this.attributeName].z = value.z;
  }
  else if (this.type == 'color') {
    this.contextObject[this.attributeName].r = value.r;
    this.contextObject[this.attributeName].g = value.g;
    this.contextObject[this.attributeName].b = value.b;
    this.contextObject[this.attributeName].a = value.a;
  }
  else if (this.type == 'toggle') {
    this.contextObject[this.attributeName] = value;
  }
  else if (this.type == 'radiolist') {
    this.contextObject[this.attributeName] = value;
  }
}


GUIControl.prototype.getValue = function() {
  if (this.type == 'slider') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'multislider') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'vec2') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'vec3') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'color') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'toggle') {
    return this.contextObject[this.attributeName];
  }
  else {
    return 0;
  }
};

GUIControl.prototype.getStrValue = function() {
  if (this.type == 'slider') {
    var str = '' + this.contextObject[this.attributeName];
    var dotPos = str.indexOf('.') + 1;
    if (dotPos === 0) {
      return str + '.0';
    }
    while (str.charAt(dotPos) == '0') {
      dotPos++;
    }
    return str.substr(0, dotPos + 2);
  }
  else if (this.type == 'vec2') {
    return 'XY';
  }
  else if (this.type == 'vec3') {
    return 'XYZ';
  }
  else if (this.type == 'color') {
    return 'HSLA';
  }
  else if (this.type == 'toggle') {
    return this.contextObject[this.attributeName];
  }
  else {
    return '';
  }
};

module.exports = GUIControl;
GUIControl;
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/HTMLCanvasRenderer.js":[function(require,module,exports){
var glu = require('pex-glu');
var plask = require('plask');
var Context = glu.Context;
var Texture2D = glu.Texture2D;

function HTMLCanvasRenderer(width, height, highdpi) {
  this.gl = Context.currentContext;
  this.highdpi = highdpi || 1;
  this.canvas = document.createElement('canvas');
  this.tex = Texture2D.create(width, height);
  this.canvas.width = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');
  this.dirty = true;
}

HTMLCanvasRenderer.prototype.isAnyItemDirty = function (items) {
  var dirty = false;
  items.forEach(function (item) {
    if (item.dirty) {
      item.dirty = false;
      dirty = true;
    }
  });
  return dirty;
};

HTMLCanvasRenderer.prototype.draw = function (items, scale) {
  if (!this.isAnyItemDirty(items)) {
    return;
  }

  var ctx = this.ctx;
  ctx.save();
  ctx.scale(this.highdpi, this.highdpi);
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.font = '10px Monaco';
  var dy = 10;
  var dx = 10;
  var w = 160;

  for (var i = 0; i < items.length; i++) {
    var e = items[i];

    if (e.px && e.px) {
      dx = e.px / this.highdpi;
      dy = e.py / this.highdpi;
    }

    var eh = 20 * scale;
    if (e.type == 'slider') eh = 20 * scale + 14;
    if (e.type == 'toggle') eh = 20 * scale;
    if (e.type == 'multislider') eh = 18 + e.getValue().length * 20 * scale;
    if (e.type == 'vec2') eh = 20 + 2 * 14 * scale;
    if (e.type == 'vec3') eh = 20 + 3 * 14 * scale;
    if (e.type == 'color') eh = 20 + (e.options.alpha ? 4 : 3) * 14 * scale;
    if (e.type == 'button') eh = 24 * scale;
    if (e.type == 'texture2D') eh = 24 + e.texture.height * w / e.texture.width;
    if (e.type == 'radiolist') eh = 18 + e.items.length * 20 * scale;
    if (e.type == 'spline1D' || e.type == 'spline2D') eh = 24 + w;
    if (e.type == 'header') eh = 26 * scale;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
    ctx.fillRect(dx, dy, w, eh - 2);

    if (e.type == 'slider') {
      ctx.fillStyle = 'rgba(150, 150, 150, 1)';
      ctx.fillRect(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
      ctx.fillStyle = 'rgba(255, 255, 0, 1)';
      ctx.fillRect(dx + 3, dy + 18, (w - 3 - 3) * e.getNormalizedValue(), eh - 5 - 18);
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
    }
    else if (e.type == 'vec2') {
      var numSliders = 2;
      for (var j = 0; j < numSliders; j++) {
        ctx.fillStyle = 'rgba(150, 150, 150, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, w - 6, 14 * scale - 3);
        ctx.fillStyle = 'rgba(255, 255, 0, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, (w - 6) * e.getNormalizedValue(j), 14 * scale - 3);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
     else if (e.type == 'vec3') {
      var numSliders = 3;
      for (var j = 0; j < numSliders; j++) {
        ctx.fillStyle = 'rgba(150, 150, 150, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, w - 6, 14 * scale - 3);
        ctx.fillStyle = 'rgba(255, 255, 0, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, (w - 6) * e.getNormalizedValue(j), 14 * scale - 3);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'color') {
      var numSliders = e.options.alpha ? 4 : 3;
      for (var j = 0; j < numSliders; j++) {
        ctx.fillStyle = 'rgba(150, 150, 150, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, w - 6, 14 * scale - 3);
        ctx.fillStyle = 'rgba(255, 255, 0, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, (w - 6) * e.getNormalizedValue(j), 14 * scale - 3);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'button') {
      ctx.fillStyle = e.active ? 'rgba(255, 255, 0, 1)' : 'rgba(150, 150, 150, 1)';
      ctx.fillRect(dx + 3, dy + 3, w - 3 - 3, eh - 5 - 3);
      e.activeArea.set(dx + 3, dy + 3, w - 3 - 3, eh - 5 - 3);
      ctx.fillStyle = e.active ? 'rgba(100, 100, 100, 1)' : 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 15);
      if (e.options.color) {
        var c = e.options.color;
        ctx.fillStyle = 'rgba(' + c.x * 255 + ', ' + c.y * 255 + ', ' + c.z * 255 + ', 1)';
        ctx.fillRect(dx + w - 8, dy + 3, 5, eh - 5 - 3);
      }
    }
    else if (e.type == 'toggle') {
      var on = e.contextObject[e.attributeName];
      ctx.fillStyle = on ? 'rgba(255, 255, 0, 1)' : 'rgba(150, 150, 150, 1)';
      ctx.fillRect(dx + 3, dy + 3, eh - 5 - 3, eh - 5 - 3);
      e.activeArea.set(dx + 3, dy + 3, eh - 5 - 3, eh - 5 - 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + eh, dy + 12);
    }
    else if (e.type == 'radiolist') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(e.title, dx + 4, dy + 13);
      var itemHeight = 20 * scale;
      for (var j = 0; j < e.items.length; j++) {
        var item = e.items[j];
        var on = e.contextObject[e.attributeName] == item.value;
        ctx.fillStyle = on ? 'rgba(255, 255, 0, 1)' : 'rgba(150, 150, 150, 1)';
        ctx.fillRect(dx + 3, 18 + j * itemHeight + dy + 3, itemHeight - 5 - 3, itemHeight - 5 - 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillText(item.name, dx + 5 + itemHeight - 5, 18 + j * itemHeight + dy + 13);
      }
      e.activeArea.set(dx + 3, 18 + dy + 3, itemHeight - 5, e.items.length * itemHeight - 5);
    }
    else if (e.type == 'texture2D') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 15);
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'header') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(dx + 3, dy + 3, w - 3 - 3, eh - 5 - 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 16);
    }
    else {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 13);
    }
    dy += eh;
  }
  ctx.restore();
  this.updateTexture();
};

HTMLCanvasRenderer.prototype.getTexture = function () {
  return this.tex;
};

HTMLCanvasRenderer.prototype.updateTexture = function () {
  var gl = this.gl;
  this.tex.bind();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

module.exports = HTMLCanvasRenderer;

},{"pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","plask":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/lib/_empty.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gui/lib/SkiaRenderer.js":[function(require,module,exports){
var glu = require('pex-glu');
var plask = require('plask');
var Context = glu.Context;
var Texture2D = glu.Texture2D;
var SkCanvas = plask.SkCanvas;
var SkPaint = plask.SkPaint;

function SkiaRenderer(width, height, highdpi) {
  this.tex = Texture2D.create(width, height);
  this.highdpi = highdpi || 1;
  this.gl = Context.currentContext;
  this.tex = Texture2D.create(width, height);
  this.canvas = new SkCanvas.create(width, height);
  this.fontPaint = new SkPaint();
  this.fontPaint.setStyle(SkPaint.kFillStyle);
  this.fontPaint.setColor(255, 255, 255, 255);
  this.fontPaint.setTextSize(10);
  this.fontPaint.setFontFamily('Monaco');
  this.fontPaint.setStrokeWidth(0);
  this.headerFontPaint = new SkPaint();
  this.headerFontPaint.setStyle(SkPaint.kFillStyle);
  this.headerFontPaint.setColor(0, 0, 0, 255);
  this.headerFontPaint.setTextSize(10);
  this.headerFontPaint.setFontFamily('Monaco');
  this.headerFontPaint.setStrokeWidth(0);
  this.fontHighlightPaint = new SkPaint();
  this.fontHighlightPaint.setStyle(SkPaint.kFillStyle);
  this.fontHighlightPaint.setColor(100, 100, 100, 255);
  this.fontHighlightPaint.setTextSize(10);
  this.fontHighlightPaint.setFontFamily('Monaco');
  this.fontHighlightPaint.setStrokeWidth(0);
  this.panelBgPaint = new SkPaint();
  this.panelBgPaint.setStyle(SkPaint.kFillStyle);
  this.panelBgPaint.setColor(0, 0, 0, 150);
  this.headerBgPaint = new SkPaint();
  this.headerBgPaint.setStyle(SkPaint.kFillStyle);
  this.headerBgPaint.setColor(255, 255, 255, 255);
  this.controlBgPaint = new SkPaint();
  this.controlBgPaint.setStyle(SkPaint.kFillStyle);
  this.controlBgPaint.setColor(150, 150, 150, 255);
  this.controlHighlightPaint = new SkPaint();
  this.controlHighlightPaint.setStyle(SkPaint.kFillStyle);
  this.controlHighlightPaint.setColor(255, 255, 0, 255);
  this.controlHighlightPaint.setAntiAlias(true);
  this.controlFeaturePaint = new SkPaint();
  this.controlFeaturePaint.setStyle(SkPaint.kFillStyle);
  this.controlFeaturePaint.setColor(255, 255, 255, 255);
  this.controlFeaturePaint.setAntiAlias(true);
}

SkiaRenderer.prototype.isAnyItemDirty = function(items) {
  var dirty = false;
  items.forEach(function(item) {
    if (item.dirty) {
      item.dirty = false;
      dirty = true;
    }
  });
  return dirty;
};

SkiaRenderer.prototype.draw = function(items, scale) {
  if (!this.isAnyItemDirty(items)) {
    return;
  }
  var canvas = this.canvas;
  canvas.save();
  canvas.scale(this.highdpi, this.highdpi);
  canvas.drawColor(0, 0, 0, 0, plask.SkPaint.kClearMode);
  //transparent
  var dy = 10;
  var dx = 10;
  var w = 160;
  for (var i = 0; i < items.length; i++) {
    var e = items[i];
    if (e.px && e.px) {
      dx = e.px / this.highdpi;
      dy = e.py / this.highdpi;
    }
    var eh = 20;

    if (e.type == 'slider') eh = 20 * scale + 14;
    if (e.type == 'toggle') eh = 20 * scale;
    if (e.type == 'multislider') eh = 18 + e.getValue().length * 20 * scale;
    if (e.type == 'vec2') eh = 20 + 2 * 14 * scale;
    if (e.type == 'vec3') eh = 20 + 3 * 14 * scale;
    if (e.type == 'color') eh = 20 + (e.options.alpha ? 4 : 3) * 14 * scale;
    if (e.type == 'button') eh = 24 * scale;
    if (e.type == 'texture2D') eh = 24 + e.texture.height * w / e.texture.width;
    if (e.type == 'radiolist') eh = 18 + e.items.length * 20 * scale;
    if (e.type == 'spline1D' || e.type == 'spline2D') eh = 24 + w;
    if (e.type == 'header') eh = 26 * scale;

    canvas.drawRect(this.panelBgPaint, dx, dy, dx + w, dy + eh - 2);

    if (e.type == 'slider') {
      var value = e.getValue();
      canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18, dx + w - 3, dy + eh - 5);
      canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18, dx + 3 + (w - 6) * e.getNormalizedValue(), dy + eh - 5);
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
    }
    else if (e.type == 'multislider') {
      for (var j = 0; j < e.getValue().length; j++) {
        canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18 + j * 20 * scale, dx + w - 3, dy + 18 + (j + 1) * 20 * scale - 6);
        canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18 + j * 20 * scale, dx + 3 + (w - 6) * e.getNormalizedValue(j), dy + 18 + (j + 1) * 20 * scale - 6);
      }
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
      e.activeArea.set(dx + 4, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'vec2') {
      var numSliders = 2;
      for (var j = 0; j < numSliders; j++) {
        canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18 + j * 14 * scale, dx + w - 3, dy + 18 + (j + 1) * 14 * scale - 3);
        canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18 + j * 14 * scale, dx + 3 + (w - 6) * e.getNormalizedValue(j), dy + 18 + (j + 1) * 14 * scale - 3);
      }
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 3, dy + 13);
      e.activeArea.set(dx + 4, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'vec3') {
      var numSliders = 3;
      for (var j = 0; j < numSliders; j++) {
        canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18 + j * 14 * scale, dx + w - 3, dy + 18 + (j + 1) * 14 * scale - 3);
        canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18 + j * 14 * scale, dx + 3 + (w - 6) * e.getNormalizedValue(j), dy + 18 + (j + 1) * 14 * scale - 3);
      }
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 3, dy + 13);
      e.activeArea.set(dx + 4, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'color') {
      var numSliders = e.options.alpha ? 4 : 3;
      for (var j = 0; j < numSliders; j++) {
        canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18 + j * 14 * scale, dx + w - 3, dy + 18 + (j + 1) * 14 * scale - 3);
        canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18 + j * 14 * scale, dx + 3 + (w - 6) * e.getNormalizedValue(j), dy + 18 + (j + 1) * 14 * scale - 3);
      }
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 3, dy + 13);
      e.activeArea.set(dx + 4, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'button') {
      var btnColor = e.active ? this.controlHighlightPaint : this.controlBgPaint;
      var btnFont = e.active ? this.fontHighlightPaint : this.fontPaint;
      canvas.drawRect(btnColor, dx + 3, dy + 3, dx + w - 3, dy + eh - 5);
      e.activeArea.set(dx + 3, dy + 3, w - 3 - 3, eh - 5);
      if (e.options.color) {
        var c = e.options.color;
        this.controlFeaturePaint.setColor(255 * c.x, 255 * c.y, 255 * c.z, 255);
        canvas.drawRect(this.controlFeaturePaint, dx + w - 8, dy + 3, dx + w - 3, dy + eh - 5);
      }
      canvas.drawText(btnFont, items[i].title, dx + 5, dy + 15);
    }
    else if (e.type == 'toggle') {
      var on = e.contextObject[e.attributeName];
      var toggleColor = on ? this.controlHighlightPaint : this.controlBgPaint;
      canvas.drawRect(toggleColor, dx + 3, dy + 3, dx + eh - 5, dy + eh - 5);
      e.activeArea.set(dx + 3, dy + 3, eh - 5, eh - 5);
      canvas.drawText(this.fontPaint, items[i].title, dx + eh, dy + 13);
    }
    else if (e.type == 'radiolist') {
      canvas.drawText(this.fontPaint, e.title, dx + 4, dy + 14);
      var itemColor = this.controlBgPaint;
      var itemHeight = 20 * scale;
      for (var j = 0; j < e.items.length; j++) {
        var item = e.items[j];
        var on = e.contextObject[e.attributeName] == item.value;
        var itemColor = on ? this.controlHighlightPaint : this.controlBgPaint;
        canvas.drawRect(itemColor, dx + 3, 18 + j * itemHeight + dy + 3, dx + itemHeight - 5, itemHeight + j * itemHeight + dy + 18 - 5);
        canvas.drawText(this.fontPaint, item.name, dx + itemHeight, 18 + j * itemHeight + dy + 13);
      }
      e.activeArea.set(dx + 3, 18 + dy + 3, itemHeight - 5, e.items.length * itemHeight - 5);
    }
    else if (e.type == 'texture2D') {
      canvas.drawText(this.fontPaint, e.title, dx + 3, dy + 13);
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'spline1D') {
      canvas.drawText(this.fontPaint, e.title, dx + 3, dy + 13);
      var itemHeight = w;
      var itemColor = this.controlBgPaint;
      canvas.drawRect(itemColor, dx + 3, 18 + dy + 3, dx + itemHeight - 5, itemHeight + dy + 18);
      var path = new plask.SkPath();
      path.moveTo(dx + 3, itemHeight + dy + 18)
      for(var j=0; j<=20; j++) {
        var p = e.contextObject[e.attributeName].getPointAt(j/20);
        var x = j/20 * (w - dx);
        var y = p * itemHeight * 0.99;
        path.lineTo(dx + 3 + x,  itemHeight + dy + 18 - y);
      }
      this.controlHighlightPaint.setStroke();
      canvas.drawPath(this.controlHighlightPaint, path);
      this.controlHighlightPaint.setFill();

      if (typeof(e.contextObject.animParam.highlight) != 'undefined') {
        this.controlFeaturePaint.setStroke();
        canvas.drawLine(this.controlFeaturePaint, dx + 3 + w * e.contextObject.animParam.highlight, 18 + dy + 3, dx + 3 + w * e.contextObject.animParam.highlight, itemHeight + dy + 18);
        this.controlFeaturePaint.setFill();
      }
      e.activeArea.set(dx + 3, dy + 18, w - 3 - 3, w - 5 - 18);
    }
    else if (e.type == 'spline2D') {
      canvas.drawText(this.fontPaint, e.title, dx + 3, dy + 13);
      var itemHeight = w;
      var itemColor = this.controlBgPaint;
      canvas.drawRect(itemColor, dx + 3, 18 + dy + 3, dx + itemHeight - 5, itemHeight + dy + 18);
      var path = new plask.SkPath();
      path.moveTo(dx + 3, itemHeight + dy + 18)
      for(var j=0; j<=40; j++) {
        var p = e.contextObject[e.attributeName].getPointAt(j/40);
        var x = p.x * (w - dx);
        var y = p.y * itemHeight * 0.99;
        path.lineTo(dx + 3 + x,  itemHeight + dy + 18 - y);
      }
      this.controlHighlightPaint.setStroke();
      canvas.drawPath(this.controlHighlightPaint, path);
      this.controlHighlightPaint.setFill();

      if (typeof(e.contextObject.animParam.highlight) != 'undefined') {
        this.controlFeaturePaint.setStroke();
        canvas.drawLine(this.controlFeaturePaint, dx + 3 + w * e.contextObject.animParam.highlight, 18 + dy + 3, dx + 3 + w * e.contextObject.animParam.highlight, itemHeight + dy + 18);
        this.controlFeaturePaint.setFill();
      }
    }
    else if (e.type == 'header') {
      canvas.drawRect(this.headerBgPaint, dx + 3, dy + 3, dx + w - 3, dy + eh - 5);
      canvas.drawText(this.headerFontPaint, items[i].title, dx + 6, dy + 16);
    }
    else {
      canvas.drawText(this.fontPaint, items[i].title, dx + 3, dy + 13);
    }
    dy += eh;
  }
  canvas.restore();
  this.updateTexture();
};

SkiaRenderer.prototype.getTexture = function() {
  return this.tex;
};

SkiaRenderer.prototype.updateTexture = function() {
  var gl = this.gl;
  this.tex.bind();
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texImage2DSkCanvas(gl.TEXTURE_2D, 0, this.canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

module.exports = SkiaRenderer;
},{"pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","plask":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/lib/_empty.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/index.js":[function(require,module,exports){
module.exports.SolidColor = require('./lib/SolidColor');
module.exports.ShowNormals = require('./lib/ShowNormals');
module.exports.ShowColors = require('./lib/ShowColors');
module.exports.ShowPosition = require('./lib/ShowPosition');
module.exports.ShowTexCoords = require('./lib/ShowTexCoords');
module.exports.Textured = require('./lib/Textured');
module.exports.TexturedTriPlanar = require('./lib/TexturedTriPlanar');
module.exports.TexturedCubeMap = require('./lib/TexturedCubeMap');
module.exports.TexturedEnvMap = require('./lib/TexturedEnvMap');
module.exports.SkyBox = require('./lib/SkyBox');
module.exports.SkyBoxEnvMap = require('./lib/SkyBoxEnvMap');
module.exports.FlatToonShading = require('./lib/FlatToonShading');
module.exports.MatCap = require('./lib/MatCap');
module.exports.Diffuse = require('./lib/Diffuse');
module.exports.BlinnPhong = require('./lib/BlinnPhong');
module.exports.ShowDepth = require('./lib/ShowDepth');
},{"./lib/BlinnPhong":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/BlinnPhong.js","./lib/Diffuse":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/Diffuse.js","./lib/FlatToonShading":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/FlatToonShading.js","./lib/MatCap":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/MatCap.js","./lib/ShowColors":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowColors.js","./lib/ShowDepth":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowDepth.js","./lib/ShowNormals":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowNormals.js","./lib/ShowPosition":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowPosition.js","./lib/ShowTexCoords":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowTexCoords.js","./lib/SkyBox":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/SkyBox.js","./lib/SkyBoxEnvMap":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/SkyBoxEnvMap.js","./lib/SolidColor":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/SolidColor.js","./lib/Textured":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/Textured.js","./lib/TexturedCubeMap":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/TexturedCubeMap.js","./lib/TexturedEnvMap":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/TexturedEnvMap.js","./lib/TexturedTriPlanar":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/TexturedTriPlanar.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/BlinnPhong.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var merge = require('merge');


var BlinnPhongGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 modelWorldMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 normalMatrix;\nuniform float pointSize;\nuniform vec3 lightPos;\nuniform vec3 cameraPos;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec3 vNormal;\nvarying vec3 vLightPos;\nvarying vec3 vEyePos;\n\nvoid main() {\n  vec4 worldPos = modelWorldMatrix * vec4(position, 1.0);\n  vec4 eyePos = modelViewMatrix * vec4(position, 1.0);\n  gl_Position = projectionMatrix * eyePos;\n  vEyePos = eyePos.xyz;\n  gl_PointSize = pointSize;\n  vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;\n  vLightPos = (viewMatrix * vec4(lightPos, 1.0)).xyz;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform vec4 ambientColor;\nuniform vec4 diffuseColor;\nuniform vec4 specularColor;\nuniform float shininess;\nuniform float wrap;\nuniform bool useBlinnPhong;\nvarying vec3 vNormal;\nvarying vec3 vLightPos;\nvarying vec3 vEyePos;\n\nfloat phong(vec3 L, vec3 E, vec3 N) {\n  vec3 R = reflect(-L, N);\n  return max(0.0, dot(R, E));\n}\n\nfloat blinnPhong(vec3 L, vec3 E, vec3 N) {\n  vec3 halfVec = normalize(L + E);\n  return max(0.0, dot(halfVec, N));\n}\n\nvoid main() {\n  vec3 L = normalize(vLightPos - vEyePos); //lightDir\n  vec3 E = normalize(-vEyePos); //viewDir\n  vec3 N = normalize(vNormal); //normal\n\n  float NdotL = max(0.0, (dot(N, L) + wrap) / (1.0 + wrap));\n  vec4 color = ambientColor + NdotL * diffuseColor;\n\n  float specular = 0.0;\n  if (useBlinnPhong)\n    specular = blinnPhong(L, E, N);\n  else\n    specular = phong(L, E, N);\n\n  color += max(pow(specular, shininess), 0.0) * specularColor;\n\n  gl_FragColor = color;\n}\n\n#endif\n";

function BlinnPhong(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(BlinnPhongGLSL);
  var defaults = {
    wrap: 0,
    pointSize: 1,
    lightPos: Vec3.create(10, 20, 30),
    ambientColor: Color.create(0, 0, 0, 1),
    diffuseColor: Color.create(0.9, 0.9, 0.9, 1),
    specularColor: Color.create(1, 1, 1, 1),
    shininess: 256,
    useBlinnPhong: true
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

BlinnPhong.prototype = Object.create(Material.prototype);

module.exports = BlinnPhong;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/Diffuse.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var merge = require('merge');


var DiffuseGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 normalMatrix;\nuniform mat4 viewMatrix;\nuniform float pointSize;\nuniform vec3 lightPos;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec3 vNormal;\nvarying vec3 vLightPos;\nvarying vec3 vPosition;\n\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  gl_PointSize = pointSize;\n  vNormal = (normalMatrix * vec4(normal, 1.0)).xyz;\n  vLightPos = (viewMatrix * vec4(lightPos, 1.0)).xyz;\n  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform vec4 ambientColor;\nuniform vec4 diffuseColor;\nuniform float wrap;\nvarying vec3 vNormal;\nvarying vec3 vLightPos;\nvarying vec3 vPosition;\n\nvoid main() {\n  vec3 L = normalize(vLightPos - vPosition);\n  vec3 N = normalize(vNormal);\n  float NdotL = max(0.0, (dot(N, L) + wrap) / (1.0 + wrap));\n  gl_FragColor = ambientColor + NdotL * diffuseColor;\n}\n\n#endif\n";

function Diffuse(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(DiffuseGLSL);
  var defaults = {
    wrap: 0,
    pointSize: 1,
    lightPos: Vec3.create(10, 20, 30),
    ambientColor: Color.create(0, 0, 0, 1),
    diffuseColor: Color.create(1, 1, 1, 1)
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

Diffuse.prototype = Object.create(Material.prototype);

module.exports = Diffuse;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/FlatToonShading.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var merge = require('merge');


var FlatToonShadingGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform float pointSize;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec3 vNormal;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  gl_PointSize = pointSize;\n  vNormal = normal;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform vec4 ambientColor;\nuniform vec4 diffuseColor;\nuniform vec3 lightPos;\nuniform sampler2D colorBands;\nuniform float wrap;\nvarying vec3 vNormal;\n\nvoid main() {\n  vec3 L = normalize(lightPos);\n  vec3 N = normalize(vNormal);\n  float NdotL = max(0.0, (dot(N, L) + wrap) / (1.0 + wrap));\n  gl_FragColor = ambientColor + NdotL * diffuseColor;\n  gl_FragColor.rgb = N*0.5 + vec3(0.5);\n  gl_FragColor.rgb = vec3(NdotL);\n\n  gl_FragColor = texture2D(colorBands, vec2(NdotL, 0.5));\n}\n\n#endif\n";

function FlatToonShading(uniforms) {
  this.gl = Context.currentContext.gl;
  var program = new Program(FlatToonShadingGLSL);

  var defaults = {
    wrap: 1,
    pointSize : 1,
    lightPos : Vec3.create(10, 20, 30)
  };

  var uniforms = merge(defaults, uniforms);

  Material.call(this, program, uniforms);
}

FlatToonShading.prototype = Object.create(Material.prototype);

module.exports = FlatToonShading;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/MatCap.js":[function(require,module,exports){
(function (__dirname){
//http://www.clicktorelease.com/blog/creating-spherical-environment-mapping-shader

var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var MatCapGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 normalMatrix;\nuniform float pointSize;\nattribute vec3 position;\nattribute vec3 normal;\n\nvarying vec3 e;\nvarying vec3 n;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n  e = normalize(vec3(modelViewMatrix * vec4(position, 1.0)));\n  n = normalize(vec3(normalMatrix * vec4(normal, 1.0)));\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform sampler2D texture;\n\nvarying vec3 e;\nvarying vec3 n;\n\nvoid main() {\n  vec3 r = reflect(e, n);\n  float m = 2.0 * sqrt(\n    pow(r.x, 2.0) +\n    pow(r.y, 2.0) +\n    pow(r.z + 1.0, 2.0)\n  );\n  vec2 N = r.xy / m + 0.5;\n  vec3 base = texture2D( texture, N ).rgb;\n  gl_FragColor = vec4( base, 1.0 );\n}\n\n#endif\n";

function MatCap(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(MatCapGLSL);
  var defaults = {};
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

MatCap.prototype = Object.create(Material.prototype);

module.exports = MatCap;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowColors.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var ShowColorsGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform float pointSize;\nattribute vec3 position;\nattribute vec4 color;\nvarying vec4 vColor;\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  gl_PointSize = pointSize;\n  vColor = color;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec4 vColor;\n\nvoid main() {\n  gl_FragColor = vColor;\n}\n\n#endif\n";

function ShowColors(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowColorsGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowColors.prototype = Object.create(Material.prototype);

module.exports = ShowColors;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowDepth.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var merge = require('merge');


var ShowDepthGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\n\nattribute vec3 position;\n\n//position in eye space coordinates (camera space, view space)\nvarying vec3 ecPosition;\n\nvoid main() {\n  vec4 ecPos = modelViewMatrix * vec4(position, 1.0);\n  gl_Position = projectionMatrix * ecPos;\n\n  ecPosition = ecPos.xyz;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec3 ecPosition;\nuniform float near;\nuniform float far;\n\n//Z in Normalized Device Coordinates\n//http://www.songho.ca/opengl/gl_projectionmatrix.html\nfloat eyeSpaceDepthToNDC(float zEye) {\n  float A = -(far + near) / (far - near); //projectionMatrix[2].z\n  float B = -2.0 * far * near / (far - near); //projectionMatrix[3].z; //\n\n  float zNDC = (A * zEye + B) / -zEye;\n  return zNDC;\n}\n\n//depth buffer encoding\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToDepthBuf(float zNDC) {\n  return 0.5 * zNDC + 0.5;\n}\n\nvoid main() {\n  float zEye = ecPosition.z;\n  float zNDC = eyeSpaceDepthToNDC(zEye);\n  float zBuf = ndcDepthToDepthBuf(zNDC);\n\n  gl_FragColor = vec4(zBuf);\n}\n\n#endif\n";

function ShowDepth(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowDepthGLSL);
  var defaults = {
    near: 0,
    far: 10
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowDepth.prototype = Object.create(Material.prototype);

module.exports = ShowDepth;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowNormals.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var ShowNormalsGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 normalMatrix;\nuniform float pointSize;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec4 vColor;\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  gl_PointSize = pointSize;\n  vec3 N = normalize((normalMatrix * vec4(normal, 1.0)).xyz);\n  vColor = vec4(N * 0.5 + 0.5, 1.0);\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec4 vColor;\n\nvoid main() {\n  gl_FragColor = vColor;\n}\n\n#endif\n";

function ShowNormals(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowNormalsGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowNormals.prototype = Object.create(Material.prototype);

module.exports = ShowNormals;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowPosition.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var merge = require('merge');


var ShowPositionGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nattribute vec3 position;\nvarying vec4 vColor;\nvoid main() {\n  vec4 pos = modelViewMatrix * vec4(position, 1.0);\n  gl_Position = projectionMatrix * pos;\n  vColor = pos;\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec4 vColor;\n\nvoid main() {\n  gl_FragColor = vColor;\n}\n\n#endif\n";

function ShowPosition(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowPositionGLSL);
  var defaults = {
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowPosition.prototype = Object.create(Material.prototype);

module.exports = ShowPosition;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/ShowTexCoords.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var merge = require('merge');


var ShowTexCoordsGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform float pointSize;\nattribute vec3 position;\nattribute vec2 texCoord;\nvarying vec4 vColor;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  gl_PointSize = pointSize;\n  vColor = vec4(texCoord, 0.0, 1.0);\n}\n\n#endif\n\n#ifdef FRAG\n\nvarying vec4 vColor;\n\nvoid main() {\n  gl_FragColor = vColor;\n}\n\n#endif";

function ShowTexCoords(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowTexCoordsGLSL);
  var defaults = {
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowTexCoords.prototype = Object.create(Material.prototype);

module.exports = ShowTexCoords;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/SkyBox.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var SkyBoxGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec3 vNormal;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  vNormal = position * vec3(1.0, 1.0, 1.0);\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform samplerCube texture;\nvarying vec3 vNormal;\n\nvoid main() {\n  vec3 N = normalize(vNormal);\n  gl_FragColor = textureCube(texture, N);\n}\n\n#endif\n";

function SkyBox(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(SkyBoxGLSL);
  var defaults = {};
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

SkyBox.prototype = Object.create(Material.prototype);

module.exports = SkyBox;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/SkyBoxEnvMap.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var SkyBoxEnvMapGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec3 vNormal;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  vNormal = position;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform sampler2D texture;\nvarying vec3 vNormal;\n\nvoid main() {\n  vec3 N = normalize(vNormal);\n  vec2 texCoord = vec2((1.0 + atan(-N.z, N.x)/3.14159265359)/2.0, acos(-N.y)/3.14159265359);\n\n  gl_FragColor = texture2D(texture, texCoord);\n}\n\n#endif\n";

function SkyBoxEnvMap(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(SkyBoxEnvMapGLSL);
  var defaults = {};
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

SkyBoxEnvMap.prototype = Object.create(Material.prototype);

module.exports = SkyBoxEnvMap;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/SolidColor.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var SolidColorGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform float pointSize;\nattribute vec3 position;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  gl_PointSize = pointSize;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform vec4 color;\nuniform bool premultiplied;\n\nvoid main() {\n  gl_FragColor = color;\n  if (premultiplied) {\n    gl_FragColor.rgb *= color.a;\n  }\n}\n\n#endif\n";

function SolidColor(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(SolidColorGLSL);
  var defaults = {
    color: Color.create(1, 1, 1, 1),
    pointSize: 1,
    premultiplied: 0
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

SolidColor.prototype = Object.create(Material.prototype);

module.exports = SolidColor;
}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/Textured.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec2 = geom.Vec2;
var merge = require('merge');


var TexturedGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nattribute vec3 position;\nattribute vec2 texCoord;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  vTexCoord = texCoord;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform sampler2D texture;\nuniform vec2 scale;\nuniform vec4 color;\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_FragColor = texture2D(texture, vTexCoord * scale) * color;\n}\n\n#endif\n";

function Textured(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(TexturedGLSL);
  var defaults = {
    scale: new Vec2(1, 1),
    color: new Color(1, 1, 1, 1)
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

Textured.prototype = Object.create(Material.prototype);

module.exports = Textured;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/TexturedCubeMap.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var sys = require('pex-sys');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');

var Platform = sys.Platform;

var TexturedCubeMapGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 normalMatrix;\n\nattribute vec3 position;\nattribute vec3 normal;\n\nvarying vec3 ecNormal;\nvarying vec3 ecPos;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  ecPos = (modelViewMatrix * vec4(position, 1.0)).xyz;\n  ecNormal = (normalMatrix * vec4(normal, 1.0)).xyz;\n}\n\n#endif\n\n#ifdef FRAG\n\n#ifdef WEBGL\n  #extension GL_EXT_shader_texture_lod : require\n#else\n  #extension GL_ARB_shader_texture_lod : require\n#endif\n\nuniform mat4 invViewMatrix;\n\nuniform samplerCube texture;\nuniform float lod;\nvarying vec3 ecNormal;\nvarying vec3 ecPos;\n\nvoid main() {\n  vec3 eyeDir = normalize(ecPos); //Direction to eye = camPos (0,0,0) - ecPos\n  vec3 ecN = normalize(ecNormal);\n  vec3 ecReflected = reflect(eyeDir, ecN); //eye coordinates reflection vector\n  vec3 wcReflected = vec3(invViewMatrix * vec4(ecReflected, 0.0)); //world coordinates reflection vector\n  gl_FragColor = textureCubeLod(texture, wcReflected, lod);\n}\n\n#endif\n";

function TexturedCubeMap(uniforms) {
  this.gl = Context.currentContext;

  if (Platform.isBrowser) {
    this.lodExt = this.gl.getExtension('EXT_shader_texture_lod');
    TexturedCubeMapGLSL = '#define WEBGL 1\n' + TexturedCubeMapGLSL;
    TexturedCubeMapGLSL = '#define textureCubeLod textureCubeLodEXT\n' + TexturedCubeMapGLSL;
  }
  var program = new Program(TexturedCubeMapGLSL);
  var defaults = {
    lod: -1
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

TexturedCubeMap.prototype = Object.create(Material.prototype);

module.exports = TexturedCubeMap;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/TexturedEnvMap.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var TexturedEnvMapGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 normalMatrix;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec3 vNormal;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  vNormal = (normalMatrix * vec4(normal, 1.0)).xyz;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform sampler2D texture;\nvarying vec3 vNormal;\n\nvoid main() {\n  vec3 N = normalize(vNormal);\n  vec2 texCoord = vec2((1.0 + atan(-N.z, N.x)/3.14159265359)/2.0, acos(-N.y)/3.14159265359);\n  gl_FragColor = texture2D(texture, texCoord);\n}\n\n#endif\n";

function TexturedEnvMap(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(TexturedEnvMapGLSL);
  var defaults = {};
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

TexturedEnvMap.prototype = Object.create(Material.prototype);

module.exports = TexturedEnvMap;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/lib/TexturedTriPlanar.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var merge = require('merge');


var TexturedTriPlanarGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 modelWorldMatrix;\nattribute vec3 position;\nattribute vec3 normal;\nvarying vec3 wcNormal;\nvarying vec3 wcCoords;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  wcNormal = normal; //this is not correct, shoud go from model -> world\n  wcCoords = (modelWorldMatrix * vec4(position, 1.0)).xyz;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform sampler2D texture;\nuniform float scale;\nvarying vec3 wcNormal;\nvarying vec3 wcCoords;\n\nvoid main() {\n  vec3 blending = abs( normalize(wcNormal) );\n  blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0\n  float b = (blending.x + blending.y + blending.z);\n  blending /= vec3(b, b, b);\n\n  vec4 xaxis = texture2D( texture, wcCoords.zy * scale);\n  vec4 yaxis = texture2D( texture, wcCoords.xz * scale);\n  vec4 zaxis = texture2D( texture, wcCoords.xy * scale);\n  // blend the results of the 3 planar projections.\n  vec4 tex = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;\n\n  gl_FragColor = tex;\n}\n\n#endif\n";

function TexturedTriPlanar(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(TexturedTriPlanarGLSL);
  var defaults = {
    scale: 1
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

TexturedTriPlanar.prototype = Object.create(Material.prototype);

module.exports = TexturedTriPlanar;

}).call(this,"/node_modules/pex-materials/lib")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js":[function(require,module,exports){
module.exports.Platform = require('./lib/Platform');
module.exports.Window = require('./lib/Window');
module.exports.Time = require('./lib/Time');
module.exports.IO = require('./lib/IO');
module.exports.Log = require('./lib/Log');
},{"./lib/IO":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/IO.js","./lib/Log":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Log.js","./lib/Platform":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Platform.js","./lib/Time":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Time.js","./lib/Window":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Window.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/BrowserWindow.js":[function(require,module,exports){
var Platform = require('./Platform');
var Log = require('./Log');
var merge = require('merge');

var requestAnimFrameFps = 60;

if (Platform.isBrowser) {
  window.requestAnimFrame = function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
      window.setTimeout(callback, 1000 / requestAnimFrameFps);
    };
  }();
}
var eventListeners = [];
function fireEvent(eventType, event) {
  for (var i = 0; i < eventListeners.length; i++) {
    if (eventListeners[i].eventType == eventType) {
      eventListeners[i].handler(event);
    }
  }
}

function registerEvents(canvas) {
  makeMouseDownHandler(canvas);
  makeMouseUpHandler(canvas);
  makeMouseDraggedHandler(canvas);
  makeMouseMovedHandler(canvas);
  makeScrollWheelHandler(canvas);
  makeTouchDownHandler(canvas);
  makeTouchUpHandler(canvas);
  makeTouchMoveHandler(canvas);
  makeKeyDownHandler(canvas);
}

function makeMouseDownHandler(canvas) {
  canvas.addEventListener('mousedown', function(e) {
    fireEvent('leftMouseDown', {
      x: (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * window.devicePixelRatio,
      y: (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * window.devicePixelRatio,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function makeMouseUpHandler(canvas) {
  canvas.addEventListener('mouseup', function(e) {
    fireEvent('leftMouseUp', {
      x: (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * window.devicePixelRatio,
      y: (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * window.devicePixelRatio,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function makeMouseDraggedHandler(canvas) {
  var down = false;
  var px = 0;
  var py = 0;
  canvas.addEventListener('mousedown', function(e) {
    down = true;
    px = (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * window.devicePixelRatio;
    py = (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * window.devicePixelRatio;
  });
  canvas.addEventListener('mouseup', function(e) {
    down = false;
  });
  canvas.addEventListener('mousemove', function(e) {
    if (down) {
      var x = (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * window.devicePixelRatio;
      var y = (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * window.devicePixelRatio;
      fireEvent('mouseDragged', {
        x: x,
        y: y,
        dx: x - px,
        dy: y - py,
        option: e.altKey,
        shift: e.shiftKey,
        control: e.ctrlKey
      });
      px = x;
      py = y;
    }
  });
}

function makeMouseMovedHandler(canvas) {
  canvas.addEventListener('mousemove', function(e) {
    fireEvent('mouseMoved', {
      x: (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * window.devicePixelRatio,
      y: (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * window.devicePixelRatio,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function makeScrollWheelHandler(canvas) {
  var mousewheelevt = /Firefox/i.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel';
  document.addEventListener(mousewheelevt, function(e) {
    fireEvent('scrollWheel', {
      x: (e.offsetX || e.layerX) * window.devicePixelRatio,
      y: (e.offsetY || e.layerY) * window.devicePixelRatio,
      dy: e.wheelDelta / 10 || -e.detail / 10,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}
var lastTouch = null;
function makeTouchDownHandler(canvas) {
  canvas.addEventListener('touchstart', function(e) {
    lastTouch = {
      clientX: e.touches[0].clientX * window.devicePixelRatio,
      clientY: e.touches[0].clientY * window.devicePixelRatio
    };
    var touches = e.touches.map(function(touch) {
      touch.x = touch.clientX * window.devicePixelRatio;
      touch.y = touch.clientY * window.devicePixelRatio;
      return touch;
    });
    fireEvent('leftMouseDown', {
      x: e.touches[0].clientX * window.devicePixelRatio,
      y: e.touches[0].clientY * window.devicePixelRatio,
      option: false,
      shift: false,
      control: false,
      touches: touches
    });
  });
}

function makeTouchUpHandler(canvas) {
  canvas.addEventListener('touchend', function(e) {
    var touches = e.touches.map(function(touch) {
      touch.x = touch.clientX * window.devicePixelRatio;
      touch.y = touch.clientY * window.devicePixelRatio;
      return touch;
    });
    fireEvent('leftMouseUp', {
      x: lastTouch ? lastTouch.clientX : 0,
      y: lastTouch ? lastTouch.clientY : 0,
      option: false,
      shift: false,
      control: false,
      touches: touches
    });
    lastTouch = null;
  });
}

function makeTouchMoveHandler(canvas) {
  canvas.addEventListener('touchmove', function(e) {
    lastTouch = {
      clientX: e.touches[0].clientX * window.devicePixelRatio,
      clientY: e.touches[0].clientY * window.devicePixelRatio
    };
    var touches = e.touches.map(function(touch) {
      touch.x = touch.clientX * window.devicePixelRatio;
      touch.y = touch.clientY * window.devicePixelRatio;
      return touch;
    });
    fireEvent('mouseDragged', {
      x: e.touches[0].clientX * window.devicePixelRatio,
      y: e.touches[0].clientY * window.devicePixelRatio,
      option: false,
      shift: false,
      control: false,
      touches: touches
    });
  });
}

function makeKeyDownHandler(canvas) {
  var timeout = 0;
  window.addEventListener('keydown', function(e) {
    timeout = setTimeout(function() {
      fireEvent('keyDown', {
        str: '',
        keyCode: e.keyCode,
        option: e.altKey,
        shift: e.shiftKey,
        control: e.ctrlKey
      }, 1);
    });
  });
  window.addEventListener('keypress', function(e) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = 0;
    }
    fireEvent('keyDown', {
      str: String.fromCharCode(e.charCode),
      keyCode: e.keyCode,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function simpleWindow(obj) {
  var canvas = obj.settings.canvas;
  if (obj.settings.fullscreen) {
    obj.settings.width = window.innerWidth;
    obj.settings.height = window.innerHeight;
  }
  if (!canvas) {
    canvas = document.getElementById('canvas');
  }
  else if (obj.settings.width && obj.settings.height) {
    canvas.width = obj.settings.width;
    canvas.height = obj.settings.height;
  }
  else {
    obj.settings.width = canvas.width;
    obj.settings.height = canvas.height;
  }
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = obj.settings.width;
    canvas.height = obj.settings.height;
  }
  if (window.devicePixelRatio == 2) {
    canvas.width = obj.settings.width * 2;
    canvas.height = obj.settings.height * 2;
    canvas.style.width = obj.settings.width + 'px';
    canvas.style.height = obj.settings.height + 'px';
    canvas.msaaEnabled = true;
    canvas.msaaSamples = 2;
    obj.settings.width *= 2;
    obj.settings.height *= 2;
    obj.settings.highdpi = 2;
  }
  obj.width = obj.settings.width;
  obj.height = obj.settings.height;
  obj.canvas = canvas;
  canvas.style.backgroundColor = '#000000';
  function go() {
    if (obj.stencil === undefined)
      obj.stencil = false;
    if (obj.settings.fullscreen) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
    }
    var gl = null;
    var ctx = null;
    if (obj.settings.type == '3d') {
      try {
        gl = canvas.getContext('experimental-webgl', {
          antialias: true,
          stencil: obj.settings.stencil,
          premultipliedAlpha : obj.settings.premultipliedAlpha,
          preserveDrawingBuffer: obj.settings.preserveDrawingBuffer
        });
      }
      catch (err) {
        Log.error(err.message);
        return;
      }
      if (gl === null) {
        throw 'No WebGL context is available.';
      }
    }else if (obj.settings.type == '2d') {
      ctx = canvas.getContext('2d');
    }
    obj.framerate = function(fps) {
      requestAnimFrameFps = fps;
    };
    obj.on = function(eventType, handler) {
      eventListeners.push({
        eventType: eventType,
        handler: handler
      });
    };
    registerEvents(canvas);
    obj.dispose = function() {
      obj.__disposed = true;
    };
    obj.gl = gl;
    obj.ctx = ctx;
    obj.init();
    function drawloop() {
      if (!obj.__disposed) {
        obj.draw();
        requestAnimFrame(drawloop);
      }
    }
    requestAnimFrame(drawloop);
  }
  if (!canvas.parentNode) {
    if (document.body) {
      document.body.appendChild(canvas);
      go();
    }else {
      window.addEventListener('load', function() {
        document.body.appendChild(canvas);
        go();
      }, false);
    }
  }
  else {
    go();
  }
  return obj;
}

var BrowserWindow = { simpleWindow: simpleWindow };

module.exports = BrowserWindow;
},{"./Log":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Log.js","./Platform":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Platform.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/IO.js":[function(require,module,exports){
(function (process){
var Platform = require('./Platform');
var Log = require('./Log');
var plask = require('plask');
var path = require('path');

var merge = require('merge');

var PlaskIO = function() {
  function IO() {
  }

  IO.loadTextFile = function (file, callback) {
    var fullPath = path.resolve(IO.getWorkingDirectory(), file);
    if (!fs.existsSync(fullPath)) {
      if (callback) {
        return callback(null);
      }
    }
    var data = fs.readFileSync(fullPath, 'utf8');
    if (callback) {
      callback(data);
    }
  };

  IO.getWorkingDirectory = function () {
    return path.dirname(process.mainModule.filename);
  };

  //textureHandle - texture handl
  //textureTarget - gl.TEXTURE_2D, gl.TEXTURE_CUBE
  //dataTarget - gl.TEXTURE_2D, gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
  IO.loadImageData = function (gl, textureHandle, textureTarget, dataTarget, file, options, callback) {
    var defaultOptions = { flip: false, lod: 0 };
    options = merge(defaultOptions, options);
    var fullPath = path.resolve(IO.getWorkingDirectory(), file);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, textureHandle);
    var canvas = plask.SkCanvas.createFromImage(fullPath);
    if (options.flip) {
      gl.texImage2DSkCanvas(dataTarget, options.lod, canvas);
    }
    else {
      gl.texImage2DSkCanvasNoFlip(dataTarget, options.lod, canvas);
    }
    if (callback) {
      callback(canvas);
    }
  };

  IO.watchTextFile = function (file, callback) {
    fs.watch(file, {}, function (event, fileName) {
      if (event == 'change') {
        var data = fs.readFileSync(file, 'utf8');
        if (callback) {
          callback(data);
        }
      }
    });
  };

  IO.saveTextFile = function (file, data) {
    fs.writeFileSync(file, data);
  };
  return IO;
};

var WebIO = function () {
  function IO() {
  }

  IO.getWorkingDirectory = function () {
    return '.';
  };

  IO.loadTextFile = function (url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onreadystatechange = function (e) {
      if (request.readyState == 4) {
        if (request.status == 200) {
          if (callback) {
            callback(request.responseText);
          }
        } else {
          Log.error('WebIO.loadTextFile error : ' + request.statusText);
        }
      }
    };
    request.send(null);
  };

  IO.loadImageData = function (gl, textureHandle, textureTarget, dataTarget, url, options, callback) {
    var defaultOptions = { flip: false, lod: 0 };
    options = merge(defaultOptions, options);
    var image = new Image();
    if (options.crossOrigin) image.crossOrigin = options.crossOrigin;
    image.onload = function () {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(textureTarget, textureHandle);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flip);
      gl.texImage2D(dataTarget, options.lod, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      if (callback) {
        callback(image);
      }
    };
    image.src = url;
  };

  IO.watchTextFile = function () {
    console.log('Warning: WebIO.watch is not implemented!');
  };

  IO.saveTextFile = function (url, data, callback) {
    var request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.onreadystatechange = function (e) {
      if (request.readyState == 4) {
        if (request.status == 200) {
          if (callback) {
            callback(request.responseText, request);
          }
        } else {
          Log.error('WebIO.saveTextFile error : ' + request.statusText);
        }
      }
    };
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send('data=' + encodeURIComponent(data));
  };

  return IO;
};

if (Platform.isPlask) module.exports = PlaskIO();
else if (Platform.isBrowser) module.exports = WebIO();
}).call(this,require('_process'))
},{"./Log":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Log.js","./Platform":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Platform.js","_process":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/node_modules/process/browser.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","path":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/node_modules/path-browserify/index.js","plask":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/lib/_empty.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Log.js":[function(require,module,exports){
function Log() {
}

Log.message = function(msg) {
  if (console !== undefined) {
    var msgs = Array.prototype.slice.call(arguments);
    console.log(msgs.join(' '));
  }
};

Log.error = function(msg) {
  var msgs = Array.prototype.slice.call(arguments);
  if (console !== undefined) {
    console.log('ERROR: ' + msgs.join(' '));
  }
};

module.exports = Log;
},{}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Platform.js":[function(require,module,exports){
(function (process){
module.exports.isPlask = typeof window === 'undefined' && typeof process === 'object';
module.exports.isBrowser = typeof window === 'object' && typeof document === 'object';
module.exports.isEjecta = typeof ejecta === 'object' && typeof ejecta.include === 'function';

}).call(this,require('_process'))
},{"_process":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/node_modules/process/browser.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Time.js":[function(require,module,exports){
var Log = require('./Log');

var Time = {
    now: 0,
    prev: 0,
    delta: 0,
    seconds: 0,
    frameNumber: 0,
    fpsFrames: 0,
    fpsTime: 0,
    fps: 0,
    fpsFrequency: 3,
    paused: false,
    verbose: false
};

Time.update = function(delta) {
  if (Time.paused) {
    return;
  }

  if (Time.prev === 0) {
    Time.prev = Date.now();
  }

  Time.now = Date.now();
  Time.delta = (delta !== undefined) ? delta : (Time.now - Time.prev) / 1000;

  //More than 1s = probably switched back from another window so we have big jump now
  if (Time.delta > 1) {
    Time.delta = 0;
  }

  Time.prev = Time.now;
  Time.seconds += Time.delta;
  Time.fpsTime += Time.delta;
  Time.frameNumber++;
  Time.fpsFrames++;

  if (Time.fpsTime > Time.fpsFrequency) {
    Time.fps = Time.fpsFrames / Time.fpsTime;
    Time.fpsTime = 0;
    Time.fpsFrames = 0;
    if (this.verbose)
      Log.message('FPS: ' + Time.fps);
  }
  return Time.seconds;

};

var startOfMeasuredTime = 0;

Time.startMeasuringTime = function() {
  startOfMeasuredTime = Date.now();
};

Time.stopMeasuringTime = function(msg) {
  var now = Date.now();
  var seconds = (now - startOfMeasuredTime) / 1000;
  if (msg) {
    console.log(msg + seconds);
  }
  return seconds;
};

Time.pause = function() {
  Time.paused = true;
};

Time.togglePause = function() {
  Time.paused = !Time.paused;
};

module.exports = Time;
},{"./Log":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Log.js"}],"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Window.js":[function(require,module,exports){
var Platform = require('./Platform');
var BrowserWindow = require('./BrowserWindow');
var Time = require('./Time');
var Log = require('./Log');
var merge = require('merge');
var plask = require('plask');

var DefaultSettings = {
  'width': 1280,
  'height': 720,
  'type': '3d',
  'vsync': true,
  'multisample': true,
  'fullscreen': false,
  'center': true,
  'hdpi': 1,
  'stencil': false,
  'premultipliedAlpha': true,
  'preserveDrawingBuffer': false
};

var Window = {
  currentWindow: null,
  create: function(obj) {
    obj.settings = obj.settings || {};
    obj.settings = merge(DefaultSettings, obj.settings);

    obj.__init = obj.init;
    obj.init = function() {
      Window.currentWindow = this;
      obj.framerate(60);
      if (obj.__init) {
        obj.__init();
      }
    }

    obj.__draw = obj.draw;
    obj.draw = function() {
      Window.currentWindow = this;
      //FIXME: this will cause Time update n times, where n is number of Window instances opened
      Time.update();
      if (obj.__draw) {
        obj.__draw();
      }
    }

    if (Platform.isPlask) {
      plask.simpleWindow(obj);
    }
    else if (Platform.isBrowser || Platform.isEjecta) {
      BrowserWindow.simpleWindow(obj);
    }
  }
};

module.exports = Window;
},{"./BrowserWindow":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/BrowserWindow.js","./Log":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Log.js","./Platform":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Platform.js","./Time":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/lib/Time.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","plask":"/Users/Mary/Documents/var-rose/webgl/node_modules/browserify/lib/_empty.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/DirectionalLight.js":[function(require,module,exports){
var geom = require('pex-geom');
var color = require('pex-color');
var glu = require('pex-glu');
var gen = require('pex-gen');
var materials = require('pex-materials');

var Vec3 = geom.Vec3;
var Color = color.Color;
var Mesh = glu.Mesh;
var Plane = gen.Plane;
var Sphere = gen.Sphere;
var SolidColor = materials.SolidColor;

function DirectionalLight(intensity, reflectionMap, diffuseMap, color) {
  Mesh.call(this, new Sphere(0.000001), new SolidColor({ color: Color.White }));

  this.direction = new Vec3(0, -1, 0);
  this.color = color;
  this.intensity = intensity || 1;
  this.reflectionMap = reflectionMap;
  this.diffuseMap = diffuseMap;

  this.proxyMesh = new Mesh(new Plane(2), null); //no material for now, will be assigned by the renderer
}

DirectionalLight.prototype = Object.create(Mesh.prototype);

DirectionalLight.prototype.setIntensity = function(intensity) {
  this.intensity = intensity;
}

DirectionalLight.prototype.getIntensity = function() {
  return this.intensity;
}

module.exports = DirectionalLight;
},{"pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-gen":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","pex-materials":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/GlobalLight.js":[function(require,module,exports){
var geom = require('pex-geom');
var color = require('pex-color');
var glu = require('pex-glu');
var gen = require('pex-gen');
var materials = require('pex-materials');

var Vec3 = geom.Vec3;
var Color = color.Color;
var Mesh = glu.Mesh;
var Plane = gen.Plane;
var Sphere = gen.Sphere;
var SolidColor = materials.SolidColor;

function GlobalLight(intensity, reflectionMap, diffuseMap, color) {
  Mesh.call(this, new Sphere(0.000001), new SolidColor({ color: Color.White }));

  this.position = new Vec3(0, 0, 0);
  this.color = color;
  this.intensity = intensity || 1;
  this.reflectionMap = reflectionMap;
  this.diffuseMap = diffuseMap;

  this.proxyMesh = new Mesh(new Plane(2), null); //no material for now, will be assigned by the renderer
}

GlobalLight.prototype = Object.create(Mesh.prototype);

GlobalLight.prototype.setIntensity = function(intensity) {
  this.intensity = intensity;
}

GlobalLight.prototype.getIntensity = function() {
  return this.intensity;
}

module.exports = GlobalLight;
},{"pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-gen":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","pex-materials":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/PointLight.js":[function(require,module,exports){
var geom = require('pex-geom');
var color = require('pex-color');
var glu = require('pex-glu');
var gen = require('pex-gen');
var materials = require('pex-materials');

var Vec3 = geom.Vec3;
var Color = color.Color;
var Mesh = glu.Mesh;
var Sphere = gen.Sphere;
var SolidColor = materials.SolidColor;

function PointLight(position, color, radius, brightness) {
  Mesh.call(this, new Sphere(1), new SolidColor({ color: color }));

  this.position = position || new Vec3(0, 0, 0);
  this.color = color || Color.White;
  this.radius = radius || 5;
  this.brightness = brightness || 1;

  this.proxyMesh = new Mesh(new Sphere(1, 64, 64), null); //no material for now, will be assigned by the renderer
  this.proxyMesh.scale.set(this.radius, this.radius, this.radius);
  this.proxyMesh.position = this.position;

  var gizmoGeom = new Sphere(1, 8, 8);
  gizmoGeom.computeEdges();
  this.gizmoMesh = new Mesh(gizmoGeom, new SolidColor({ color: Color.Red }), { lines: true })
  this.gizmoMesh.scale.set(this.radius, this.radius, this.radius);

  //force proxy light properties to be always in sync
  var proxyDraw = this.proxyMesh.draw.bind(this.proxyMesh);
  var self = this;
  this.proxyMesh.draw = function(camera) {
    self.proxyMesh.scale.set(self.radius, self.radius, self.radius);
    self.proxyMesh.position = self.position;
    self.gizmoMesh.scale.set(self.radius, self.radius, self.radius);
    self.gizmoMesh.position = self.position;
    self.material.uniforms.color = self.color;
    proxyDraw(camera);
  }
}

PointLight.prototype = Object.create(Mesh.prototype);

PointLight.prototype.setRadius = function(radius) {
  this.radius = radius;
  this.proxyMesh.scale.set(this.radius, this.radius, this.radius);

  var s = Math.min(this.radius/5, 1);
  this.scale.set(s, s, s);
}

PointLight.prototype.getRadius = function() {
  return this.radius;
}

PointLight.prototype.setPosition = function(position) {
  this.position.setVec3(position);
  this.proxyMesh.position.setVec3(position);
}

PointLight.prototype.getPosition = function() {
  return this.position;
}

PointLight.prototype.setBrightness = function(brightness) {
  this.brightness = brightness;
}

PointLight.prototype.getBrightness = function() {
  return this.brightness;
}

PointLight.prototype.setColor = function(color) {
  this.color = color;
}

PointLight.prototype.getColor = function() {
  return this.color;
}

module.exports = PointLight;
},{"pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-gen":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-gen/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","pex-materials":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/Renderer.js":[function(require,module,exports){
var sys = require('pex-sys');
var fx = require('pex-fx');
var glu = require('pex-glu');
var geom = require('pex-geom');
var color = require('pex-color');
var materials = require('pex-materials');
var merge = require('merge');

var Vec3                = geom.Vec3;
var BoundingBox         = geom.BoundingBox;
var Platform            = sys.Platform;
var Context             = glu.Context;
var Texture2D           = glu.Texture2D;
var PerspectiveCamera   = glu.PerspectiveCamera;
var Color               = color.Color;

var DeferredPointLight  = require('./materials/DeferredPointLight');
var DeferredGlobalLight = require('./materials/DeferredGlobalLight');
var DeferredDirectionalLight = require('./materials/DeferredDirectionalLight');
var UberMaterial        = require('../materials/UberMaterial');
var SSAO                = require('../fx/SSAO');
var Fog                 = require('../fx/Fog');
var FogBox              = require('../fx/FogBox');
var Contrast            = require('../fx/Contrast');
var ShadowMap           = require('../fx/ShadowMap');
var Rect                = require('../geom/Rect');
var PointLight          = require('./PointLight');
var GlobalLight         = require('./GlobalLight');
var DirectionalLight    = require('./DirectionalLight');

function Renderer(width, height, options) {
  var gl = this.gl = Context.currentContext;

  this.initExtensions();

  this.width = width;
  this.height = height;

  var defaultOptions = {
    exposure: 1,
    contrast: 1
  };

  options = merge(defaultOptions, options);

  this.exposure = options.exposure;
  this.contrast = options.contrast;
  this.debug = false;
  this.ssao = 0;
  this.fogDensity = 3.2;
  this.fogStart = 0.05;
  this.fogEnd = 0.7;
  this.fogBoundingBox = BoundingBox.fromPositionSize(new Vec3(0, 0, 0), new Vec3(500, 500, 500));

  this.enableLights = true;
  this.enableShadows = true;
  this.enableFog = true;
  this.enableToneMapping = true;
  this.enableGamma = true;
  this.enableContrast = false;

  this.lightCamera = new PerspectiveCamera(45, 1/1, 1, 100);
  this.lightCamera.setPosition(new Vec3(0, 40, 40));
  this.lightCamera.setTarget(new Vec3(0, 0, 0));

  this.initMaterials();
}

Renderer.prototype.getScene = function() {
  return this.scene;
}

Renderer.prototype.initExtensions = function() {
  if (Platform.isBrowser) {
    console.log('OES_texture_float', this.gl.getExtension("OES_texture_float"));
    console.log('OES_texture_float_linear', this.gl.getExtension("OES_texture_float_linear"));
    console.log('OES_texture_half_float', this.gl.getExtension("OES_texture_half_float"));
    console.log('OES_texture_half_float_linear', this.gl.getExtension("OES_texture_half_float_linear"));
    console.log('WEBGL_depth_texture', this.gl.getExtension("WEBGL_depth_texture"));
    //console.log('EXT_shader_texture_lod', this.gl.getExtension("EXT_shader_texture_lod"));
    //console.log('OES_standard_derivatives', this.gl.getExtension("OES_standard_derivatives"));
  }
}

Renderer.prototype.initMaterials = function() {
  this.depthBuffer = Texture2D.create(this.width, this.height, { format: this.gl.DEPTH_COMPONENT, type: this.gl.UNSIGNED_SHORT });
  this.showNormals = new UberMaterial({ skinned: false, showNormals: true });
  this.skinnedShowNormals = new UberMaterial({ skinned: true, showNormals: true });
  this.showDepth = new UberMaterial({ skinned: false, showDepth: true });
  this.skinnedShowDepth = new UberMaterial({ skinned: true, showDepth: true });
  this.deferredPointLight = new DeferredPointLight();
  this.deferredGlobalLight = new DeferredGlobalLight();
  this.deferredDirectionalLight = new DeferredDirectionalLight();
}

Renderer.prototype.drawAlbedo = function(meshes, camera, lights) {
  glu.enableBlending(false);
  glu.clearColorAndDepth(Color.Black);
  glu.enableDepthReadAndWrite(true);
  meshes.forEach(function(m) {
    m.draw(camera);
  }.bind(this));
}

Renderer.prototype.drawNormals = function(meshes, camera, lights) {
  glu.clearColorAndDepth(Color.Black);
  glu.enableDepthReadAndWrite(true);
  meshes.forEach(function(m) {
    var oldMaterial = m.getMaterial();
    if (oldMaterial.uniforms.skinned) {
      for (var i in oldMaterial.uniforms) {
        this.skinnedShowNormals.uniforms[i] =  oldMaterial.uniforms[i];
      }
      m.setMaterial(this.skinnedShowNormals);
    }
    else {
      m.setMaterial(this.showNormals);
    }
    m.draw(camera);
    m.setMaterial(oldMaterial);
  }.bind(this));
}

Renderer.prototype.drawDepth = function(meshes, camera, lights) {
  glu.clearColorAndDepth(Color.Black);
  glu.enableDepthReadAndWrite(true);
  this.showDepth.uniforms.near = camera.getNear();
  this.showDepth.uniforms.far = camera.getFar();
  this.skinnedShowDepth.uniforms.near = camera.getNear();
  this.skinnedShowDepth.uniforms.far = camera.getFar();
  meshes.forEach(function(m) {
    var oldMaterial = m.getMaterial();
    if (oldMaterial.uniforms.skinned) {
      for (var i in oldMaterial.uniforms) {
        this.skinnedShowDepth.uniforms[i] =  oldMaterial.uniforms[i];
      }
      m.setMaterial(this.skinnedShowDepth);
    }
    else {
      m.setMaterial(this.showDepth);
    }
    m.draw(camera);
    m.setMaterial(oldMaterial);
  }.bind(this));
}

Renderer.prototype.drawPointLights = function(meshes, camera, lights, albedo, normals, depth, ssao) {
  var roughness = 0.7;

  this.deferredPointLight.uniforms.albedoMap = albedo.getSourceTexture();
  this.deferredPointLight.uniforms.normalMap = normals.getSourceTexture();
  this.deferredPointLight.uniforms.depthMap = depth.getSourceTexture();
  this.deferredPointLight.uniforms.occlusionMap = ssao.getSourceTexture(); //TEMP: disabled ssao
  this.deferredPointLight.uniforms.roughness = roughness;
  this.deferredPointLight.uniforms.fov = camera.getFov();
  this.deferredPointLight.uniforms.near = camera.getNear();
  this.deferredPointLight.uniforms.far = camera.getFar();
  this.deferredPointLight.uniforms.aspectRatio = camera.getAspectRatio();

  this.deferredGlobalLight.uniforms.albedoMap = albedo.getSourceTexture();
  this.deferredGlobalLight.uniforms.normalMap = normals.getSourceTexture();
  this.deferredGlobalLight.uniforms.depthMap = depth.getSourceTexture();
  this.deferredGlobalLight.uniforms.occlusionMap = albedo.getSourceTexture(); //TEMP: disabled ssao
  this.deferredGlobalLight.uniforms.roughness = roughness;
  this.deferredGlobalLight.uniforms.fov = camera.getFov();
  this.deferredGlobalLight.uniforms.near = camera.getNear();
  this.deferredGlobalLight.uniforms.far = camera.getFar();
  this.deferredGlobalLight.uniforms.aspectRatio = camera.getAspectRatio();

  this.deferredDirectionalLight.uniforms.albedoMap = albedo.getSourceTexture();
  this.deferredDirectionalLight.uniforms.normalMap = normals.getSourceTexture();
  this.deferredDirectionalLight.uniforms.depthMap = depth.getSourceTexture();
  this.deferredDirectionalLight.uniforms.occlusionMap = albedo.getSourceTexture(); //TEMP: disabled ssao
  this.deferredDirectionalLight.uniforms.roughness = roughness;
  this.deferredDirectionalLight.uniforms.fov = camera.getFov();
  this.deferredDirectionalLight.uniforms.near = camera.getNear();
  this.deferredDirectionalLight.uniforms.far = camera.getFar();
  this.deferredDirectionalLight.uniforms.aspectRatio = camera.getAspectRatio();

  var gl = this.gl;

  glu.clearColorAndDepth(Color.Black);

  gl.disable(gl.CULL_FACE);
  gl.colorMask(0, 0, 0, 0);
  glu.enableDepthReadAndWrite(true, true);
  gl.depthFunc(gl.LEQUAL);
  this.drawAlbedo(meshes, camera, lights); //just depth
  gl.colorMask(1, 1, 1, 1);

  glu.enableDepthReadAndWrite(true, false);
  glu.enableAdditiveBlending(true);

  lights.forEach(function(light) {
    var oldMaterial = light.getMaterial();
    if (light instanceof PointLight) {
      gl.cullFace(gl.FRONT);
      gl.enable(gl.CULL_FACE);
      gl.depthFunc(gl.GREATER);
      this.deferredPointLight.uniforms.lightBrightness = light.brightness;
      this.deferredPointLight.uniforms.lightColor = light.color;
      this.deferredPointLight.uniforms.lightRadius = light.radius;
      this.deferredPointLight.uniforms.lightPos = light.position;
      light.proxyMesh.setMaterial(this.deferredPointLight);
    }
    if (light instanceof GlobalLight) {
      gl.cullFace(gl.BACK);
      gl.enable(gl.CULL_FACE);
      gl.depthFunc(gl.ALWAYS);
      this.deferredGlobalLight.uniforms.intensity = light.intensity;
      this.deferredGlobalLight.uniforms.reflectionMap = light.reflectionMap;
      this.deferredGlobalLight.uniforms.diffuseMap = light.diffuseMap;
      this.deferredGlobalLight.uniforms.lightColor = light.color;
      light.proxyMesh.setMaterial(this.deferredGlobalLight);
    }
    if (light instanceof DirectionalLight) {
      gl.cullFace(gl.BACK);
      gl.enable(gl.CULL_FACE);
      gl.depthFunc(gl.ALWAYS);
      this.deferredDirectionalLight.uniforms.intensity = light.intensity;
      this.deferredDirectionalLight.uniforms.reflectionMap = light.reflectionMap;
      this.deferredDirectionalLight.uniforms.diffuseMap = light.diffuseMap;
      this.deferredDirectionalLight.uniforms.lightColor = light.color;
      light.proxyMesh.setMaterial(this.deferredGlobalLight);
    }
    light.proxyMesh.draw(camera);
    light.proxyMesh.setMaterial(oldMaterial);
  }.bind(this));

  glu.enableBlending(false);
  glu.enableDepthReadAndWrite(true, true);
  gl.disable(gl.CULL_FACE);
  gl.depthFunc(gl.LEQUAL);
  gl.cullFace(gl.BACK);
}

Renderer.prototype.drawDebug = function(meshes, camera, lights) {
  glu.clearColorAndDepth(Color.Black);
  this.gl.lineWidth(2);
  if (this.debug) {
    lights.forEach(function(light) {
      light.draw(camera);
      if (light.gizmoMesh) light.gizmoMesh.draw(camera);
    });
  }
  this.gl.lineWidth(1);
}

Renderer.prototype.draw = function(scene, windowWidth, windowHeight) {
  var gl = Context.currentContext;
  //init

  var meshes = scene.getMeshes();
  var lights = scene.getLights();
  var cameras = scene.getCameras();

  var camera = cameras[0];
  if (!camera) {
    console.log('pbr.Renderer.draw no camera found!');
    return;
  }

  var measure = false;

  //camera.setPosition(this.lightCamera.getPosition());
  //camera.setTarget(this.lightCamera.getTarget());
  //camera.setUp(new Vec3(0, 1, 0))

  //pepare

  glu.viewport(0, 0, this.width, this.height);

  // render

  var W = this.width;
  var H = this.height;

  if (measure) gl.finish();

  var finalColor;;

  if (measure) console.time('render');

  var root = fx();
  var albedo = root.render({ drawFunc: function() { this.drawAlbedo(meshes, camera, lights); }.bind(this), depth: true, width: W, height: H, bpp: 32 });
  var normals = root.render({ drawFunc: function() { this.drawNormals(meshes, camera, lights); }.bind(this), depth: true, width: W, height: H, bpp: 32 });
  var depth = root.render({ drawFunc: function() { this.drawDepth(meshes, camera); }.bind(this), depth: true, width: W, height: H, bpp: 32 });
  var lightDepthMap = root.render({ drawFunc: function() { this.drawDepth(meshes, this.lightCamera); }.bind(this), depth: true, width: H, height: H, bpp: 32 });
  var ssao = albedo;
  finalColor = albedo;

  //var ssaoScale = this.ssao > 0 ? 2 : 16;
  //ssao = root.ssao({ strength: this.ssao, depthMap: depth, camera: camera, width: W/ssaoScale, height: H/ssaoScale }).blur3();

  //lights
  if (this.enableLights) finalColor = root.render({ drawFunc: function() { this.drawPointLights(meshes, camera, lights, albedo, normals, depth, ssao); }.bind(this), depth: true, width: W, height: H, bpp: 32 });

  //shadows
  if (this.enableShadows) finalColor = finalColor.shadowMap({
    depthMap: depth, camera: camera, width: W, height: H, bpp: 32,
    lightDepthMap: lightDepthMap, lightCamera: this.lightCamera,
    normalMap: normals
  });

  //fog
  if (this.enableFog) finalColor = finalColor.fogBox({ depthMap: depth, camera: camera, width: W, height: H, bpp: 32,
    color: scene.backgroundColor || Color.Black,
    fogDensity: this.fogDensity,
    fogStart: this.fogStart,
    fogEnd: this.fogEnd,
    fogBoundingBox: this.fogBoundingBox
  })

  if (this.enableToneMapping) finalColor = finalColor.tonemapReinhard({ width: W, height: H, bpp: 32, exposure: this.exposure });
  if (this.enableGamma) finalColor = finalColor.correctGamma({ width: W, height: H, bpp: 32 });
  if (this.enableContrast) finalColor = finalColor.contrast({ width: W, height: H, bpp: 32, contrast: this.contrast });

  if (measure) gl.finish();
  if (measure) console.timeEnd('render');

  glu.viewport(0, 0, windowWidth, windowHeight);

  var rtViewport = new Rect(0, 0, this.width, this.height);
  var windowViewport = new Rect(0, 0, windowWidth, windowHeight);
  var drawViewport = rtViewport.scaleToFit(windowViewport);

  // debug

  var debugMeshes = root.render({ drawFunc: function() { this.drawDebug(meshes, camera, lights); }.bind(this), depth: true, width: W, height: H });
  finalColor = finalColor.add(debugMeshes);

  // blit

  glu.clearColorAndDepth(Color.Black);
  finalColor.blit({ x: drawViewport.x, y: drawViewport.y, width: drawViewport.width, height: drawViewport.height });

}

module.exports = Renderer;
},{"../fx/Contrast":"/Users/Mary/Documents/var-rose/webgl/fx/Contrast.js","../fx/Fog":"/Users/Mary/Documents/var-rose/webgl/fx/Fog.js","../fx/FogBox":"/Users/Mary/Documents/var-rose/webgl/fx/FogBox.js","../fx/SSAO":"/Users/Mary/Documents/var-rose/webgl/fx/SSAO.js","../fx/ShadowMap":"/Users/Mary/Documents/var-rose/webgl/fx/ShadowMap.js","../geom/Rect":"/Users/Mary/Documents/var-rose/webgl/geom/Rect.js","../materials/UberMaterial":"/Users/Mary/Documents/var-rose/webgl/materials/UberMaterial.js","./DirectionalLight":"/Users/Mary/Documents/var-rose/webgl/pbr/DirectionalLight.js","./GlobalLight":"/Users/Mary/Documents/var-rose/webgl/pbr/GlobalLight.js","./PointLight":"/Users/Mary/Documents/var-rose/webgl/pbr/PointLight.js","./materials/DeferredDirectionalLight":"/Users/Mary/Documents/var-rose/webgl/pbr/materials/DeferredDirectionalLight.js","./materials/DeferredGlobalLight":"/Users/Mary/Documents/var-rose/webgl/pbr/materials/DeferredGlobalLight.js","./materials/DeferredPointLight":"/Users/Mary/Documents/var-rose/webgl/pbr/materials/DeferredPointLight.js","merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-fx":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-fx/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js","pex-materials":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-materials/index.js","pex-sys":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-sys/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/Scene.js":[function(require,module,exports){
var glu = require('pex-glu');
var PerspectiveCamera = glu.PerspectiveCamera;
var PointLight = require('./PointLight');
var GlobalLight = require('./GlobalLight');
var Mesh = glu.Mesh;

function Scene() {
  this.items = [];
}

Scene.prototype.add = function(o) {
  this.items.push(o);
}

Scene.prototype.remove = function(o) {
  var i = this.items.indexOf(o);
  if (i > -1) {
    this.items.splice(i, 1);
  }
}

Scene.prototype.clear = function() {
  //TODO: Dispose?
  this.items.length = 0;
}

Scene.prototype.getCameras = function() {
  return this.items.filter(function(p) {
    return p instanceof PerspectiveCamera;
  });
}

Scene.prototype.getMeshes = function() {
  return this.items.filter(function(p) {
    return p instanceof Mesh && !(p instanceof PointLight) && !(p instanceof GlobalLight);
  });
}

Scene.prototype.getLights = function() {
  return this.items.filter(function(p) {
    return p instanceof PointLight || p instanceof GlobalLight;
  });
}

module.exports = Scene;
},{"./GlobalLight":"/Users/Mary/Documents/var-rose/webgl/pbr/GlobalLight.js","./PointLight":"/Users/Mary/Documents/var-rose/webgl/pbr/PointLight.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/index.js":[function(require,module,exports){
module.exports.Renderer = require('./Renderer');
module.exports.Scene = require('./Scene');
module.exports.PointLight = require('./PointLight');
module.exports.GlobalLight = require('./GlobalLight');
module.exports.materials = {
  MatCapAlpha: require('./materials/MatCapAlpha')
}
},{"./GlobalLight":"/Users/Mary/Documents/var-rose/webgl/pbr/GlobalLight.js","./PointLight":"/Users/Mary/Documents/var-rose/webgl/pbr/PointLight.js","./Renderer":"/Users/Mary/Documents/var-rose/webgl/pbr/Renderer.js","./Scene":"/Users/Mary/Documents/var-rose/webgl/pbr/Scene.js","./materials/MatCapAlpha":"/Users/Mary/Documents/var-rose/webgl/pbr/materials/MatCapAlpha.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/materials/DeferredDirectionalLight.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');

var Vec3 = geom.Vec3;

var DeferredGlobalLightGLSL = "#ifdef VERT\n\nattribute vec3 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 1.0);\n  vTexCoord = gl_Position.xy/gl_Position.w * 0.5 + 0.5;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform mat4 invViewMatrix;\nuniform sampler2D albedoMap;\nuniform sampler2D normalMap;\nuniform sampler2D depthMap;\nuniform sampler2D reflectionMap;\nuniform sampler2D diffuseMap;\n//\n//uniform float lightBrightness;\n//uniform float lightRadius;\n//uniform vec4 lightColor;\n//\nuniform float intensity;\n//\nuniform float fov;\nuniform float near;\nuniform float far;\nuniform float aspectRatio;\n\nvarying vec2 vTexCoord;\n\nconst float PI = 3.14159265358979323846;\n\nvec4 environmentMap(sampler2D envMap, in vec3 normalIn, in vec3 positionIn, in float mipmapIndex) {\n  vec3 eyeDir = normalize(-positionIn); //Direction to eye = camPos (0,0,0) - ecPos\n  vec3 ecN = normalize(normalIn);\n  vec3 ecReflected = reflect(-eyeDir, ecN); //eye coordinates reflection vector\n  vec3 wcReflected = vec3(invViewMatrix * vec4(ecReflected, 0.0)); //world coordinates reflection vector\n\n  vec2 texCoord = vec2((1.0 + atan(-wcReflected.z, wcReflected.x)/3.14159265359)/2.0, acos(-wcReflected.y)/3.14159265359);\n  return texture2D(envMap, texCoord, mipmapIndex);\n}\n\n/*\n\n//From Disney princlpled BRDF\nfloat SchlickFresnel(float u) {\n  float m = clamp(1.0-u, 0.0, 1.0);\n  float m2 = m*m;\n  return m2*m2*m; // pow(m,5)\n}\n\nvec3 Fresnel(vec3 specAlbedo, vec3 H, vec3 L) {\n  float LdotH = clamp(dot(L, H), 0.0, 1.0);\n  return specAlbedo + (1.0 - specAlbedo) * pow((1.0 - LdotH), 5.0);\n}\n\n*/\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToEyeSpace(float ndcDepth) {\n  return 2.0 * near * far / (far + near - ndcDepth * (far - near));\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(sampler2D depthMap, vec2 coord) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  return ndcDepthToEyeSpace(z_n);\n}\n\nvec3 getFarViewDir(vec2 tc) {\n  float hfar = 2.0 * tan(fov/2.0/180.0 * PI) * far;\n  float wfar = hfar * aspectRatio;\n  vec3 dir = (vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far));\n  return dir;\n}\n\nvec3 getViewRay(vec2 tc) {\n  vec3 ray = normalize(getFarViewDir(tc));\n  return ray;\n}\n\n//asumming z comes from depth buffer (ndc coords) and it's not a linear distance from the camera but\n//perpendicular to the near/far clipping planes\n//http://mynameismjp.wordpress.com/2010/09/05/position-from-depth-3/\n//assumes z = eye space z\nvec3 reconstructPositionFromDepth(vec2 texCoord, float z) {\n  vec3 ray = getFarViewDir(texCoord);\n  vec3 pos = ray;\n  return pos * z / far;\n}\n\n//Problems more sharp metal doesn't get darker\n\nvoid main() {\n  vec3 normal = texture2D(normalMap, vTexCoord).rgb; //assumes rgb = ecNormal.xyz + 0.5\n  vec4 albedoValue = texture2D(albedoMap, vTexCoord);\n  vec3 albedoColor = albedoValue.rgb;\n\n  float roughness = albedoValue.a;\n\n  float depth = readDepth(depthMap, vTexCoord);\n  vec3 position = reconstructPositionFromDepth(vTexCoord, depth);\n\n  vec3 ecN = normalize(normal - 0.5);\n\n\n  //indirect diffuse from IBL\n  vec3 envAmbient = environmentMap(diffuseMap, ecN, position, 0.0).rgb;\n  envAmbient = pow(envAmbient, vec3(1.0/2.2)); //correct gamma TEMP: overexposed texture corrected\n  vec3 envSpecular = environmentMap(reflectionMap, ecN, position, 0.0).rgb;\n  envSpecular = pow(envSpecular, vec3(1.0/2.2)); //correct gamma TEMP: overexposed texture corrected\n\n\n  gl_FragColor.rgb = intensity * albedoColor * mix(envSpecular, envAmbient, roughness);\n\n  /*\n  vec3 specularColor = albedoColor; //for now\n  //float occlusion = texture2D(occlusionMap, vTexCoord).r;\n  float occlusion = 1.0;\n\n  \n\n  \n  vec3 L = normalize(ecLighPos - position.xyz);\n  vec3 V = normalize(-position.xyz);\n  vec3 H = normalize(L + V);\n\n  float NdotL = clamp(dot(N, L), 0.0, 1.0);\n  float NdotV = clamp(dot(N, V), 0.0, 1.0);\n  float LdotH = clamp(dot(L, H), 0.0, 1.0);\n  float NdotH = clamp(dot(N, H), 0.0, 1.0);\n  float VdotH = clamp(dot(V, H), 0.0, 1.0);\n\n  //albedoColor = vec3(0.2, 0.2, 0.2); //TEMP\n  //albedo = vec3(0.0); //TEMP\n  float lightDistance = length(ecLighPos - position.xyz);\n  float maxMipMapLevel = 6.0; //most blurry\n  vec3 F0 = specularColor;\n  float metallic = 0.0;\n  //float roughness = 0.9; //0 - reflective, 1 - matte\n  float smoothness = 1.0 - roughness;    //0 - matte, 1 - reflective\n  float specular = 1.0;\n\n  //indirect diffuse from IBL\n  vec3 envAmbient = environmentMap(diffuseMap, N, position, 0.0).rgb;\n  //envAmbient = pow(envAmbient, vec3(4.2)); //correct gamma TEMP: overexposed texture corrected\n  vec3 envSpecular = environmentMap(reflectionMap, N, position, 0.0).rgb;\n  //envSpecular = pow(envSpecular, vec3(4.2)); //correct gamma TEMP: overexposed texture corrected\n\n  //vec3 LIndirectDiffuse = intensity * albedoColor;\n  //Indirect diffuse\n  //vec3 LIndirectDiffuse = mix(albedoColor, envSpecular, metallic) * envAmbient * (1.0 - metallic); //TODO: what's metal color?\n  //vec3 LIndirectDiffuse = mix(albedoColor, envSpecular, metallic) * envAmbient + envAmbient * (1.0 - metallic); //TODO: what's metal color?\n  vec3 LIndirectDiffuse = mix(albedoColor, envSpecular, metallic) * envAmbient * (1.0 - metallic); //TODO: what's metal color?\n\n  //Diffuse Fresnel (Disney) aka glossy Fresnel\n  //Should be 2D lookup texture for IBL as in UnreadEngine4\n  float FL = SchlickFresnel(NdotL);\n  float FV = SchlickFresnel(NdotV);\n  float Fd90 = 0.5 + 2.0 * LdotH*LdotH * roughness;\n  float Fd = mix(1.0, Fd90, FL) * mix(1.0, Fd90, FV);\n\n  //Specular BRDF: Cook-Torrance microfacet model\n  //          D(h) * F(v,h) * G(l,v,h)\n  // f(l,v) = ------------------------\n  //              4 * n.l * n.v\n\n  //Alpha: Based on \"Real Shading in Unreal Engine 4\"\n  float a = pow(1.0 - smoothness * 0.7, 6.0);\n\n  //Normal Distribution Function: GGX\n  //                    a^2\n  //D(h) = --------------------------------\n  //       PI * ((n.h)^2 * (a^2 - 1) + 1)^2\n  float aSqr = a * a;\n  float Ddenom = NdotH * NdotH * (aSqr - 1.0) + 1.0;\n  float Dh = aSqr / ( PI * Ddenom * Ddenom);\n\n  //Fresnel Term: Fresnel schlick\n  //F(v,h) = F0 + (1 - F0)*(1 - (v.h))^5\n  //Linear interpolation between specular color F0 and white\n  vec3 Fvh = F0 + (1.0 - F0) * pow((1.0 - VdotH), 5.0);\n\n  //Indirect specular\n  //vec3 LIndirectSpecular = Fvh * specular * envSpecular * NdotL; //TODO: Fresnel * IBLspec(roughness)\n  vec3 LIndirectSpecular = albedoColor * envSpecular * pow((1.0 - roughness), 2.0) * 2.0;\n\n  //LIndirectDiffuse = albedoColor * envSpecular;\n  //LIndirectDiffuse = albedoColor * envAmbient;\n\n  //LIndirectDiffuse = vec3(mix(envSpecular, envAmbient, roughness));\n\n  //LIndirectDiffuse = (albedoColor + mix(envSpecular, envAmbient, 1.0 - pow(1.0 - roughness, 2.0))) * intensity;\n  //LIndirectDiffuse = albedoColor * mix(envSpecular, envAmbient, 1.0 - pow(1.0 - roughness, 2.0)) * intensity;\n\n  vec3 FinalColor = (LIndirectDiffuse + LIndirectSpecular ) * intensity * occlusion * lightColor.rgb;\n\n  //vec3 wcPos = vec3(invViewMatrix * vec4(position, 1.0));\n  //if (length(wcPos) > 200.0) {\n  //  vec3 wcN = normalize(wcPos);\n  //  vec2 texCoord = vec2((1.0 + atan(-wcN.z, wcN.x)/3.14159265359)/2.0, acos(-wcN.y)/3.14159265359);\n  //  FinalColor = texture2D(reflectionMap, texCoord).xyz * intensity;\n  //  //FinalColor = normal;\n  //}\n\n  //FinalColor *= vec3(0.34509803921568627, 0.11764705882352941, 0.615686274509804);\n  //FinalColor = envSpecular;\n  //FinalColor = envAmbient;\n  //FinalColor = albedoColor;\n\n  //gl_FragColor = vec4(occlusion);\n\n  gl_FragColor.rgb = FinalColor;\n  */\n}\n\n#endif";

function DeferredGlobalLight(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(DeferredGlobalLightGLSL);
  var defaults = {
    albedoMap: null,
    normalMap: null,
    depthMap: null,
    occlusionMap: null,
    roughness: null,
    camera: null,
    lightPos: new Vec3(0, 0, 0),
    lightBrightness: 1,
    lightColor: Color.White,
    lightRadius: 1
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

DeferredGlobalLight.prototype = Object.create(Material.prototype);

module.exports = DeferredGlobalLight;

}).call(this,"/pbr/materials")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/materials/DeferredGlobalLight.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');

var Vec3 = geom.Vec3;

var DeferredGlobalLightGLSL = "#ifdef VERT\n\nattribute vec3 position;\nattribute vec2 texCoord;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(position, 1.0);\n  vTexCoord = gl_Position.xy/gl_Position.w * 0.5 + 0.5;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform mat4 invViewMatrix;\nuniform sampler2D albedoMap;\nuniform sampler2D normalMap;\nuniform sampler2D depthMap;\nuniform sampler2D reflectionMap;\nuniform sampler2D diffuseMap;\n//\n//uniform float lightBrightness;\n//uniform float lightRadius;\n//uniform vec4 lightColor;\n//\nuniform float intensity;\n//\nuniform float fov;\nuniform float near;\nuniform float far;\nuniform float aspectRatio;\n\nvarying vec2 vTexCoord;\n\nconst float PI = 3.14159265358979323846;\n\nvec4 environmentMap(sampler2D envMap, in vec3 normalIn, in vec3 positionIn, in float mipmapIndex) {\n  vec3 eyeDir = normalize(-positionIn); //Direction to eye = camPos (0,0,0) - ecPos\n  vec3 ecN = normalize(normalIn);\n  vec3 ecReflected = reflect(-eyeDir, ecN); //eye coordinates reflection vector\n  vec3 wcReflected = vec3(invViewMatrix * vec4(ecReflected, 0.0)); //world coordinates reflection vector\n\n  vec2 texCoord = vec2((1.0 + atan(-wcReflected.z, wcReflected.x)/3.14159265359)/2.0, acos(-wcReflected.y)/3.14159265359);\n  return texture2D(envMap, texCoord, mipmapIndex);\n}\n\n/*\n\n//From Disney princlpled BRDF\nfloat SchlickFresnel(float u) {\n  float m = clamp(1.0-u, 0.0, 1.0);\n  float m2 = m*m;\n  return m2*m2*m; // pow(m,5)\n}\n\nvec3 Fresnel(vec3 specAlbedo, vec3 H, vec3 L) {\n  float LdotH = clamp(dot(L, H), 0.0, 1.0);\n  return specAlbedo + (1.0 - specAlbedo) * pow((1.0 - LdotH), 5.0);\n}\n\n*/\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToEyeSpace(float ndcDepth) {\n  return 2.0 * near * far / (far + near - ndcDepth * (far - near));\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(sampler2D depthMap, vec2 coord) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  return ndcDepthToEyeSpace(z_n);\n}\n\nvec3 getFarViewDir(vec2 tc) {\n  float hfar = 2.0 * tan(fov/2.0/180.0 * PI) * far;\n  float wfar = hfar * aspectRatio;\n  vec3 dir = (vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far));\n  return dir;\n}\n\nvec3 getViewRay(vec2 tc) {\n  vec3 ray = normalize(getFarViewDir(tc));\n  return ray;\n}\n\n//asumming z comes from depth buffer (ndc coords) and it's not a linear distance from the camera but\n//perpendicular to the near/far clipping planes\n//http://mynameismjp.wordpress.com/2010/09/05/position-from-depth-3/\n//assumes z = eye space z\nvec3 reconstructPositionFromDepth(vec2 texCoord, float z) {\n  vec3 ray = getFarViewDir(texCoord);\n  vec3 pos = ray;\n  return pos * z / far;\n}\n\n//Problems more sharp metal doesn't get darker\n\nvoid main() {\n  vec3 normal = texture2D(normalMap, vTexCoord).rgb; //assumes rgb = ecNormal.xyz + 0.5\n  vec4 albedoValue = texture2D(albedoMap, vTexCoord);\n  vec3 albedoColor = albedoValue.rgb;\n\n  float roughness = albedoValue.a;\n\n  float depth = readDepth(depthMap, vTexCoord);\n  vec3 position = reconstructPositionFromDepth(vTexCoord, depth);\n\n  vec3 ecN = normalize(normal - 0.5);\n\n\n  //indirect diffuse from IBL\n  vec3 envAmbient = environmentMap(diffuseMap, ecN, position, 0.0).rgb;\n  envAmbient = pow(envAmbient, vec3(1.0/2.2)); //correct gamma TEMP: overexposed texture corrected\n  vec3 envSpecular = environmentMap(reflectionMap, ecN, position, 0.0).rgb;\n  envSpecular = pow(envSpecular, vec3(1.0/2.2)); //correct gamma TEMP: overexposed texture corrected\n\n\n  gl_FragColor.rgb = intensity * albedoColor * mix(envSpecular, envAmbient, roughness);\n\n  /*\n  vec3 specularColor = albedoColor; //for now\n  //float occlusion = texture2D(occlusionMap, vTexCoord).r;\n  float occlusion = 1.0;\n\n  \n\n  \n  vec3 L = normalize(ecLighPos - position.xyz);\n  vec3 V = normalize(-position.xyz);\n  vec3 H = normalize(L + V);\n\n  float NdotL = clamp(dot(N, L), 0.0, 1.0);\n  float NdotV = clamp(dot(N, V), 0.0, 1.0);\n  float LdotH = clamp(dot(L, H), 0.0, 1.0);\n  float NdotH = clamp(dot(N, H), 0.0, 1.0);\n  float VdotH = clamp(dot(V, H), 0.0, 1.0);\n\n  //albedoColor = vec3(0.2, 0.2, 0.2); //TEMP\n  //albedo = vec3(0.0); //TEMP\n  float lightDistance = length(ecLighPos - position.xyz);\n  float maxMipMapLevel = 6.0; //most blurry\n  vec3 F0 = specularColor;\n  float metallic = 0.0;\n  //float roughness = 0.9; //0 - reflective, 1 - matte\n  float smoothness = 1.0 - roughness;    //0 - matte, 1 - reflective\n  float specular = 1.0;\n\n  //indirect diffuse from IBL\n  vec3 envAmbient = environmentMap(diffuseMap, N, position, 0.0).rgb;\n  //envAmbient = pow(envAmbient, vec3(4.2)); //correct gamma TEMP: overexposed texture corrected\n  vec3 envSpecular = environmentMap(reflectionMap, N, position, 0.0).rgb;\n  //envSpecular = pow(envSpecular, vec3(4.2)); //correct gamma TEMP: overexposed texture corrected\n\n  //vec3 LIndirectDiffuse = intensity * albedoColor;\n  //Indirect diffuse\n  //vec3 LIndirectDiffuse = mix(albedoColor, envSpecular, metallic) * envAmbient * (1.0 - metallic); //TODO: what's metal color?\n  //vec3 LIndirectDiffuse = mix(albedoColor, envSpecular, metallic) * envAmbient + envAmbient * (1.0 - metallic); //TODO: what's metal color?\n  vec3 LIndirectDiffuse = mix(albedoColor, envSpecular, metallic) * envAmbient * (1.0 - metallic); //TODO: what's metal color?\n\n  //Diffuse Fresnel (Disney) aka glossy Fresnel\n  //Should be 2D lookup texture for IBL as in UnreadEngine4\n  float FL = SchlickFresnel(NdotL);\n  float FV = SchlickFresnel(NdotV);\n  float Fd90 = 0.5 + 2.0 * LdotH*LdotH * roughness;\n  float Fd = mix(1.0, Fd90, FL) * mix(1.0, Fd90, FV);\n\n  //Specular BRDF: Cook-Torrance microfacet model\n  //          D(h) * F(v,h) * G(l,v,h)\n  // f(l,v) = ------------------------\n  //              4 * n.l * n.v\n\n  //Alpha: Based on \"Real Shading in Unreal Engine 4\"\n  float a = pow(1.0 - smoothness * 0.7, 6.0);\n\n  //Normal Distribution Function: GGX\n  //                    a^2\n  //D(h) = --------------------------------\n  //       PI * ((n.h)^2 * (a^2 - 1) + 1)^2\n  float aSqr = a * a;\n  float Ddenom = NdotH * NdotH * (aSqr - 1.0) + 1.0;\n  float Dh = aSqr / ( PI * Ddenom * Ddenom);\n\n  //Fresnel Term: Fresnel schlick\n  //F(v,h) = F0 + (1 - F0)*(1 - (v.h))^5\n  //Linear interpolation between specular color F0 and white\n  vec3 Fvh = F0 + (1.0 - F0) * pow((1.0 - VdotH), 5.0);\n\n  //Indirect specular\n  //vec3 LIndirectSpecular = Fvh * specular * envSpecular * NdotL; //TODO: Fresnel * IBLspec(roughness)\n  vec3 LIndirectSpecular = albedoColor * envSpecular * pow((1.0 - roughness), 2.0) * 2.0;\n\n  //LIndirectDiffuse = albedoColor * envSpecular;\n  //LIndirectDiffuse = albedoColor * envAmbient;\n\n  //LIndirectDiffuse = vec3(mix(envSpecular, envAmbient, roughness));\n\n  //LIndirectDiffuse = (albedoColor + mix(envSpecular, envAmbient, 1.0 - pow(1.0 - roughness, 2.0))) * intensity;\n  //LIndirectDiffuse = albedoColor * mix(envSpecular, envAmbient, 1.0 - pow(1.0 - roughness, 2.0)) * intensity;\n\n  vec3 FinalColor = (LIndirectDiffuse + LIndirectSpecular ) * intensity * occlusion * lightColor.rgb;\n\n  //vec3 wcPos = vec3(invViewMatrix * vec4(position, 1.0));\n  //if (length(wcPos) > 200.0) {\n  //  vec3 wcN = normalize(wcPos);\n  //  vec2 texCoord = vec2((1.0 + atan(-wcN.z, wcN.x)/3.14159265359)/2.0, acos(-wcN.y)/3.14159265359);\n  //  FinalColor = texture2D(reflectionMap, texCoord).xyz * intensity;\n  //  //FinalColor = normal;\n  //}\n\n  //FinalColor *= vec3(0.34509803921568627, 0.11764705882352941, 0.615686274509804);\n  //FinalColor = envSpecular;\n  //FinalColor = envAmbient;\n  //FinalColor = albedoColor;\n\n  //gl_FragColor = vec4(occlusion);\n\n  gl_FragColor.rgb = FinalColor;\n  */\n}\n\n#endif";

function DeferredGlobalLight(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(DeferredGlobalLightGLSL);
  var defaults = {
    albedoMap: null,
    normalMap: null,
    depthMap: null,
    occlusionMap: null,
    roughness: null,
    camera: null,
    lightPos: new Vec3(0, 0, 0),
    lightBrightness: 1,
    lightColor: Color.White,
    lightRadius: 1
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

DeferredGlobalLight.prototype = Object.create(Material.prototype);

module.exports = DeferredGlobalLight;

}).call(this,"/pbr/materials")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/materials/DeferredPointLight.js":[function(require,module,exports){
(function (__dirname){
var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');

var Vec3 = geom.Vec3;

var DeferredPointLightGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\n\nattribute vec3 position;\nattribute vec2 texCoord;\n\nuniform mat4 viewMatrix;\n\nuniform vec3 lightPos;\n\nvarying vec3 ecLighPos;\nvarying vec2 vTexCoord;\nuniform float near;\n\nvoid main() {\n  vec3 pos = position;\n  vec4 ecPos = modelViewMatrix * vec4(pos, 1.0);\n  //ecPos.z = min(ecPos.z, -near - 0.0001);\n  //ecPos.z = -5.0;\n  gl_Position = projectionMatrix * ecPos;\n  vTexCoord = gl_Position.xy/gl_Position.w * 0.5 + 0.5;\n  ecLighPos = (viewMatrix * vec4(lightPos, 1.0)).xyz;\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform mat4 invViewMatrix;\nuniform mat4 invProjectionMatrix;\n\nvarying vec3 ecLighPos;\nvarying vec2 vTexCoord;\nuniform sampler2D albedoMap;\nuniform sampler2D normalMap;\nuniform sampler2D depthMap;\n//uniform sampler2D occlusionMap;\nuniform float lightBrightness;\nuniform float lightRadius;\nuniform vec4 lightColor;\n\nuniform float fov;\nuniform float near;\nuniform float far;\nuniform float aspectRatio;\n\nconst float PI = 3.14159265358979323846;\n\n//vec3 environmentMap(samplerCube envMap, in vec3 normalIn, in vec3 positionIn, float mipmapIndex) {\n//  vec3 E = normalize(positionIn); //eye dir\n//  vec3 R = reflect(E, normalIn); //reflecte vector\n//  R = vec3(invViewMatrix * vec4(R, 0.0));\n//  vec3 color = textureCubeLod(envMap, R, mipmapIndex).rgb;\n//  return color;\n//}\n\n//From Disney princlpled BRDF\nfloat SchlickFresnel(float u) {\n  float m = clamp(1.0-u, 0.0, 1.0);\n  float m2 = m*m;\n  return m2*m2*m; // pow(m,5)\n}\n\nvec3 Fresnel(vec3 specAlbedo, vec3 H, vec3 L) {\n  float LdotH = clamp(dot(L, H), 0.0, 1.0);\n  return specAlbedo + (1.0 - specAlbedo) * pow((1.0 - LdotH), 5.0);\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat ndcDepthToEyeSpace(float ndcDepth) {\n  return 2.0 * near * far / (far + near - ndcDepth * (far - near));\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(sampler2D depthMap, vec2 coord) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  return ndcDepthToEyeSpace(z_n);\n}\n\nvec3 getFarViewDir(vec2 tc) {\n  float hfar = 2.0 * tan(fov/2.0/180.0 * PI) * far;\n  float wfar = hfar * aspectRatio;\n  vec3 dir = (vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far));\n  return dir;\n}\n\nvec3 getViewRay(vec2 tc) {\n  vec3 ray = normalize(getFarViewDir(tc));\n  return ray;\n}\n\n//asumming z comes from depth buffer (ndc coords) and it's not a linear distance from the camera but\n//perpendicular to the near/far clipping planes\n//http://mynameismjp.wordpress.com/2010/09/05/position-from-depth-3/\n//assumes z = eye space z\nvec3 reconstructPositionFromDepth(vec2 texCoord, float z) {\n  vec3 ray = getFarViewDir(texCoord);\n  vec3 pos = ray;\n  return pos * z / far;\n}\n\n//Problems more sharp metal doesn't get darker\n\n//http://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/\n//float lightAttenuation(float dist, float r, float cutoff)\n//{\n//    // calculate basic attenuation\n//    float denom = dist/r + 1;\n//    float attenuation = 1 / (denom*denom);\n//\n//    // scale and bias attenuation such that:\n//    //   attenuation == 0 at extent of max influence\n//    //   attenuation == 1 when d == 0\n//    attenuation = (attenuation - cutoff) / (1 - cutoff);\n//    attenuation = max(attenuation, 0);\n//\n//    return attenuation;\n//}\n\n//http://www.ozone3d.net/tutorials/glsl_lighting_phong_p4.php\n//float lightAttenuation(float dist, float r) {\n//  float kc = 0.0;\n//  float kl = 0.0 / r;\n//  float kq = 1.0 / (r * r);\n//  float cutoff = 0.01;\n//\n//  float attenuation = 1.0 / (kc + kl * dist + kq * dist * dist);\n//  attenuation = (attenuation - cutoff) / (1.0 - cutoff);\n//  attenuation = max(attenuation, 0.0);\n//\n//  return attenuation;\n//}\n\n//float lightAttenuation(float dist, float r) {\n//  float denom = dist/r;\n//  return 1.0 / (denom * denom);\n//}\n\n//float lightAttenuation\n\n//float lightAttenuation(float dist, float r, vec3 lightPos, vec3 pos) {\n//    // calculate normalized light vector and distance to sphere light surface\n//    vec3 L = lightPos - pos;\n//    float d2 = length(L);\n//    float d = max(d2 - r, 0);\n//    float cutoff = 0.95;\n//\n//    // calculate basic attenuation\n//    float denom = d/r + 1;\n//    float attenuation = 1 / (denom*denom);\n//\n//    // scale and bias attenuation such that:\n//    //   attenuation == 0 at extent of max influence\n//    //   attenuation == 1 when d == 0\n//    //attenuation = (attenuation - cutoff) / (1 - cutoff);\n//    //attenuation = max(attenuation, 0);\n//\n//    return d2/r;\n//}\n\nvoid main() {\n  vec3 normal = texture2D(normalMap, vTexCoord).rgb; //assumes rgb = ecNormal.xyz + 0.5\n  vec4 albedoValue = texture2D(albedoMap, vTexCoord);\n  vec3 albedoColor = pow(albedoValue.rgb, vec3(2.2));\n  float roughness = albedoValue.a;\n  vec3 specularColor = albedoColor; //for now\n  //float occlusion = texture2D(occlusionMap, vTexCoord).r;\n  float occlusion = 1.0;\n\n  float depth = readDepth(depthMap, vTexCoord);\n  vec3 position = reconstructPositionFromDepth(vTexCoord, depth);\n\n  vec3 FinalColor = vec3(0.0);\n  vec3 N = normalize(normal - 0.5);\n  vec3 L = normalize(ecLighPos - position.xyz);\n  vec3 V = normalize(-position.xyz);\n  vec3 H = normalize(L + V);\n\n  float NdotL = clamp(dot(N, L), 0.0, 1.0);\n  float NdotV = clamp(dot(N, V), 0.0, 1.0);\n  float LdotH = clamp(dot(L, H), 0.0, 1.0);\n  float NdotH = clamp(dot(N, H), 0.0, 1.0);\n  float VdotH = clamp(dot(V, H), 0.0, 1.0);\n\n  //albedoColor = vec3(0.2, 0.2, 0.2); //TEMP\n  //albedo = vec3(0.0); //TEMP\n  float lightDistance = length(ecLighPos - position.xyz);\n  float maxMipMapLevel = 6.0; //most blurry\n  vec3 F0 = specularColor;\n\n  if (lightDistance < lightRadius) {\n  }\n  else {\n    //discard;\n  }\n\n  float metallic = 0.0;\n  //float roughness = 0.9; //0 - reflective, 1 - matte\n  float smoothness = 1.0 - roughness;    //0 - matte, 1 - reflective\n  float specular = 0.5;\n\n  /*\n\n  //indirect diffuse from IBL\n  vec3 envAmbient = environmentMap(reflectionMap, N, position, maxMipMapLevel);\n  envAmbient = pow(envAmbient, vec3(4.2)); //correct gamma TEMP: overexposed texture corrected\n\n  //indirect specular from IBL\n  vec3 envSpecular = environmentMap(reflectionMap, N, position, (1.0 - (1.0 - roughness) * (1.0 - roughness)) * maxMipMapLevel);\n  envSpecular = pow(envSpecular, vec3(4.2)); //correct gamma TEMP: overexposed texture corrected\n\n  */\n  //Based on \"Real Shading in Unreal Engine 4\"\n  float lightFalloff = pow(clamp(1.0 - pow(lightDistance/lightRadius, 4.0), 0.0, 1.0), 2.0) / (pow(lightDistance, 2.0) + 1.0);\n  //float lightFalloff = lightAttenuation(lightDistance, lightRadius, ecLighPos, position.xyz);\n  //float lightFalloff = lightAttenuation(lightDistance, lightRadius);\n  //lightFalloff = 1.0;\n\n  /*\n  //Indirect diffuse\n  vec3 LIndirectDiffuse = mix(albedoColor, envSpecular, metallic) * envAmbient * (1.0 - metallic); //TODO: what's metal color?\n  */\n  vec3 LIndirectDiffuse = 0.01 * albedoColor;\n\n  //Diffuse Fresnel (Disney) aka glossy Fresnel\n  //Should be 2D lookup texture for IBL as in UnreadEngine4\n  float FL = SchlickFresnel(NdotL);\n  float FV = SchlickFresnel(NdotV);\n  float Fd90 = 0.5 + 2.0 * LdotH*LdotH * roughness;\n  float Fd = mix(1.0, Fd90, FL) * mix(1.0, Fd90, FV);\n\n  //Specular BRDF: Cook-Torrance microfacet model\n  //          D(h) * F(v,h) * G(l,v,h)\n  // f(l,v) = ------------------------\n  //              4 * n.l * n.v\n\n  //Alpha: Based on \"Real Shading in Unreal Engine 4\"\n  float a = pow(1.0 - smoothness * 0.7, 6.0);\n\n  //Normal Distribution Function: GGX\n  //                    a^2\n  //D(h) = --------------------------------\n  //       PI * ((n.h)^2 * (a^2 - 1) + 1)^2\n  float aSqr = a * a;\n  float Ddenom = NdotH * NdotH * (aSqr - 1.0) + 1.0;\n  float Dh = aSqr / ( PI * Ddenom * Ddenom);\n\n  //Fresnel Term: Fresnel schlick\n  //F(v,h) = F0 + (1 - F0)*(1 - (v.h))^5\n  //Linear interpolation between specular color F0 and white\n  vec3 Fvh = F0 + (1.0 - F0) * pow((1.0 - VdotH), 5.0);\n\n  /*\n  //Indirect specular\n  vec3 LIndirectSpecular = Fvh * specular * envSpecular * NdotL; //TODO: Fresnel * IBLspec(roughness)\n  */\n\n  //Visibility Term: Schlick-Smith\n  //                                          n.v               (0.8 + 0.5*a)^2\n  //G(l,v,h) = G1(l)* G1(v)    G1(v) = -----------------    k = ---------------\n  //                                   (n.v) * (1-k) + k               2\n  float k = pow(0.8 + 0.5 * a, 2.0) / 2.0;\n  float G1l = NdotL / (NdotL * (1.0 - k) + k);\n  float G1v = NdotV / (NdotV * (1.0 - k) + k);\n  float Glvn = G1l * G1v;\n\n  //Complete Cook-Torrance\n  vec3 flv = Dh * Fvh * Glvn / (4.0 * NdotL * NdotV);\n\n  vec3 LDirectDiffuse = 1.0 / PI * albedoColor * lightBrightness * lightColor.rgb * lightFalloff * clamp(NdotL, 0.0, 1.0);\n  vec3 LDirectSpecualar = vec3(flv) * lightBrightness * lightColor.rgb * lightFalloff * clamp(NdotL, 0.0, 1.0);\n\n  FinalColor = (LDirectDiffuse + LDirectSpecualar) * occlusion;// + LIndirectDiffuse;\n\n  //FinalColor = vec3(NdotL);\n  //FinalColor = vec3(lightDistance / lightRadius);\n  //FinalColor = vec3(lightFalloff);\n\n  gl_FragColor.rgb = FinalColor;\n}\n\n#endif";

function DeferredPointLight(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(DeferredPointLightGLSL);
  var defaults = {
    albedoMap: null,
    normalMap: null,
    depthMap: null,
    occlusionMap: null,
    roughness: null,
    camera: null,
    lightPos: new Vec3(0, 0, 0),
    lightBrightness: 1,
    lightColor: Color.White,
    lightRadius: 1
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

DeferredPointLight.prototype = Object.create(Material.prototype);

module.exports = DeferredPointLight;

}).call(this,"/pbr/materials")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-geom":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-geom/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/pbr/materials/MatCapAlpha.js":[function(require,module,exports){
(function (__dirname){
//http://www.clicktorelease.com/blog/creating-spherical-environment-mapping-shader

var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');


var MatCapAlphaGLSL = "#ifdef VERT\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 normalMatrix;\nuniform float pointSize;\nattribute vec3 position;\nattribute vec3 normal;\n\nvarying vec3 e;\nvarying vec3 n;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n  e = normalize(vec3(modelViewMatrix * vec4(position, 1.0)));\n  n = normalize(vec3(normalMatrix * vec4(normal, 1.0)));\n}\n\n#endif\n\n#ifdef FRAG\n\nuniform sampler2D texture;\nuniform float alpha;\n\nvarying vec3 e;\nvarying vec3 n;\n\nvoid main() {\n  vec3 r = reflect(e, n);\n  float m = 2.0 * sqrt(\n    pow(r.x, 2.0) +\n    pow(r.y, 2.0) +\n    pow(r.z + 1.0, 2.0)\n  );\n  vec2 N = r.xy / m + 0.5;\n  vec3 base = texture2D( texture, N ).rgb;\n  gl_FragColor = vec4( base, alpha );\n}\n\n#endif\n";

function MatCapAlpha(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(MatCapAlphaGLSL);
  var defaults = {};
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

MatCapAlpha.prototype = Object.create(Material.prototype);

module.exports = MatCapAlpha;

}).call(this,"/pbr/materials")
},{"merge":"/Users/Mary/Documents/var-rose/webgl/node_modules/merge/merge.js","pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js","pex-glu":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-glu/index.js"}],"/Users/Mary/Documents/var-rose/webgl/sg/index.js":[function(require,module,exports){
exports.Graph = require('./lib/Graph');
exports.Snippet = require('./lib/Snippet');

exports.graph = function(searchPaths) {
  return new exports.Graph(searchPaths);
}
},{"./lib/Graph":"/Users/Mary/Documents/var-rose/webgl/sg/lib/Graph.js","./lib/Snippet":"/Users/Mary/Documents/var-rose/webgl/sg/lib/Snippet.js"}],"/Users/Mary/Documents/var-rose/webgl/sg/lib/Graph.js":[function(require,module,exports){
(function (__dirname){
var Snippet = require('./Snippet');
var Utils = require('./Utils');

function Graph(searchPaths) {
  this.searchPaths = searchPaths || ['assets', 'shaders', __dirname + '/../shaders'];
  this.snippets = [];
  this.cache = {
    frag: {},
    vert: {}
  };
}

Graph.prototype.snippet = function(fragmentSource) {
  if (!this.cache.frag[fragmentSource]) {
    var frag = new Snippet(Utils.getShaderSource(fragmentSource, this.searchPaths), 'frag');
    this.snippets.push(frag);
    this.cache.frag[fragmentSource] = frag;
  }
  return this;
};

Graph.prototype.material = function(vertexSource, fragmentSource) {
  if (!this.cache.vert[vertexSource]) {
    var vert = new Snippet(Utils.getShaderSource(vertexSource, this.searchPaths), 'vert');
    this.snippets.push(vert);
    this.cache.vert[vertexSource] = vert;
  }
  if (!this.cache.frag[fragmentSource]) {
    var frag = new Snippet(Utils.getShaderSource(fragmentSource, this.searchPaths), 'frag');
    this.snippets.push(frag);
    this.cache.frag[fragmentSource] = frag;
  }
  return this;
};

Graph.prototype.compile = function() {
  var context = {
    'vert': { externals: [], outputs: [], parameters: [], calls: []},
    'frag': { externals: [], outputs: [], parameters: [], calls: []}
  };

  function findExternal(phase, external) {
    var externals = context[phase].externals;
    var result = externals.filter(function(e) {
      if (e.name == external.name) {
        if (e.type != external.type) {
          throw 'Uncompatibile externals. ' + e.type + ' ' + e.name + ' AND ' + external.type + ' ' + external.name;
        }
        return true;
      }
      else {
        return false;
      }
    });
    return result[result.length-1];
  }

  function addExternal(phase, external) {
    var existingExternal = findExternal(phase, external);
    if (!existingExternal) {
      context[phase].externals.push(external);
    }
  }

  function findOutput(phase, output) {
    var outputs = context[phase].outputs;
    var result = outputs.filter(function(o) {
      return o.hint == output.hint && o.type == output.type;
    });
    return result[result.length-1];
  }

  function addOutput(phase, output) {
    context[phase].outputs.push(output);
  }

  function addCall(phase, snippet) {
    var calls = context[phase].calls;
    var name = snippet.name + '_' + calls.length;
    var signature = snippet.signature;
    var body = snippet.body.replace(/\s*void\s+([A-Za-z0-9_]+)\s*\([^\)]*\)/g, ['void', name + '(', signature.join(', '), ')'].join(' '));
    body = body.replace(/\}void/g,'}\nvoid'); //fix code layout for cases where main is preceded with another function
    calls.push({ snippet: snippet, body: body, name: name });
  }

  this.snippets.forEach(function(snippet) {
    var phase = snippet.phase;
    var externals = snippet.getExternals();
    externals.forEach(function(external) {
      addExternal(phase, external);
    });

    var inputs = snippet.getInputs();
    var outputs = snippet.getOutputs();

    inputs.forEach(function(input) {
      var existingOutput = findOutput(phase, input);
      if (existingOutput) {
        input.connection = existingOutput;
      }
      else {
        console.log('Shippet', snippet.body);
        throw new Error('Looking for input ' + input.hint + ' <- FAILED');
      }
    });

    outputs.forEach(function(output) {
      var existingOutput = findOutput(phase, output);
      if (!existingOutput) {
        output.priority = 0;
      }
      else {
        output.priority = existingOutput.priority + 1;
      }
      addOutput(phase, output);
    });

    addCall(phase, snippet);
  });

  var vertexCode = [];;
  context.vert.externals.forEach(function(external) {
    vertexCode.push(external.kind + ' ' + external.signature + ';');
  });
  context.vert.calls.forEach(function(call) {
    vertexCode.push(call.body);
  });
  vertexCode.push('void main() {');
  context.vert.outputs.forEach(function(output) {
    vertexCode.push('  ' + output.glslType + ' ' + output.hint + '_' + output.priority + ';');
  });
  context.vert.calls.forEach(function(call) {
    var callLine = [];
    callLine.push('  ');
    callLine.push(call.name);
    callLine.push('(');
    var params = call.snippet.parameters.map(function(parameter, parameterIndex) {
      if (parameter.inout == 'in') {
        return parameter.connection.hint + '_' + parameter.connection.priority;
      }
      else if (parameter.inout == 'out') {
        return parameter.hint + '_' + parameter.priority;
      }
    });
    callLine.push(params.join(', '));
    callLine.push(');');
    vertexCode.push(callLine.join(''));
  });
  vertexCode.push('}');

  var fragmentCode = [];
  context.frag.externals.forEach(function(external) {
    fragmentCode.push(external.kind + ' ' + external.signature + ';' );
  });
  context.frag.calls.forEach(function(call) {
    fragmentCode.push(call.body);
  });
  fragmentCode.push('void main() {');
  context.frag.outputs.forEach(function(output) {
    fragmentCode.push('  ' + output.glslType + ' ' + output.hint + '_' + output.priority + ';');
  });
  context.frag.calls.forEach(function(call) {
    var callLine = [];
    callLine.push('  ');
    callLine.push(call.name);
    callLine.push('(');
    var params = call.snippet.parameters.map(function(parameter, parameterIndex) {
      if (parameter.inout == 'in' || parameter.inout == 'inout') {
        var input = parameter.connection;
        while (input.connection) {
          input = input.connection;
        }
        return input.hint + '_' + input.priority;
      }
      else if (parameter.inout == 'out') {
        return parameter.hint + '_' + parameter.priority;
      }
    });
    callLine.push(params.join(', '));
    callLine.push(');');
    fragmentCode.push(callLine.join(''));
  });
  fragmentCode.push('}');

  var shader = {
    vertexShader: vertexCode.join('\n'),
    fragmentShader: fragmentCode.join('\n')
  }

  //console.log('VERT');
  //console.log(shader.vertexShader);

  //console.log('FRAG');
  //console.log(shader.fragmentShader);

  return shader;
}

module.exports = Graph;
}).call(this,"/sg/lib")
},{"./Snippet":"/Users/Mary/Documents/var-rose/webgl/sg/lib/Snippet.js","./Utils":"/Users/Mary/Documents/var-rose/webgl/sg/lib/Utils.js"}],"/Users/Mary/Documents/var-rose/webgl/sg/lib/Snippet.js":[function(require,module,exports){
var lo = require('lodash');

function Snippet(code, phase) {
  this.code = code;
  this.phase = phase;

  this.attributes = [];
  this.uniforms   = [];
  this.varyings   = [];
  this.parameters = [];

  this.parseCode(code);
}

Snippet.types = {
  'float':       'f',
  'vec2':        'v2',
  'vec3':        'v3',
  'vec4':        'v4',
  'mat3':        'm3',
  'mat4':        'm4',
  'sampler2D':   't',
  'samplerCube': 't'//,
};

Snippet.defaults = {
  'float':       0,
  'vec2':        { x: 0, y: 0 },
  'vec3':        { x: 0, y: 0, z:0 },
  'vec4':        { x: 0, y: 0, z:0, w: 1 },
  'mat4':        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  'sampler2D':   0,
  'samplerCube': 0//,
};

Snippet.prototype.parseCode = function(code) {
  function findAll(re, string) {
    if (!re.global) throw "Can't findAll non-global regexp";
    var match, all = [];
    while (match = re.exec(string)) {
      all.push(match);
    };
    return all;
  }

  //Remove all comments and normalize newlines
  code = code.replace(/\r\n?/g, '\n').replace(/\/\/[^\n]*\n/g, '\n').replace(/\/\*(.|\n)*?\*\//g, '\n');

  var attributes = findAll(/(?:^|;)\s*attribute\s+(([A-Za-z0-9]+)\s+([A-Za-z0-9_]+)\s*(?:\[([^\]]+)\])?)(?:$|(?=;))/g, code);
  var uniforms = findAll(/(?:^|;)\s*uniform\s+(([A-Za-z0-9]+)\s+([A-Za-z0-9_]+)\s*(?:\[([^\]]+)\])?)(?:$|(?=;))/g, code);
  var varyings = findAll(/(?:^|;)\s*varying\s+(([A-Za-z0-9]+)\s+([[A-Za-z0-9_]+)\s*(?:\[([^\]]+)\])?)(?:$|(?=;))/g, code);
  var signature = findAll(/void\s+(main[A-Za-z0-9_]*)\s*\(([^\)]*)\)\s*{/g, code);

  //console.log(attributes)
  var matches = {
    parseAttribute: attributes,
    parseUniform:   uniforms,
    parseVarying:   varyings//,
  };
  var body = code;
  lo.each(matches, function(set, key) {
    lo.each(set, function(item) {
      this[key](item);
      body = body.replace(item[0], '');
    }.bind(this));
  }.bind(this));
  body = body.replace(/^\s*;/, '');

  // Process function signature.
  try {
    this.parseSignature(signature[0]);
  }
  catch (e) {
    console.log('Shader failed', e);
    console.log(code);
  }
  this.body = body;
}

Snippet.prototype.arguments = function() {
  return {
    uniforms: this.uniforms,
    varyings: this.varyings,
    attributes: this.attributes,
    parameters: this.parameters//,
  };
};

Snippet.prototype.type = function(type, array) {
  type = (Snippet.types[type] || 'f') + (array ? 'v' : '');
  type = type == 'fv' ? 'fv1' : type;
  return type;
};

Snippet.prototype.parseAttribute = function(match) {
  var signature = match[1],
      type = match[2],
      name = match[3],
      array = match[4];

  this.attributes.push({
    kind: 'attribute',
    name: name,
    type: this.type(type, array),
    signature: signature//,
  });
};

Snippet.prototype.parseUniform = function(match) {
  var signature = match[1],
      type = match[2],
      name = match[3],
      array = match[4];

  this.uniforms.push({
    kind: 'uniform',
    name: name,
    type: this.type(type, array),
    value: Snippet.defaults[type] || 0,
    signature: signature//,
  });
};

Snippet.prototype.parseVarying = function(match) {
  var signature = match[1],
      type = match[2],
      name = match[3],
      array = match[4];

  this.varyings.push({
    kind: 'varying',
    name: name,
    type: this.type(type, array),
    signature: signature//,
  });
};

Snippet.prototype.parseSignature = function(match) {
  this.name = match[1];

  // Ignore empty signature
  var signature = match[2].replace(/^\s*$/g, '');
  if (signature.length == 0) {
    this.signature = [];
    return;
  }

  // Parse out arguments.
  var arguments = this.signature = signature.split(',');
  lo.each(arguments, function(definition) {
    var match = /((?:(in|out|inout)\s+)?([A-Za-z0-9]+)\s+([A-Za-z0-9_]+)\s*(?:\[([^\]]+)\])?)(?:$|(?=;))/.exec(definition);

    var signature = match[1],
        inout = match[2],
        type = match[3],
        name = match[4],
        array = match[5];

    var inouts = {
      'in': 'in',
      'out': 'out',
      'inout': 'inout'//,
    };

    this.parameters.push({
      inout: inouts[inout || 'in'],
      name: name,
      glslType: type,
      type: this.type(type, array),
      hint: name.replace(/(In|Out)$/, ''),
      signature: signature//,
    });
  }.bind(this));
};

Snippet.prototype.getInputs = function() {
  return this.parameters.filter(function(param) {
    return param.inout == 'in' || param.inout == 'inout';
  });
};

Snippet.prototype.getOutputs = function() {
  return this.parameters.filter(function(param) {
    return param.inout == 'out' || param.inout == 'inout';
  });
};

Snippet.prototype.getExternals = function() {
  return []
    .concat(this.attributes)
    .concat(this.uniforms)
    .concat(this.varyings);
};

module.exports = Snippet;
},{"lodash":"/Users/Mary/Documents/var-rose/webgl/node_modules/lodash/dist/lodash.js"}],"/Users/Mary/Documents/var-rose/webgl/sg/lib/Utils.js":[function(require,module,exports){


module.exports.getShaderSource = function(str, searchPaths) {
  if (str.indexOf('void main') !== -1) return str;
  for(var i=0; i<searchPaths.length; i++) {
    var file = searchPaths[i] + '/' + str;
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }
  }
  return str;
}
},{}],"/Users/Mary/Documents/var-rose/webgl/utils/ColorUtils.js":[function(require,module,exports){
var color = require('pex-color');
var Color = color.Color;

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

module.exports.hexToColor = function(hex) {
  var c = hexToRgb(hex);
  return new Color(c.r/255, c.g/255, c.b/255, 1.0);
}
},{"pex-color":"/Users/Mary/Documents/var-rose/webgl/node_modules/pex-color/index.js"}]},{},["./materialView.js"]);
