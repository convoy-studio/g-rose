var urlParams;
var ASSETS_URL = '/assets/'; 

(window.onpopstate = function () {
  var match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1);

  urlParams = {};
  while (match = search.exec(query))
     urlParams[decode(match[1])] = decode(match[2]);
})();
var designer = urlParams.designer;

var bodyFile;

var Rose1;
var collection, materials;
var garmentIndex = 0;

var dataURL = "/api/user/collection";
if(designer) {
  dataURL = "/api/user/collection?designer="+designer;
}


$.get( dataURL, function( data ) {
  collection = data;
  materials = collection.materials;
  //console.log(collection);
  
  if (collection.gender == 'male') {
    bodyFile = ASSETS_URL + 'male/male_model_new.js';
    Rose1 = new Rose("view", bodyFile,collection.gender, collection.garments, collection.shapeType, firstGarmentMale);
    currentGarments = [collection.garments[0], collection.garments[collection.garments.length-1]];
  } else {
    bodyFile = ASSETS_URL + 'female/female_model_new.js';
    Rose1 = new Rose("view", bodyFile,collection.gender, collection.garments, collection.shapeType, firstGarmentFemale);
    currentGarments = [collection.garments[0]];

  }

  Rose1.preloadTexture(collection.materials[2].image);
  Rose1.preloadMatCaps(collection.materials[0].image, collection.materials[1].image);
  

  makeGeneration1();

  
});

function firstGarmentFemale() {
  Rose1.setGarments(0);
  setTimeout(function(){makeInstance(generation1, 0)}, 400);
}
function firstGarmentMale() {
  Rose1.setGarments(0,3);
  setTimeout(function(){makeInstance(generation1, 0)}, 400);
}

//var shapeInstances = ["user", "vertices","random","heavyTop","heavyBottom"];
var shapeInstances = ["user", "vertices","random","heavyTop"];

//for (i=0; i<instances.length; i++) {
  //setTimeout(function(){makeInstance(i)}, 500);
//}
var generation1 = [];
var generations =[];
var currentGeneration = [];
var selectedLooks = [];
var variant = {};
var Color = net.brehaut.Color;
var generationIndex = 0;
var totalCount = 16;
var count =0;
var currentGarments = [];
/*
generation1.push({
  color: materials[0].color,
  materialType: materials[0].materialType,
  shapePlacement: instances[0]
});

*/   
function formatC(HSL) {
  var color = [];
  color[0] = HSL.hue/360;
  color[1] = HSL.saturation;
  color[2] = HSL.lightness;

  return color;
}

function makeGeneration1() {
  $("#roseButton").hide();

  var color1 = Color(materials[0].colorHex);
  var color2 = Color(materials[1].colorHex);
  //console.log(color1);
  var blend = color1.blend(color2, .5);
  //var triad = color1.triadicScheme();
  //var gen1 = color1.analogousScheme();
  var gen1 = color1.schemeFromDegrees([0,15,30,60,90]);
  //console.log(gen1[0].toHSL());
  var gen2 = color2.schemeFromDegrees([0,15,30,60]);

  
  var colors = [ formatC(gen1[0].toHSL()), [0,0,1], formatC(gen1[1].toHSL()), formatC(gen1[2].toHSL()), formatC(gen2[0].toHSL()), formatC(gen2[1].toHSL()), formatC(gen2[2].toHSL())];
  var colorsHex = [gen1[0].toString(), "#FFFFFF", gen1[1].toString(), gen1[2].toString(), gen2[0].toString(), gen2[1].toString(), gen2[2].toString(), gen2[2].toString()];
  //console.log(colorsHex);
  var b=0;

    //for (a=0; a< shapeInstances.length; a++) {
      //for (i=0; i<colors.length; i++){
      for(i=0; i<3; i++) {
        //for (b=0; b<materials.length-1; b++) {
          generation1.push(variant ={
            colors: [colors[b%colors.length], colors[b%colors.length]],
            colorsHex: [colorsHex[b%colors.length], colorsHex[b%colors.length]],
            shapeColor: colors[b%colors.length],
            materialType: materials[b%2].materialType,
            shapePlacement: shapeInstances[b%4],
            matcap: materials[i%2].image,
            shapeMatcap: materials[b%2].image,
            pattern: null,
            patternScale: 1,
            shapePattern: null,
            shapePatternScale: 1
          });
          b++;
        //}
        //for (b=0; b<materials.length-2; b++) {
          
          generation1.push(variant ={
            colors: [colors[b%colors.length],colors[b%colors.length]],
            colorsHex: [colorsHex[b%colors.length], colorsHex[b%colors.length]],
            shapeColor: colors[b%colors.length],
            materialType: materials[b%2].materialType,
            shapePlacement: shapeInstances[b%4],
            matcap: materials[i%2].image,
            shapeMatcap: null,
            pattern: materials[2].image,
            patternScale: 1,
            shapePattern: materials[2].image,
            shapePatternScale: 1
          });
          b++;
        //}
       }
    //}

  }

      


