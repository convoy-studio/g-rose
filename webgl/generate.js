var sys = require('pex-sys');
var glu = require('pex-glu');
var gui = require('pex-gui');
var Q = require('q');
var materials = require('pex-materials');
var color = require('pex-color');
var geom = require('pex-geom');
var gen = require('pex-gen');
var Model = require('./rose/Model');
var Look = require('./rose/Look_static');
var Triangle3 = require('./geom/Triangle3');
var RayExt = require('./geom/Ray.Ext');
var RoseMaterial = require('./materials/RoseMaterial');
var UberMaterial = require('./materials/UberMaterial');
var Texture2D = glu.Texture2D;
var ObjReader = require('./utils/ObjReader');

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
var BoundingBox = geom.BoundingBox;
var Quat = geom.Quat;

var shapeIndex = 0;

var animationEnabled= false,
    bodyIndex= 0,
    garmentIndex= 0,
    shapeMesh= null,
    shapeInstances= [];

var DPI = Platform.isBrowser ? 1 : 2;

var s = geom.randomFloat(0.2, 1);

function init(canvas, canvasWidth, canvasHeight, body, gender, garments, shapeType, callback) {
  return {
    settings: {
      width: canvasWidth ,
      height: canvasHeight ,
      type: '3d',
      highdpi: DPI,
      canvas: canvas,
      preserveDrawingBuffer: true
    },
    init: function() {
      this.initGUI();
      this.initControls();
      this.look = new Look();
      this.bodies = [];
      this.garments = garments;
      this.shapes;
      this.animationEnabled= false;
      this.bodyIndex= 0;
      this.garmentIndex= 0;
      this.shapeInstances= [];
      this.randomSize = false;
      this.shapeSize = 1;
      this.mouseDown = false;
      this.shapeActive = false;
      this.bodyFile = body;
      this.garmentFiles = [];
      this.pattern;
      this.patterns ={};
      this.matcap;
      this.matcaps = {};
      this.garmentModels;

      if (gender =="female") {
        this.activeGarments = [0];
      } else {
        this.activeGarments = [0,3];
        console.log(this.activeGarments);
      }
      

      for (var i=0; i<garments.length; i++) {
        this.garmentFiles.push(ASSETS_URL+ gender + '/'+ garments[i].name+'.js');
        console.log(this.garmentFiles[i]);
      }
      var material = new UberMaterial({
        skinned: false,
        correctGamma: false,
        showNormals: false,
        color: Color.White,
        fakeLights: false,
        roughness: .7
      });

      this.garmentMaterials = [material, material];
      //this.garmentMaterials[0] = new RoseMaterial({lightPos: new Vec3(7, 10, 5), color: Color.create(.2, .2, .2, 1), usePhong: true});
      //this.garmentMaterials[1] = new RoseMaterial({lightPos: new Vec3(7, 10, 5), color: Color.create(.2, .2, .2, 1), usePhong: true});


      this.bgColor = new Color(0, 0, 0, 0);
      this.materialType = 'flat';
      this.previewMaterial = new RoseMaterial({
        lightPos: new Vec3(10, 10, 10)
      });
      //this.shapeMaterial = new RoseMaterial({lightPos: new Vec3(3, 3, 150), color: Color.create(.3, .3, .3, 1), useDiffuse: true});
      this.shapeMaterial = material;

      this.previewMaterial = new RoseMaterial({lightPos: new Vec3(0, 5, 5), color: Color.create(.2, .9, .9, .3)});

      this.look.shapeMaterial = this.shapeMaterial;

      //this.shapeType = "sphere";
      this.shapeMesh = new Mesh(new Sphere(.7,8,8), this.shapeMaterial);
      this.currentShape = new Mesh(new Sphere(.7,8,8), this.previewMaterial);
      this.look.setShape(this.shapeMesh);
      this.shapeType =shapeType;
      this.loadShapes();
      console.log('this shape is '+ this.shapeType);
      if(this.shapeType) {
        if(this.shapeType=='sphere'){
          this.shapeMesh = new Mesh(new Sphere(.7,8,8), this.shapeMaterial);
          this.currentShape = new Mesh(new Sphere(.7,8,8), this.previewMaterial);

          //this.loadShapes();
        }else if (this.shapeType == 'cube') {
          this.shapeMesh = new Mesh(new Cube(1,1,1), this.shapeMaterial);
          this.currentShape = new Mesh(new Cube(1,1,1), this.previewMaterial);

          //this.loadShapes();
        } else {
          console.log("loading "+shapeType);
          var shapeRotation = Quat.fromAxisAngle(new Vec3(1, 0, 0), 90);
            if (shapeType == 'Plane_01') {
              shapeRotation = Quat.fromAxisAngle(new Vec3(1, 0, 0), 60);
            }
          ObjReader.load( '/assets/shapes/jody/' + shapeType + '.obj', function(g) {
            var bbox = BoundingBox.fromPoints(g.vertices);
            var scale = 1;
            if (bbox.getSize().x > 10) scale = 0.01;
            g.vertices.forEach(function(v) {
              v.scale(scale);
              v.transformQuat(shapeRotation);
            });
            var newShape = new Mesh(g, this.shapeMaterial);
            this.shapeMesh = newShape;
            this.currentShape = newShape;

            //this.loadShapes();
         }.bind(this));
        }
      }
      


      if (shapeType) {
        //this.changeShape(shapeType);
        //console.log(shapeType);
      }

      this.userShape = false;
      this.loadModels();



      

      //this.on('leftMouseDown', this.onMouseDown.bind(this));
      //this.on('leftMouseDown', this.onMouseMove.bind(this));
      //this.on('leftMouseUp', this.onMouseUp.bind(this));
      //this.on('mouseMoved', this.onMouseMove.bind(this));
    },
    onMouseDrag: function(e) {
      if(this.mouseDown) {
        //console.log(this.arcball);
      }
    },
    onMouseUp: function(e) {
      this.mouseDown = false;
      s = geom.randomFloat(0.2, 1);
    },
    onMouseDown: function(e) {
      this.mouseDown = true;

      this.shapeInstances.push({
        position: this.currentShape.position,
        rotation: this.currentShape.rotation,
        scale: this.currentShape.scale
      });


    },
    
    initGUI: function() {
      this.gui = new GUI(this);
    },
    initControls: function() {
      //this.camera = new PerspectiveCamera(120, this.width / this.height);
      this.camera = new PerspectiveCamera(60, this.width / this.height);
      this.camera.setTarget(new Vec3(0, -2, 0));
      this.camera.setPosition(new Vec3(0, -2, 16));
    },
    onBodyChanged: function(index) {
      this.look.setBody(this.bodies[index]);
    },
    onGarmentChanged: function(index) {
      this.look.setGarment(this.garments[index]);
    },
    loadModels: function() {
      Q.all([
        Model.load(this.bodyFile),
        //Model.load(ASSETS_URL + 'models/male_walking_lowpoly.js')
      ])
      .then(function(models) {
        this.look.setBody(models[0]);
        this.look.setAnimationEnabled(this.animationEnabled);
        this.bodies = models;

        if( this.garments.length>1) {  //bad hack
        Q.all([
          Model.load(this.garmentFiles[0]),
          Model.load(this.garmentFiles[1]),
          Model.load(this.garmentFiles[2]),
          Model.load(this.garmentFiles[3]),
          Model.load(this.garmentFiles[4]),
          Model.load(this.garmentFiles[5])
        ])
        .then(function(models) {
          this.garmentModels = models;
          console.log(this.garmentModels);
          console.log("after garmentModels");
          console.log(models[0].morphs.influences);
          for (i=0; i<garments[0].morphs.length; i++) {
            var morphs =garments[0].morphs;
            models[0].morphs.influences[i+1] = morphs[i];
          }
          console.log("after set morphs 1");

          for (i=0; i<garments[1].morphs.length; i++) {
            var morphs =garments[1].morphs;
            models[1].morphs.influences[i+1] = morphs[i];
          }

          for (i=0; i<garments[2].morphs.length; i++) {
            var morphs =garments[2].morphs;
            models[2].morphs.influences[i+1] = morphs[i];
          }

          for (i=0; i<garments[3].morphs.length; i++) {
            var morphs =garments[3].morphs;
            models[3].morphs.influences[i+1] = morphs[i];
          }

          for (i=0; i<garments[4].morphs.length; i++) {
            var morphs =garments[4].morphs;
            models[4].morphs.influences[i+1] = morphs[i];
          }

          for (i=0; i<garments[5].morphs.length; i++) {
            var morphs =garments[5].morphs;
            models[5].morphs.influences[i+1] = morphs[i];
          }
          console.log("after set morphs");
          //this.look.setGarments(models);
          callback();
          console.log("after set callback");
        }.bind(this))
        .fail(function(e) { console.log(e); });
      } else {
        Q.all([
          Model.load(this.garmentFiles[0])
        ])
        .then(function(models) {
          for (i=0; i<garments[0].morphs.length; i++) {
            var morphs =garments[0].morphs;
            models[0].morphs.influences[i+1] = morphs[i];
          }
          this.look.setGarments(models);
        }.bind(this))
        .fail(function(e) { console.log(e); });

      }


      }.bind(this))
      .fail(function(e) { console.log(e); });   

    },
    draw: function() {

      glu.clearColorAndDepth(this.bgColor);
      glu.enableDepthReadAndWrite(true);

      this.look.draw(this.camera);
      if (this.shapeActive==true) {
        //this.currentShape.draw(this.camera);
      }

      if(this.userShape == true) {
        //console.log(this.shapeInstances);
       // if(this.shapeInstances[this.activeGarments[0]].length>0){
          this.shapeMesh.drawInstances(this.camera, this.shapeInstances[this.activeGarments[0]]);
       // }
        if(this.activeGarments.length>1 && this.shapeInstances[this.activeGarments[1]].length>0){
          this.shapeMesh.drawInstances(this.camera, this.shapeInstances[this.activeGarments[1]]);
        }
      }
      
      this.gui.draw();
    },
    changeShape: function(shape) {
      this.shapeType = shape;
      if(this.shapeType=='sphere'){
        this.shapeMesh = new Mesh(new Sphere(.7,8,8), this.shapeMaterial);
        this.currentShape = new Mesh(new Sphere(.7,8,8), this.previewMaterial);

        //this.loadShapes();
      }else if (this.shapeType == 'cube') {
        this.shapeMesh = new Mesh(new Cube(1,1,1), this.shapeMaterial);
        this.currentShape = new Mesh(new Cube(1,1,1), this.previewMaterial);

        //this.loadShapes();
      } else {
        var shapeRotation = Quat.fromAxisAngle(new Vec3(1, 0, 0), 90);
          if (shape == 'Plane_01') {
            shapeRotation = Quat.fromAxisAngle(new Vec3(1, 0, 0), 60);
          }
        ObjReader.load( '/assets/shapes/jody/' + shape + '.obj', function(g) {
          var bbox = BoundingBox.fromPoints(g.vertices);
          var scale = 1;
          if (bbox.getSize().x > 10) scale = 0.01;
          g.vertices.forEach(function(v) {
            v.scale(scale);
            v.transformQuat(shapeRotation);
          });
          var newShape = new Mesh(g, this.shapeMaterial);
          this.shapeMesh = newShape;
          this.currentShape = newShape;

          //this.loadShapes();
       }.bind(this));
        console.log("currentShape: " +this.currentShape);
     }


    },
    setRandom: function(state) {
      this.randomSize = state;
    },
    setSize: function(size) {
      this.shapeSize = size;
      this.look.setShapeScale(this.shapeSize);
    },
    setRotation: function(angle) {
      var rot = angle/180 * Math.PI;
      rot += Math.PI/2; //angle = 0' is on the right, we want to start from front
      this.camera.setPosition(new Vec3(
        15 * Math.cos(rot),
        -2,
        15 * Math.sin(rot)
      ));
    },
    getLook: function() {
      return this.look;
    },
    getData: function() {
      var object = {};
      if(this.userShape) {
        object.shapes = this.shapeInstances[this.activeGarments[0]];
        if (this.activeGarments.length>1) {
          object.shapes = object.shapes.concat(this.shapeInstances[this.activeGarments[1]]);
        }
      } else {
        object.shapes = this.look.shapeInstances;
      }
      object.garments = [];
      for (i=0; i<this.garments.length; i++) {
        var g = this.garments[i];
        object.garments.push({
          name: g.name,
          morphs: g.morphs
        });
      }

      return object;
    },
    loadTexture: function(imageurl){
      this.pattern = Texture2D.load(imageurl);
    },
    setShapes: function(shapes) {
      this.shapeInstances = shapes;
    },
    clearShapes: function() {
      this.shapeInstances= [];
    },
    undo: function() {
      this.shapeInstances = this.shapeInstances.slice(0, this.shapeInstances.length-1);
    },
    getShapes: function() {
      return this.shapeInstances;
    },
    generateShapes: function(name) {
      if (name == 'user') {
        this.userShape = true;
        this.look.setShapePlacement(name);
      } else {
        this.userShape = false;
        this.look.setShapePlacement(name);
        this.look.setShapeScale(this.shapeSize);
        this.look.setShape(this.shapeMesh);
      }
      
    },
    loadShapes: function() {

      console.log(this.shapeMesh);
      var newShape = this.shapeMesh;
      
      for (var i=0; i<garments.length; i++) {
        var shapes = garments[i].shapes;
        var shapeArray = [];
        for (var a=0; a<shapes.length; a++) {
            var shape = shapes[a];
            newShape.position= new Vec3(shape.position.x, shape.position.y, shape.position.z);
            if(shape.rotation){
              newShape.rotation= new Quat(shape.rotation.x, shape.rotation.y, shape.rotation.z, shape.rotation.w);
            }
            newShape.scale = new Vec3(shape.scale.x, shape.scale.y, shape.scale.z);
            shapeArray.push({
              position: newShape.position,
              rotation: newShape.rotation,
              scale: newShape.scale
            });
        }
        console.log('shapeArray');
        console.log(shapeArray);
        //this.shapeInstances[i] = shapeArray;
        this.shapeInstances.push(shapeArray);
        console.log(this.shapeInstances[i]);
      }

      
    },
    addShape: function(index, shape) {

      var newShape = this.shapeMesh;
      console.log(newShape);

      newShape.position= new Vec3(shape.position.x, shape.position.y, shape.position.z);
      newShape.rotation= new Quat(shape.rotation.x, shape.rotation.y, shape.rotation.z, shape.rotation.w);
      newShape.scale = new Vec3(shape.scale.x, shape.scale.y, shape.scale.z);

      var shapeArray = [];

      shapeArray.push({
        position: newShape.position,
        rotation: newShape.rotation,
        scale: newShape.scale
      });

      this.shapeInstances[index] = shapeArray;
    },
    preloadTexture: function(patternurl) {
      this.pattern = Texture2D.load(patternurl);
    },
    preloadTextures: function(pattern1, pattern2) {
      this.patterns[pattern1] = Texture2D.load(pattern1);
      this.patterns[pattern2] = Texture2D.load(pattern2);
    },
    preloadMatCaps: function(maturl1, maturl2) {
      this.matcaps[maturl1] = Texture2D.load(maturl1);
      this.matcaps[maturl2] = Texture2D.load(maturl2);
      //console.log(this.matcaps);
    },
    setGarments: function(index1, index2) {
      if (index2) {
        this.look.setGarments([this.garmentModels[index1], this.garmentModels[index2]]);
        this.activeGarments= [index1, index2];
      } else {
        this.look.setGarments([this.garmentModels[index1]]);
        this.activeGarments= [index1];
      }
      
    },
    setGarmentMaterial: function(index, hsl, patternurl, maturl, scale, lights ) {
      var newmaterial = new UberMaterial({
        skinned: false,
        correctGamma: false,
        showNormals: false,
        color: Color.White, 
        tintColor: Color.fromHSL(hsl[0],hsl[1],hsl[2], 1),
        fakeLights: lights,
        matCapTexture: maturl ? this.matcaps[maturl] : null,
        triPlanarTexture: patternurl ? this.patterns[patternurl] : null,
        triPlanarScale: scale ? (1/(scale+4)) : .2,
        roughness: 1,
      });
      this.garmentMaterials[index].program.dispose();
      this.garmentMaterials[index] = newmaterial;
      this.look.setGarmentMaterial(index, this.garmentMaterials[index]);
    },
    setShapeMaterial: function(hsl, patternurl, maturl, scale, lights) {
      var newmaterial = new UberMaterial({
        skinned: false,
        correctGamma: false,
        showNormals: false,
        color: Color.White, 
        tintColor: Color.fromHSL(hsl[0],hsl[1],hsl[2], 1),
        fakeLights: lights,
        matCapTexture: maturl ? this.matcaps[maturl] : null,
        triPlanarTexture: patternurl ? this.patterns[patternurl] : null,
        triPlanarScale: scale,
        roughness: 1,
      });
      this.shapeMaterial = newmaterial;
      this.look.shapeMaterial = this.shapeMaterial;

      this.shapeMesh.setMaterial(this.shapeMaterial);
      this.look.shapeModel.setMaterial(this.shapeMaterial);
    },
    setColor: function(hsl) {
      this.shapeMaterial.uniforms.color = Color.fromHSL(hsl[0],hsl[1],hsl[2], 0.5);
      this.shapeMaterial.uniforms.tintColor = Color.fromHSL(hsl[0],hsl[1],hsl[2], 1);
      this.look.shapeMaterial = this.shapeMaterial;

      this.look.garmentMaterial.uniforms.color = Color.fromHSL(hsl[0],hsl[1],hsl[2], 0.5);
      this.look.garmentMaterial.uniforms.tintColor = Color.fromHSL(hsl[0],hsl[1],hsl[2], 1);
    },
    setMatCap: function(index, url) {
      this.garmentMaterials[index].uniforms.matCapTexture.dispose();
      this.garmentMaterials[index].uniforms.matCapTexture= Texture2D.load(url);;
    },
    setImage: function(url) {
      setMaterialImage(this.shapeMaterial, url);
      setMaterialImage(this.look.garmentMaterial, url);
      this.look.shapeMaterial = this.shapeMaterial;
    },
    setMorphs: function(index, morphs) {
      for (i=0; i<morphs.length; i++) {
        this.garmentModels[index].morphs.influences[i+1] = morphs[i];
      }
       
    }

  }
}
function setMaterialImage(material,url) {
      if (url !="") {
        material.uniforms.texture = Texture2D.load(url);
        material.uniforms.useTexture = true;
      }
      else {
        if (material.uniforms.texture) {
          material.uniforms.texture.dispose();
          material.uniforms.texture = null;
        }
        material.uniforms.useTexture = false;
      }
}

