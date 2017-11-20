var container, stats;

var camera, scene, renderer;
var width = $("#viewer").width();
var height= $("#viewer").height();

var geometry, objects;
var material, meshOutline, shader1, shader2, light;


var geometry, mesh, body;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var mousePressed = false;
var mouseX = 0, mouseY = 0;
var mousex = 0, mousey= 0, pmousex= 0, pmousey= 0, dx= 0, dy= 0;
	dx = getPositionLeft(document.getElementById("container")) - 5;
	dy = getPositionTop(document.getElementById("container")) - 5;

var yamt = 0, xamt = 0;

var garmentMaterial;
var bodyMaterial;
var greyMaterial;

var femaleDress, femaleShirt, femalePants, femaleCoat, femaleGown;
var malePants, maleShirt, maleCollarShirt, maleCoat, maleSleeveless;



document.onmousedown = function() {
mousePressed = true;
}
document.onmouseup = function() {
mousePressed = false;
}

function init() {

	container = document.getElementById( 'viewer' );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 45, width / height, 1, 15000 );
	camera.position.z = 200;
	scene.add( camera );
	

	var ambient = new THREE.AmbientLight(0x0C0C0C);
	scene.add(ambient);


	var directionalLight = new THREE.DirectionalLight(0xD6D6D6);
	directionalLight.position.set(70, 50, 100);
	scene.add(directionalLight);

	var directionalLight2 = new THREE.DirectionalLight(0x8C8C8C);
	directionalLight2.position.set(-70, 50, 100);
	scene.add(directionalLight2);
	
	//garmentMaterial = new THREE.MeshLambertMaterial( { color: 0x202020, morphTargets: true, side: THREE.DoubleSide} );
	
garmentMaterial = new THREE.MeshPhongMaterial( { 
    color: 0x202020, 
    ambient: 0x202020, // should generally match color
    specular: 0x050505,
    shininess: 100,
    morphTargets: true,
    side: THREE.DoubleSide
} ); 

  bodyMaterial = new THREE.MeshPhongMaterial( { 
    color: 0xC9C9C9, 
    ambient: 0x996633, // should generally match color
    specular: 0x050505,
    shininess: 100
} ); 


	//bodyMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, morphTargets: false, side: THREE.DoubleSide} );
	
	greyMaterial =  new THREE.MeshBasicMaterial({ color: 0xFFFFFF, morphTargets: true, shading: THREE.FlatShading, wireframe: true, wireframeLinewidth:1.5, opacity:0.3, transparent: true });

  var femaleURL = "/assets/female/";
  var maleURL = "/assets/male/";

  femaleDress = loadFile(femaleURL+"femaleDress.js");
  femalePants = loadFile(femaleURL+"femalePants.js");
  femaleShirt = loadFile(femaleURL+"femaleShirt.js");
  femaleCoat = loadFile(femaleURL+"femaleCoat.js");


	var loader = new THREE.JSONLoader( true );
    var garmentMesh = "/assets/female/femaleDress.js";
    if (gender == "male") {
        garmentMesh = "/assets/male/malePants.js";
    } 

    loader.load( garmentMesh, function( geometry ) {

			mesh = new THREE.Mesh( geometry, garmentMaterial  );
			// mesh = THREE.SceneUtils.createMultiMaterialObject( geometry, [
      //    garmentMaterial,
      //    greyMaterial
      //]);
			
			mesh.scale.set( 9, 9, 9 );
      		mesh.position.y = 20;
			scene.add( mesh );
			//mesh.add( body );
    
	} );

	
	var loader2 = new THREE.JSONLoader( true );
    var bodymesh = "/assets/female/female_model_new2.js";
    if (gender == "male") {
        bodymesh = "/assets/male/male_model_new.js";
    } 
    loader2.load( bodymesh, function( geometry ) {

			body = new THREE.Mesh( geometry, bodyMaterial  );
			
			body.scale.set( 9, 9, 9 );
      body.position.y = 20;
			scene.add(body);
    
	} );
	
  renderer = new THREE.WebGLRenderer( {alpha: true});
  renderer.setClearColor( 0x000000, 0 ); // the default
	renderer.setSize( $("#viewer").width(), $("#viewer").height() );

	renderer.sortObjects = false;
	container.appendChild( renderer.domElement );
	
	container.onmousemove = function(event) {
		if (mousePressed){
			pmousex = mousex;
			pmousey = mousey;

			mousex = event.pageX - dx;
			mousey = event.pageY - dy;
			ease = 0.9;
		if (mousex-pmousex>0){
			yamt = .1;
		} else {
			yamt = -.1;
		}

		if (mousey-pmousey>0){
			xamt = .02;
		} else {
			xamt = -.02;
		}

		if (Math.abs(mousey-pmousey) > Math.abs(mousex-pmousex)) {
			mesh.rotation.x += xamt;
			body.rotation.x += xamt;
			//back.rotation.x += xamt;
		} else {
			mesh.rotation.y += yamt;
			body.rotation.y += yamt;
			//back.rotation.y += yamt;
		}

		}

	}

	container.onmouseup = function() {
		//var rot = ((garment.rotation.y+Math.PI)/(Math.PI*2)) *360;
		//$("#rotate-slider").slider('value', rot);
	}

	container.onmouseover = function(event) {
		mouseIsOver = true;
	}

	container.onmouseout = function(event) {
		mouseIsOver = false;
	}

}

function loadFile(filename) {
  var loader = new THREE.JSONLoader( true );
  var obj;

    loader.load( filename, function( geometry ) {

      obj = new THREE.Mesh( geometry, garmentMaterial  );
      
      obj.scale.set( 9, 9, 9 );
      obj.position.y = 20;

  } );

    return obj;
}


function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

	//mesh.rotation.y += 0.01;

	//mesh.morphTargetInfluences[ 0 ] = Math.sin( mesh.rotation.y ) * 0.5 + 0.5;

	//camera.position.x += ( mouseX - camera.position.x ) * .005;
	//camera.position.y += ( - mouseY - camera.position.y ) * .01;

	camera.lookAt( scene.position );

	renderer.render( scene, camera );

}

function changeGarment(filename) {
  var loader = new THREE.JSONLoader( true );
  scene.remove(mesh);
  var currRotX = mesh.rotation.x;
  var currRotY = mesh.rotation.y;

    loader.load( filename, function( geometry ) {

      mesh = new THREE.Mesh( geometry, garmentMaterial  );
      
      mesh.scale.set( 9, 9, 9 );
      mesh.position.y = 20;
      mesh.rotation.x = currRotX;
      mesh.rotation.y = currRotY;
      scene.add( mesh );
      updateMorph();
    
  } );
}

function getPositionLeft(This) {
	var el = This;
	var pL = 0;
	while(el) {
		pL += el.offsetLeft;
		el = el.offsetParent;
	}
	return pL
}
function getPositionTop(This) {
	var el = This;
	var pT = 0;
	while(el) {
		pT += el.offsetTop;
		el = el.offsetParent;
	}
	return pT
}