function makeInstance(instances, index) {
    var look ={};
    look.gender = collection.gender;
    look.garments = currentGarments;
    look.shapeType = collection.shapeType;
    look.colors = instances[index].colors;
    look.colorsHex = instances[index].colorsHex;
    look.shapeColor = instances[index].shapeColor;
    //look.materialType = instances[index].materialType;
    look.matcap = instances[index].matcap;
    look.pattern = instances[index].pattern;
    look.patternScale = instances[index].patternScale;
    look.shapeMatcap = instances[index].shapeMatcap;
    look.shapePattern = instances[index].shapePattern;
    look.shapePatternScale = instances[index].shapePatternScale;
    look.shapePlacement = instances[index].shapePlacement;
    look.garmentIndex = garmentIndex;

    setTimeout(function(){
      if (generationIndex == 3) {
        Rose1.getView().getLook().setShapeScale(1.7);
      }
      if (generationIndex == 4) {
        Rose1.getView().getLook().setShapeScale(2.5);
      }
      
      Rose1.generateShapes(instances[index].shapePlacement);

      var lights = false;
      if(instances[index].pattern) {
        lights = true;
      }
      //console.log(instances[index]);
      Rose1.setGarmentMaterial(0, instances[index].colors[0], instances[index].pattern, instances[index].matcap, instances[index].patternScale, lights);

      if(garmentIndex>0 || collection.gender == 'male') {
        Rose1.setGarmentMaterial(1, instances[index].colors[1], instances[index].pattern,instances[index].matcap, instances[index].patternScale,lights);
      }
      
      var shapelights = false;
      if(instances[index].shapePattern) {
        shapelights = true;
      }

      Rose1.setShapeMaterial(instances[index].shapeColor, instances[index].shapePattern,instances[index].shapeMatcap, instances[index].shapePatternScale, shapelights);


      look.shapes = Rose1.getData().shapes;
      //look.garments = Rose1.getData().garments;
      
    },50);

    setTimeout(function(){
      currentGeneration.push(look);
      makeRender("gen"+generationIndex,currentGeneration.length-1, garmentIndex); 
      count++;

      if (count<totalCount) {
       
        if (index==instances.length-1 || count == Math.ceil(totalCount*2/3)) {
          garmentIndex++;
          if (garmentIndex<collection.garments.length-1) {
            nextGarment(instances, garmentIndex);
          } 
        } else {
         
          setTimeout(function(){makeInstance(instances, index+1);}, 250);
       }

      } else {
        console.log("ROSE finished");
        makeFlip('flip'+generationIndex);
        hideLoading();
        $("#gen"+generationIndex).show();
         $("#roseButton").show();
          generations.push(currentGeneration);
          $("#progress-notice").html("ROSE Finished");
          //$("#viewport").hide();
        
      }

    },100);
    
  }

function nextGarment(generation, index) {
    if (generationIndex == 3) {
      scaleShapes(collection.garments[index].shapes,1.2);
    }
    if (generationIndex == 4) {
      scaleShapes(collection.garments[index].shapes,1.2);
    }

  var garmentFile = ASSETS_URL+ collection.gender + '/'+ collection.garments[index].name;
  //Rose1 = new Rose("view", bodyFile , collection.gender, [collection.garments[index], collection.garments[collection.garments.length-1]], collection.shapeType);
  Rose1.setGarments(index, 3);
  currentGarments = [collection.garments[index], collection.garments[collection.garments.length-1]];

  setTimeout(function(){makeInstance(generation,0)}, 400);

}

