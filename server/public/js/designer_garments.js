var ShapeNames = [ 'cone', 'cylinder', 'disc',  'icosahedron', 'octahedron', 'feather' ];

var femaleGarments = {
	full: [],
	top: [],
	bottom: []
};
femaleGarments.full.push({
	name: "femaleDress1",
	morphNames: ["Inflate", "Pleats", "Shoulders Inflate", "Neck Sharp", "Neck Triangular", "Neck Flower", "Sleeve Wing Back", "Sleeve Wing Side", "Skirt Shorten", "Skirt Loop", "Skirt Opening", "Shoulder Boxy"]
});
femaleGarments.full.push({
	name: "femaleDress2",
	morphNames: ["Inflate", "Pleats", "Shoulders Inflate", "Neck Sharp", "Neck Triangular", "Neck Flower", "Skirt Shorten", "Skirt Loop", "Skirt Opening", "Shoulder Boxy"]
});
femaleGarments.top.push({
	name: "femaleTop",
	morphNames: ["Sleeves Open", "Sleeves Shorten", "Boxy", "Hips Open", "Neck Square","Neck V", "Neck Open", "Neck Boxy", "Shoulders Boxy", "Shoulder Inflate"]
});
femaleGarments.top.push({
	name: "femaleSleeveless",
	morphNames: ["Boxy", "Hips Open", "Neck Square", "Neck V", "Neck Open", "Neck Boxy", "Shoulders Boxy", "Shoulder Inflate", "Shoulder Nude", "Breast Short"]
});
femaleGarments.bottom.push({
	name: "femaleSkirt",
	morphNames: ["Inflate", "Pleats", "Short Skirt", "Skirt Loop", "Skirt Opening"]
});
femaleGarments.bottom.push({
	name: "femaleSkirtLong",
	morphNames: ["Pleats", "Bottom Open", "Loops", "Inflate", "Boxy", "Shorten"]
});
femaleGarments.bottom.push({
	name: "femalePants2",
	morphNames: ["Blades", "Lower Middle", "Boxy", "Shorten", "Tightness"]
});


var Designers = {};

var malafacha = {
	full: [],
	top: [],
	bottom: []
};

malafacha.full.push({ 
	name: "malafachaDress",
	morphNames: ["Sleeves Wavy", "Sleeves Wavy Exteme", "Sleeves Wavy Smooth", "Sleeves Inner Wings", "Shoulder Wavy", "Dress Wavy", "Neck Opening", "Neck Length", "Dress Folding", "Dress Folding Bottle", "Skirt Shorten", "Dress Wings"]
});
malafacha.top.push({
	name: "malafachaShirt",
	morphNames: ["Sleeves Wavy","Shoulder Wavy", "Shoulder Inflate", "Neck Wavy", "Neck V", "Neck Pipe", "Belt Spikey", "Breat Pointy", "Wrist Inflate", "Sleeves Wavy Exteme"]
});
malafacha.bottom.push({
	name: "malafachaSkirt",
	morphNames: ["Side Length", "Side Wavy", "Shorten", "Side Wavy Exteme"]
});
malafacha.bottom.push({
	name: "malafachaPants",
	morphNames: ["Shorten", "Stretch", "Legs Wavy", "Legs Curvy"]
});
Designers.malafacha = malafacha;

var trista = {
	full: [],
	top: [],
	bottom: []
};
trista.full.push({
	name: "tristaDress1",
	morphNames: ["Cone", "Cube", "Sphere", "Tube Low", "Tube Breast", "Shoulder Square", "Sleeves Shorten", "Neck Square"]
});
trista.full.push({ 
	name: "tristaDress2",
	morphNames: ["Breast Extension", "Neck Extension", "Arm Reshape", "Long Skirt", "Back Extension", "Belly Reshape","Bigger Up", "Bigger Low", "Smaller Up", "Smaller Low" ]
});

