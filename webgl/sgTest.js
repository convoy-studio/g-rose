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
var fs = require('fs');
var sg = require('./sg/');
var UberMaterial = require('./materials/UberMaterial');

var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Mesh = glu.Mesh;
var TextureCube = glu.TextureCube;
var Texture2D = glu.Texture2D;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Platform = sys.Platform;
var Time = sys.Time;
var Vec3 = geom.Vec3;
var Cube = gen.Cube;
var Box = gen.Box;
var Sphere = gen.Sphere;
var GUI = gui.GUI;
var Geometry = geom.Geometry;
var ShowNormals = materials.ShowNormals;
var Diffuse = materials.Diffuse;
var MatCap = materials.MatCap;

//-----------------------------------------------------------------------------

var NormalVert = fs.readFileSync(__dirname + '/sg/shaders/Normal.vert', 'utf8');
var NormalFrag = fs.readFileSync(__dirname + '/sg/shaders/Normal.frag', 'utf8');
//var EnvMapFrag = fs.readFileSync(__dirname + '/sg/shaders/EnvMap.frag', 'utf8');
var SkinnedVert = fs.readFileSync(__dirname + '/sg/shaders/Skinned.vert', 'utf8');
var SkinnedFrag = fs.readFileSync(__dirname + '/sg/shaders/Skinned.frag', 'utf8');
var PositionVert = fs.readFileSync(__dirname + '/sg/shaders/Position.vert', 'utf8');
var PositionFrag = fs.readFileSync(__dirname + '/sg/shaders/Position.frag', 'utf8');
var SolidColorFrag = fs.readFileSync(__dirname + '/sg/shaders/SolidColor.frag', 'utf8');
var ShowNormalsFrag = fs.readFileSync(__dirname + '/sg/shaders/ShowNormals.frag', 'utf8');
var LightVert = fs.readFileSync(__dirname + '/sg/shaders/Light.vert', 'utf8');
var LambertFrag = fs.readFileSync(__dirname + '/sg/shaders/Lambert.frag', 'utf8');
var PhongFrag = fs.readFileSync(__dirname + '/sg/shaders/Phong.frag', 'utf8');
var BlinnPhongFrag = fs.readFileSync(__dirname + '/sg/shaders/BlinnPhong.frag', 'utf8');
var OutputVert = fs.readFileSync(__dirname + '/sg/shaders/Output.vert', 'utf8');
var OutputFrag = fs.readFileSync(__dirname + '/sg/shaders/Output.frag', 'utf8');
var GGXFrag = fs.readFileSync(__dirname + '/sg/shaders/GGX.frag', 'utf8');
var ViewVectorFrag = fs.readFileSync(__dirname + '/sg/shaders/ViewVector.frag', 'utf8');
var CubeMapFrag = fs.readFileSync(__dirname + '/sg/shaders/CubeMap.frag', 'utf8');
var MatCapFrag = fs.readFileSync(__dirname + '/sg/shaders/MatCap.frag', 'utf8');
var ShowDepthFrag = fs.readFileSync(__dirname + '/sg/shaders/ShowDepth.frag', 'utf8');
var TexturedTriPlanarFrag = fs.readFileSync(__dirname + '/sg/shaders/TexturedTriPlanar.frag', 'utf8');
var CorrectGammaFrag = fs.readFileSync(__dirname + '/sg/shaders/CorrectGamma.frag', 'utf8');
var GammaFrag = fs.readFileSync(__dirname + '/sg/shaders/Gamma.frag', 'utf8');
var EnvironmentMapFrag = fs.readFileSync(__dirname + '/sg/shaders/EnvironmentMap.frag', 'utf8');
//var EnvironmentMapLodFrag = fs.readFileSync(__dirname + '/sg/shaders/EnvironmentMapLod.frag', 'utf8');
//var EnvironmentMapWithRoughnessFrag = fs.readFileSync(__dirname + '/sg/shaders/EnvironmentMapWithRoughness.frag', 'utf8');

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
      var graph = sg.graph();

      graph.material(PositionVert, PositionFrag);
      graph.material(NormalVert, NormalFrag);
      //graph.material(SkinnedVert, SkinnedFrag);
      graph.snippet(SolidColorFrag);
      //graph.snippet(ShowNormalsFrag);
      //graph.snippet(ViewVectorFrag);
      graph.snippet(CubeMapFrag);
      //graph.snippet(ShowNormalsFrag);
      //graph.snippet(MatCapFrag);
      graph.snippet(CorrectGammaFrag);
      //
      //graph.snippet(EnvironmentMapLodFrag);
      //graph.snippet(TexturedTriPlanarFrag);
      graph.material(LightVert, LambertFrag);
      //graph.material(LightVert, PhongFrag);
      //graph.material(LightVert, BlinnPhongFrag);
      graph.material(LightVert, GGXFrag);
      //
      //graph.snippet(ShowDepthFrag);
      //graph.material(LightVert, brdfs[this.params.activeBrdf].code);
      graph.snippet(GammaFrag);
      graph.material(OutputVert, OutputFrag);

      //material.vertex.pipe('Position.vert').pipe('Output.vert', { projectionMatrix: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1] });
      //material.fragment.pipe('SolidColor.frag').pipe('Output.frag');

      var program = graph.compile();

      var material = new Material(new Program(program.vertexShader, program.fragmentShader));
      material.uniforms.color = new Color(0.9, 0.0, 0.1, 1.0);
      material.uniforms.shininess = 64;
      material.uniforms.lightPos = new Vec3(50,50,50);
      material.uniforms.n0 = 0.25;
      material.uniforms.roughness = 0.71715;
      material.uniforms.scale = 1;
      material.uniforms.near = this.camera.getNear();
      material.uniforms.far = this.camera.getFar();

      material.uniforms.cubeMap = TextureCube.load([
        __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_posx.jpg',
        __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_negx.jpg',
        __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_posy.jpg',
        __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_negy.jpg',
        __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_posz.jpg',
        __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_negz.jpg'
      ]);

      material.uniforms.matCapTexture = Texture2D.load(__dirname + '/../server/public/assets/textures/matcaps/matcap.jpg');
      material.uniforms.triPlanarTexture = Texture2D.load(__dirname + '/../server/public/assets/textures/dots.png', { repeat: true });

      return material;
    }.bind(this))();
  },
  initGUI: function() {
    this.gui = new GUI(this);
  },
  initControls: function() {
    this.camera = new PerspectiveCamera(60, this.width / this.height, 10, 100);
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
      if (true) {
        var g = new Box(10).catmullClark().extrude(3).catmullClark().catmullClark()
        g.computeNormals();
        //g = new Sphere(7);
        var m = new Mesh(g);
        m.update = function() {}
        this.look.setBody(m);
      }
      this.solidColor = new UberMaterial({
        correctGamma: false,
        //skinned: false,
        color: Color.Red,
        roughness: 0.6,
        showNormals: true,
        showDepth: true,
        near: this.camera.getNear(),
        far: this.camera.getFar(),
        //matCapTexture: Texture2D.load(__dirname + '/../server/public/assets/textures/matcaps/matcap.jpg')
        //triPlanarScale: 0.4,
        //triPlanarTexture: Texture2D.load(__dirname + '/../server/public/assets/textures/dots.png', { repeat: true })
        //cubeMap: TextureCube.load([
        //  __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_posx.jpg',
        //  __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_negx.jpg',
        //  __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_posy.jpg',
        //  __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_negy.jpg',
        //  __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_posz.jpg',
        //  __dirname + '/../server/public/assets/textures/cubemaps/uffizi/uffizi_cross_negz.jpg'
        //]),
        //envMap: Texture2D.load(__dirname + '/../server/public/assets/textures/envmaps/studio007.jpg', { repeat: true })
        envMapReflection: Texture2D.load(__dirname + '/../server/public/assets/textures/envmaps/studio007.jpg', { repeat: true }),
        envMapDiffuse: Texture2D.load(__dirname + '/../server/public/assets/textures/envmaps/studio007smallBlur.jpg', { repeat: true })
      });
      this.look.getBody().setMaterial(this.solidColor);
      this.look.setAnimationEnabled(true);
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