function RoseClick() {
  //if ($("#gen"+generationIndex+" .active").length == 2) {
  if (currentSelected == 2) {
    //saveRender($("#selections img").eq(generationIndex*2).attr('src'), generationIndex*2);
    //saveRender($("#selections img").eq(generationIndex*2+1).attr('src'), generationIndex*2+1);
    nextGeneration();
  }
}

function nextGeneration() {
  if (generationIndex<4) {
    showLoading();
  } else {
    $('keepButton').hide();
  }
  
  currentSelected = 0;
  totalCount = 15;
  count=0;
  $("#roseButton").hide();
  currentGeneration = [];
  $("#gen"+generationIndex).hide();
  $("#flip"+generationIndex).hide();
  
  garmentIndex=0;
  var id1 = $("#gen"+generationIndex+" .active").first().attr("data-id");
  var id2 = $("#gen"+generationIndex+" .active").last().attr("data-id");

  console.log(id1);
  console.log(id2);
  console.log(generationIndex);
  var look1 = generations[generationIndex][id1];
  var look2 = generations[generationIndex][id2];
  selectedLooks.push(look1);
  selectedLooks.push(look2);


  generationIndex++;
  setTimeout(function(){Generate(look1, look2)}, 100);
}

function Generate(look1, look2) {
      var color1 = Color(look1.colorsHex[0]);
      var color2 = Color(look2.colorsHex[0]);

      var blend1, blend2;
      console.log("look1: "+color1);
      console.log("look2: "+color2);

        blend1 = color1.schemeFromDegrees([0,15,30,60]);
        blend2 = color2.schemeFromDegrees([0,15,30,60]);

      if(color1 == "#FFFFFF") {
        console.log("color1 is white");
        tmpColor = Color(materials[0].colorHex);
        blend1 = color1.blend(tmpColor, .5).schemeFromDegrees([0,15,30,60]);
      }
      if(color2 == "#FFFFFF") {
        console.log("color2 is white");
        blend2 = color2.blend(color1, .5).schemeFromDegrees([0,15,30,60]);
      }

      var avgScale = (look1.patternScale+look2.patternScale)/2;
      var gen = [];

  if (generationIndex == 1) {
      gen.push(variant ={
        colors: [look2.colors[0],look2.colors[0]],
        colorsHex: [look2.colorsHex[0],look2.colorsHex[0]],
        shapeColor: formatC(blend2[1].toHSL()),
        materialType: look2.materialType,
        shapePlacement: look1.shapePlacement,
        matcap: look2.matcap,
        shapeMatcap: look2.matcap,
        pattern: look2.pattern,
        shapePattern: look2.shapePattern,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });
      gen.push(variant ={
        colors: [look1.colors[0],look1.colors[0]],
        colorsHex: [look1.colorsHex[0],look1.colorsHex[0]],
        shapeColor: look2.colors[0],
        materialType: look2.materialType,
        matcap: look2.matcap,
        shapeMatcap: look2.matcap,
        shapePlacement: look2.shapePlacement,
        pattern: materials[2].image,
        shapePattern: materials[2].image,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });

      gen.push(variant ={
        colors: [formatC(blend1[1].toHSL()), formatC(blend1[1].toHSL())],
        colorsHex: [blend1[1].toString(),blend1[1].toString()],
        shapeColor: formatC(blend1[2].toHSL()),
        materialType: look1.materialType,
        matcap: look1.matcap,
        shapeMatcap: null,
        shapePlacement: look2.shapePlacement,
        pattern: look1.pattern,
        shapePattern: look1.pattern,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });
      gen.push(variant ={
        colors: [formatC(blend1[2].toHSL()), formatC(blend1[2].toHSL()) ],
        colorsHex: [blend1[2].toString(),blend1[2].toString()],
        shapeColor: formatC(blend1[3].toHSL()),
        materialType: look2.materialType,
        matcap: materials[1].image,
        shapeMatcap: look1.matcap,
        shapePlacement: "random",
        pattern: look1.pattern,
        shapePattern: look1.pattern,
        shapeMatcap: look1.matcap,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });
      if (look2.shapePlacement == "random") {
        gen[3].shapePlacement = "heavyTop";
      }
      if(look1.pattern == look2.pattern) {
        gen[3].pattern = null;
      }
      if(look1.matcap == materials[1].image) {
        gen[3].matcap = materials[0].image;
      }

      gen.push(variant ={
        colors: [formatC(blend2[3].toHSL()), formatC(blend2[3].toHSL())],
        colorsHex: [blend2[3].toString(),blend2[3].toString()],
        shapeColor: formatC(blend2[3].toHSL()),
        materialType: look2.materialType,
        matcap: look1.matcap,
        shapeMatcap: look2.matcap,
        shapePlacement: "user",
        pattern: look2.pattern,
        shapePattern: look2.pattern,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });
  }
  if (generationIndex == 2 || generationIndex == 3) {
      gen.push(variant ={
        colors: [look2.colors[0],look1.colors[0]],
        colorsHex: [look2.colorsHex[0],look1.colorsHex[0]],
        shapeColor: look2.colors[0],
        materialType: look2.materialType,
        matcap: look1.matcap,
        shapeMatcap: look2.shapeMatcap,
        shapePlacement: look1.shapePlacement,
        pattern: look2.pattern,
        shapePattern: look1.shapePattern,
        patternScale: look1.patternScale,
        shapePatternScale: 1
      });
      gen.push(variant ={
        colors: [look1.colors[0],look2.colors[0]],
        colorsHex: [look1.colorsHex[0],look2.colorsHex[0]],
        shapeColor: look1.colors[1],
        materialType: look2.materialType,
        matcap: look2.matcap,
        shapeMatcap: look1.matcap,
        shapePlacement: look2.shapePlacement,
        pattern: materials[2].image,
        shapePattern: look1.shapePattern,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });

      gen.push(variant ={
        colors: [formatC(blend1[1].toHSL()),look1.colors[0]],
        colorsHex: [blend1[1].toString(),look1.colorsHex[0]],
        shapeColor: formatC(blend1[2].toHSL()),
        materialType: look1.materialType,
        matcap: look1.matcap,
        shapeMatcap: look1.matcap,
        shapePlacement: look2.shapePlacement,
        pattern: null,
        shapePattern: look1.shapePattern,
        patternScale: look2.patternScale,
        shapePatternScale: 1
      });
      gen.push(variant ={
        colors: [formatC(blend2[2].toHSL()), look2.colors[0]],
        colorsHex: [blend2[2].toString(), look2.colorsHex[0]],
        shapeColor: formatC(blend1[2].toHSL()),
        materialType: look2.materialType,
        matcap: materials[0].image,
        shapeMatcap: materials[1].image,
        shapePlacement: "random",
        pattern: look1.pattern,
        shapePattern: materials[2].image,
        patternScale: avgScale,
        shapePatternScale: 1
      });
      if (look2.shapePlacement == "random") {
        gen[3].shapePlacement = "heavyTop";
      }
      if(look1.matcap == look2.matcap) {
        if(materials[0].image == look1.matcap) {
          gen[3].matcap = materials[1].image;
        } else {
          gen[3].matcap = materials[0].image;
        }
      }
      
      gen.push(variant ={
        colors: [formatC(blend1[1].toHSL()),formatC(blend1[2].toHSL())],
        colorsHex: [blend1[1].toString(), blend1[2].toString()],
        shapeColor: formatC(blend2[2].toHSL()),
        materialType: look2.materialType,
        matcap: look2.matcap,
        shapeMatcap: look1.matcap,
        shapePlacement: "user",
        pattern: look2.pattern,
        shapePattern:look1.shapePattern,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });
  }
  if (generationIndex == 4) {
      gen.push(variant ={
        colors: [look2.colors[0],look1.colors[0]],
        colorsHex: [look2.colorsHex[0],look1.colorsHex[0]],
        shapeColor: look2.colors[0],
        materialType: look2.materialType,
        matcap: materials[1].image,
        shapeMatcap: look2.shapeMatcap,
        shapePlacement: look1.shapePlacement,
        pattern: look2.pattern,
        shapePattern: look1.shapePattern,
        patternScale: look2.patternScale,
        shapePatternScale: .4
      });
      gen.push(variant ={
        colors: [look1.colors[0],look2.colors[0]],
        colorsHex: [look1.colorsHex[0],look2.colorsHex[0]],
        shapeColor: look1.colors[1],
        materialType: look2.materialType,
        matcap: materials[0].image,
        shapeMatcap: look1.matcap,
        shapePlacement: look2.shapePlacement,
        pattern: materials[2].image,
        shapePattern: look2.shapePattern,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 0.5
      });

      gen.push(variant ={
        colors: [formatC(blend1[1].toHSL()),look1.colors[0]],
        colorsHex: [blend1[1].toString(),look1.colorsHex[0]],
        shapeColor: formatC(blend1[2].toHSL()),
        materialType: look1.materialType,
        matcap: look1.matcap,
        shapeMatcap: look2.matcap,
        shapePlacement: look2.shapePlacement,
        pattern: null,
        shapePattern: look1.shapePattern,
        patternScale: look2.patternScale,
        shapePatternScale: 0.3
      });
      gen.push(variant ={
        colors: [formatC(blend2[2].toHSL()), look2.colors[0]],
        colorsHex: [blend2[2].toString(), look2.colorsHex[0]],
        shapeColor: formatC(blend1[2].toHSL()),
        materialType: look2.materialType,
        matcap: materials[0].image,
        shapeMatcap: materials[1].image,
        shapePlacement: "random",
        pattern: look1.pattern,
        shapePattern: materials[2].image,
        patternScale: avgScale,
        shapePatternScale: look1.patternScale
      });
      if (look2.shapePlacement == "random") {
        gen[3].shapePlacement = "heavyTop";
      }
      if(look1.matcap == look2.matcap) {
        if(materials[0].image == look1.matcap) {
          gen[3].matcap = materials[1].image;
        } else {
          gen[3].matcap = materials[0].image;
        }
      }
      
      gen.push(variant ={
        colors: [formatC(blend1[1].toHSL()),formatC(blend1[2].toHSL())],
        colorsHex: [blend1[1].toString(), blend1[2].toString()],
        shapeColor: formatC(blend2[1].toHSL()),
        materialType: look2.materialType,
        matcap: look2.matcap,
        shapeMatcap: look1.matcap,
        shapePlacement: "user",
        pattern: look2.pattern,
        shapePattern:look1.pattern,
        patternScale: (Math.random()*10)-5,
        shapePatternScale: 1
      });
  }


      if(generationIndex == 5) {
        //console.log(selectedLooks);
        saveLooks();
        $("#progress-notice").html("Now go to Runway view");
        $("#viewport").hide();
        moveRenders();

      } else {
        //console.log(gen);
        //Rose1 = new Rose("view", bodyFile,collection.gender, [collection.garments[0]], collection.shapeType);

        if (collection.gender == 'male') {
          //Rose1 = new Rose("view", bodyFile,collection.gender, [collection.garments[0], collection.garments[collection.garments.length-1]], collection.shapeType);
          currentGarments = [collection.garments[0], collection.garments[collection.garments.length-1]]
          Rose1.setGarments(0,3);
        } else {
          //Rose1 = new Rose("view", bodyFile,collection.gender, [collection.garments[0]], collection.shapeType);
          currentGarments = [collection.garments[0]];
          Rose1.setGarments(0);
        }

        setTimeout(function(){makeInstance(gen, 0)}, 250);
      }
      

    }