function setMaterialType(material, type) {
  switch(type) {
        case 'flat':
          material.uniforms.useDiffuse = false;
          material.uniforms.usePhong = false;
          break;
        case 'matte':
          material.uniforms.useDiffuse = true;
          material.uniforms.usePhong = false;
          break;
        case 'glossy':
          material.uniforms.useDiffuse = true;
          material.uniforms.usePhong = true;
          break;
      }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16)/255,
    g: parseInt(result[2], 16)/255,
    b: parseInt(result[3], 16)/255
  } : null;
}

if (Platform.isPlask) {
  var view = init(null, 0, 0, '../server/public/assets/models/female_walking_lowpoly.js', '../server/public/assets/models/womens_dress.js');
  sys.Window.create(view);
}
else if (Platform.isBrowser) {
  //define reusable class
  window.Rose = function(canvasId, body, gender, garments, shape, callback) {
    var canvas = document.getElementById(canvasId);
    var view = init(canvas, canvas.clientWidth, canvas.clientHeight, body, gender, garments, shape, callback);
    sys.Window.create(view);

    canvas.style.backgroundColor = 'transparent';

    this.changeShape = view.changeShape.bind(view);
    this.setRandom = view.setRandom.bind(view);
    this.setSize = view.setSize.bind(view);
    this.setRotation = view.setRotation.bind(view);
    this.clearShapes = view.clearShapes.bind(view);
    this.getShapes = view.getShapes.bind(view);
    this.setShapes = view.setShapes.bind(view);
    this.generateShapes = view.generateShapes.bind(view);
    this.undo = view.undo.bind(view);
    this.addShape = view.addShape.bind(view);
    this.setGarments = view.setGarments.bind(view);
    this.setGarmentMaterial = view.setGarmentMaterial.bind(view);
    this.setShapeMaterial = view.setShapeMaterial.bind(view);
    this.setColor = view.setColor.bind(view);
    this.setMorphs = view.setMorphs.bind(view);
    this.setImage = view.setImage.bind(view);
    this.preloadTexture = view.preloadTexture.bind(view);
    this.preloadTextures = view.preloadTextures.bind(view);
    this.preloadMatCaps = view.preloadMatCaps.bind(view);
    this.getData = view.getData.bind(view);
    this.getView = function() { return view; };
   // this.setMaterial = view.setMaterial.bind(view);
   // this.setImage = view.setImage.bind(view);
    this.setBGColor = function(color) {
      canvas.style.backgroundColor = color;
    }
  }
}