trista.top.push({
	name: "tristaShirt",
	morphNames: ["Cone", "Pyramidal", "Cylindrical", "Neck Square", "Neck Extend", "Shoulder Square", "Sleeves Wide", "Sleeves Extend"]
});

trista.bottom.push({
	name: "tristaSkirt",
	morphNames: ["Cone Large", "Cylinder", "Pyramidal", "Trapese", "Wings", "Wing Curvy"]
});

Designers.trista = trista;

var juliayrenata = {
	full: [],
	top: [],
	bottom: []
};

juliayrenata.full.push({
	name: "juliayrenataDress",
	morphNames: ["Waistline Thicker", "Waistline Opening", "Waistline Length", "Shoulder Length", "Shoulders Boxy", "Shoulder Assymetric", "Neck Folding", "Neck Folding 2", "Neck Opening", "Dress Opening Top", "Extension Top", "Extension Lower", "Boxy Lower", "Shorten", "Belt Remove"]
});
juliayrenata.top.push({
	name: "juliayrenataShirt",
	morphNames: ["Line Extend", "Line Butterfly", "Cloak Out", "Cloak Crown", "Cloak Wings", "Cloack Small", "Neck Square", "Neck V", "Collar Classic", "Global V Shape", "Shoulder Extend", "Shoulder Boxy"]
});
juliayrenata.bottom.push({
	name: "juliayrenataSkirt",
	morphNames: ["Skirt Opening", "Top Extend", "Pleats", "Extend", "Assymetric", "Skirt Flaps", "Shorten"]
});
Designers.juliayrenata = juliayrenata;

var vanessa = {
	full: [],
	top: [],
	bottom: []
};

vanessa.full.push({
	name: "vanessaDress",
	morphNames: ["Spikes", "Flatten", "Sleeveless", "Shoulder Extend", "Neck Square", "Shorten 1", "Shorten 2"]
});

vanessa.top.push({
	name: "vanessaShirt",
	morphNames: ["Spikes", "Flatten", "Cone", "Shoulders Inflate", "Sleeves Shorten", "Neck Remove", "Neck Lengthen", "Skirt Lengthen"]
});
vanessa.bottom.push({
	name: "vanessaPants",
	morphNames: ["Shorten", "Tight", "Spikes", "Flat Wide", "Flatten"]
});
Designers.vanessa = vanessa;

var COM = {
	full: [],
	top: [],
	bottom: []
};
COM.full.push({
	name: "COM_snakes",
	morphNames: []
});
COM.full.push({
	name: "COM_wings",
	morphNames: ["Shorten", "Width", "Tight"]
	//morphNames: []
});
COM.top.push({
	name: "COM_shirt",
	morphNames: ["Neck V", "Neck Tight", "Sleeve Shorten", "Inflate", "Tighten"]
	//morphNames: []
});
COM.top.push({
	name: "COM_hoodie",
	morphNames: ["Hood On", "Hood Large", "V Neck", "Round Neck", "Inflate", "Tighten", "Sleeve Shorten"]
	//morphNames: []
});
COM.bottom.push({
	name: "COM_shorts",
	morphNames: ["Shorten", "Width", "Tight"]
	//morphNames: []
});
COM.bottom.push({
	name: "COM_braces",
	morphNames: ["Knee Extend", "Thigh Extend", "Shin Extend", "Shield"]
	//morphNames: []
});

var convoy = {};
convoy.full = malafacha.full.concat(trista.full);
convoy.full = convoy.full.concat(juliayrenata.full);
convoy.full = convoy.full.concat(vanessa.full);
convoy.top = malafacha.top.concat(trista.top);
convoy.top = convoy.top.concat(juliayrenata.top);
convoy.top = convoy.top.concat(vanessa.top);
convoy.bottom = malafacha.bottom.concat(trista.bottom);
convoy.bottom = convoy.bottom.concat(juliayrenata.bottom);
convoy.bottom = convoy.bottom.concat(vanessa.bottom);

Designers.convoy = convoy;
Designers.mary = convoy;
Designers.marcin = convoy;