function showLoading() {
  $("#loading").show();
}
function hideLoading() {
  $("#loading").hide();

}

function saveRender(dataSet, num) {
  $.ajax ({
        url : "/look?num="+num,
        type: "POST",
        data: {data: dataSet.eq(num).attr('src')},
        success: function (data) {
          if (num<9) {
            num++;
            console.log("saved look " + num);
            saveRender(dataSet, num);
          }
        },
        error: function() {
            console.log("failed to save look " + num);
        }
    });
}

function saveLooks(){
  
  saveRender($("#selections img"), 0);
  
  //saveRender($("#selections img").eq(0).attr('src'), 0, saveRender($("#selections img").eq(1).attr('src'),1));

  var postData = JSON.stringify(selectedLooks);
  $.ajax ({
      url : "/looks",
      type: "POST",
      data: {data: postData},
      success: function (data) {
          //window.location = "";
          //console.log(data);
          console.log("now we go to the runway");
      },
      error: function() {
          console.log("failed to save looks");
      }
  });
}

function scaleShapes(shapes, value) {
  if (shapes) {
    for (i=0; i<shapes.length; i++) {
      var shape = shapes[i];
      shape.scale.x=shape.scale.x*value;
      shape.scale.y=shape.scale.y*value;
      shape.scale.z=shape.scale.z*value;
    }
  }
  
}
  /*
  var slider = document.getElementById('rotation');
  slider.addEventListener('input', function(e) {  
    var angle = slider.value;
    Rose1.setRotation(angle);
  });
*/
      

