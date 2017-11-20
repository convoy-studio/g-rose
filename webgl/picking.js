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

var s = geom.randomFloat(0.2, 1);

function init(canvas, canvasWidth, canvasHeight, body, garment, morphs) {
  return {
    settings: {
      width: canvasWidth || 1280 * DPI,
      height: canvasHeight || 720 * DPI,
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
      this.garments = [];
      this.shapes = [];
      this.animationEnabled= false;
      this.bodyIndex= 0;
      this.garmentIndex= 0;
      this.shapeInstances= [];
      this.randomSize = false;
      this.shapeSize = 1;
      this.mouseDown = false;
      this.shapeActive = false;
      this.bodyFile = body;
      this.garmentFile = garment
      this.shapeType = "sphere";
      this.bgColor = new Color(0, 0, 0, 0);
      this.materialType = 'flat';
      this.previewMaterial = new RoseMaterial({
        lightPos: new Vec3(10, 10, 10)
      });
      this.shapeMaterial = new RoseMaterial({lightPos: new Vec3(3, 3, 150), color: Color.create(.3, .3, .3, 1), useDiffuse: true});
      this.previewMaterial = new RoseMaterial({lightPos: new Vec3(0, 5, 5), color: Color.create(.2, .9, .9, .3)});

      this.look.shapeMaterial = this.shapeMaterial;

      this.shapeMesh = new Mesh(new Sphere(.7,8,8), this.shapeMaterial);
      
      this.currentShape = new Mesh(new Sphere(.7,8,8), this.previewMaterial);

      this.morphs = morphs;
      this.loadModels();

      this.on('leftMouseDown', this.onMouseDown.bind(this));
      this.on('leftMouseDown', this.onMouseMove.bind(this));
      this.on('leftMouseUp', this.onMouseUp.bind(this));
      this.on('mouseMoved', this.onMouseMove.bind(this));
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
    onMouseMove: function(e) {
      if (!this.look.garmentModel) return;

      var ray = this.camera.getWorldRay(e.x, e.y, this.width, this.height);
      var geometry = this.look.garmentModel.geometry;

      //don't do that every frame please!
      var triGeom = geometry.triangulate();
      triGeom.computeNormals();

      var triangles = triGeom.faces.map(function(f) {
        return new Triangle3(triGeom.vertices[f[0]], triGeom.vertices[f[1]], triGeom.vertices[f[2]])
      });
      var hits = [];
      triangles.forEach(function(triangle, triangleIndex) {
        var result = ray.hitTestTriangle(triangle);
        if (result.s || result.t) {
          var u = triangle.b.dup().sub(triangle.a);
          var v = triangle.c.dup().sub(triangle.a);
          var position = triangle.a.dup().add(u.dup().scale(result.s).add(v.dup().scale(result.t)));
          var normal = triGeom.normals[triGeom.faces[triangleIndex][0]];
          hits.push({
            triangle: triangle,
            position: position,
            normal: normal,
            faceIndex: triangleIndex, //HACK
            cameraDistance: triangle.a.distance(this.camera.getPosition()) //ok-ish
          });
        }
      }.bind(this));

      if (hits.length > 0) {
        //console.log(hits);
        //console.log(this.camera.position.z);
        this.shapeActive = true;
        var activeHit = hits[0];

        if (this.camera.position.z >0) {
          for(var i=0; i<hits.length; i++) {
            if (hits[i].position.z>0) {
              activeHit = hits[i];
            }
          }
        } else {
          for(var i=0; i<hits.length; i++) {
            if (hits[i].position.z<0) {
              activeHit = hits[i];
            }
          }
        }

        this.currentShape.position = activeHit.position;
        this.currentShape.rotation = Quat.fromDirection(hits[0].normal);
        if( this.randomSize == true) {
          this.currentShape.scale = new Vec3(s, s, s);
        } else {
          this.currentShape.scale = new Vec3(this.shapeSize, this.shapeSize, this.shapeSize);
        }

        //this.look.garmentModel.material.uniforms.color = Color.Yellow;

        hits.sort(function(a, b) {
          return a.cameraDistance - b.cameraDistance;
        });

        

      }
      else {
        this.shapeActive = false;
        //not intersecting with garment
      }
    },
    initGUI: function() {
      this.gui = new GUI(this);
    },
    initControls: function() {
      //this.camera = new PerspectiveCamera(120, this.width / this.height);
      this.camera = new PerspectiveCamera(60, this.width / this.height);
      this.camera.setTarget(new Vec3(0, -2, 0));
      this.camera.setPosition(new Vec3(0, -2, 15));
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

        Q.all([
          Model.load(this.garmentFile),
        ])
        .then(function(models) {
          this.look.setGarment(models[0]);
          this.garments = models;
          this.setMorphs(this.morphs);
        }.bind(this))
        .fail(function(e) { console.log(e); });
        }.bind(this))
        .fail(function(e) { console.log(e); });

      
    },
    draw: function() {

      glu.clearColorAndDepth(this.bgColor);
      glu.enableDepthReadAndWrite(true);

      this.look.draw(this.camera);
      if (this.shapeActive) {
        this.currentShape.draw(this.camera);
      }


      this.shapeMesh.drawInstances(this.camera, this.shapeInstances);
      this.gui.draw();
    },
    changeShape: function(shape) {
      this.shapeType = shape;
      if(this.shapeType=='sphere'){
        this.shapeMesh = new Mesh(new Sphere(.7,8,8), this.shapeMaterial);
        this.currentShape = new Mesh(new Sphere(.7,8,8), this.previewMaterial);
      }
      if (this.shapeType == 'cube') {
        this.shapeMesh = new Mesh(new Cube(1,1,1), this.shapeMaterial);
        this.currentShape = new Mesh(new Cube(1,1,1), this.previewMaterial);
      }
      if (this.shapeType == 'cone') {
        this.shapeMesh = new Mesh(new Tetrahedron(.7), this.shapeMaterial);
        this.currentShape = new Mesh(new Tetrahedron(.7), this.previewMaterial);

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
      this.look.setShapePlacement(name);
      this.look.setShapeScale(this.shapeSize);
      this.look.setShape(this.shapeMesh);


    },
    addShape: function(shape) {
      if(this.shapeType=='sphere'){
        var newShape = new Mesh(new Sphere(.7,8,8), this.shapeMaterial);
      }
      if (this.shapeType == 'cube') {
        var newShape = new Mesh(new Cube(1,1,1), this.shapeMaterial);
      }
      if (this.shapeType == 'cone') {
        var newShape = new Mesh(new Tetrahedron(.7), this.shapeMaterial);

      }
      newShape.position= new Vec3(shape.position.x, shape.position.y, shape.position.z);
      newShape.rotation= new Quat(shape.rotation.x, shape.rotation.y, shape.rotation.z, shape.rotation.w);
      newShape.scale = new Vec3(shape.scale.x, shape.scale.y, shape.scale.z);

      this.shapeInstances.push({
        position: newShape.position,
        rotation: newShape.rotation,
        scale: newShape.scale
      });
    },
    setMaterial: function(type) {
      this.materialType = type;
      setMaterialType(this.shapeMaterial, type);
      setMaterialType(this.garmentMaterial, type);
      this.look.shapeMaterial = this.shapeMaterial;
    }, 
    setColor: function(hex) {
      this.shapeMaterial.uniforms.color = hexToRgb(hex);
      this.garmentMaterial.uniforms.color = hexToRgb(hex);
      this.look.shapeMaterial = this.shapeMaterial;
    },
    setMorphs: function(morphs) {
      for (i=0; i<morphs.length; i++) {
        this.look.getGarment().morphTargetInfluences[i+1] = morphs[i];
      }

      
    }

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
  window.PickingView = function(canvasId, body, garment, morphs) {
    var canvas = document.getElementById(canvasId);
    var view = init(canvas, canvas.clientWidth, canvas.clientHeight, body, garment, morphs);
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
    this.setMaterial = view.setMaterial.bind(view);
    this.setColor = view.setColor.bind(view);
    this.setMorphs = view.setMorphs.bind(view);
    this.getView = function() { return view; };
   // this.setMaterial = view.setMaterial.bind(view);
   // this.setImage = view.setImage.bind(view);
    this.setBGColor = function(color) {
      canvas.style.backgroundColor = color;
    }
  }
}