$(document).on('click', '.variant' , function() {
   // console.log($(this));

    if ($(this).hasClass('active')) {
      $(this).removeClass('active');
    } else {
      if ($("#gen"+generationIndex+" .active").length < 2) {
        $(this).addClass('active');
      }
    }

});

var selected;
var currentSelected = 0;

function selectLook() {
  if ($(this).hasClass('active')) {
      $(this).removeClass('active');
      var g = $(this).attr('data-generation');
      var i = $(this).attr('data-id');
      $("#selections .var_"+g+"-"+i).remove();
      $(".leftSidebar").append("<span class='placeholder'></span>");
    } else {
      if ($("#gen"+generationIndex+" .active").length < 2) {
        //$("#selections").append($(this)[0]);
        var img = document.createElement("img");
        selected = $(this)[0];
        img.src = selected.src;  
        img.setAttribute('data-id', selected.getAttribute('data-id'));
        img.setAttribute('data-generation', selected.getAttribute('data-generation'));
        img.setAttribute('data-garment', selected.getAttribute('data-garment'));
        img.setAttribute('class', 'variant');
        img.setAttribute('class', selected.classList[0]);
        document.getElementById("selections").appendChild(img);

        $(this).addClass('active');
        $(".placeholder").first().remove();
      }
    }
    //console.log(selected);
}

$("#keepButton").click( function(){
  if(currentSelected < 2) {
    selected = $('.flip-current')[generationIndex];
    $('#gen'+generationIndex+' .flip-current').addClass('active');
    console.log(selected);

    var img = document.createElement("img");
    img.src = selected.src;  
    img.setAttribute('data-id', selected.getAttribute('data-id'));
    img.setAttribute('data-generation', selected.getAttribute('data-generation'));
    img.setAttribute('data-garment', selected.getAttribute('data-garment'));
    img.setAttribute('class', 'variant');
    img.setAttribute('class', selected.classList[0]);
    document.getElementById("selections").appendChild(img);
    currentSelected++;

    $(".placeholder").first().remove();
  }
  
});

function moveRenders() {
  $("#selections img").each(function(){
    $("#finalCollection").append($(this).clone());
  });
  $("#leftColumn").toggle('slide');
  $("#finalCollection").slideDown();
  $("#finalButtons").fadeIn('slow');
}



function makeRender(elementId, id, garmentId) {
  var canvas = document.getElementById("view");
  if (canvas.getContext) {
   var ctx = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});                
   var myImage = canvas.toDataURL();  
   var img = document.createElement("img");
    img.src = myImage;  
    img.setAttribute('data-id', id);
    img.setAttribute('data-generation', generationIndex);
    img.setAttribute('data-garment', garmentId);
    img.setAttribute('class', 'variant');
    img.setAttribute('class', 'var_'+generationIndex+"-"+id);
    document.getElementById(elementId).appendChild(img);   

      //$(img).click(selectLook);
  }
                          
}

function makeFlip (id) {
  $("#"+id).flipster({
      itemContainer:      'div', // Container for the flippin' items.
      itemSelector:       'img', // Selector for children of itemContainer to flip
      style:              'coverflow', // Switch between 'coverflow' or 'carousel' display styles
      start:              3, // Starting item. Set to 0 to start at the first, 'center' to start in the middle or the index of the item you want to start with.
      
      enableKeyboard:     true, // Enable left/right arrow navigation
      enableMousewheel:   false, // Enable scrollwheel navigation (up = left, down = right)
      enableTouch:        true, // Enable swipe navigation for touch devices
      
      enableNav:          false, // If true, flipster will insert an unordered list of the slides
      enableNavButtons:   true, // If true, flipster will insert Previous / Next buttons
      
      onItemSwitch:       function(){}, // Callback function when items are switches
    });
}