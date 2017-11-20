var Assets = {};

Assets.Shapes = [
  { name : 'cube', file: 'shapes/selected/cube.obj' },
  { name : 'icosahedron', file: 'shapes/selected/icosahedron.obj' },
  { name : 'octahedron', file: 'shapes/selected/octahedron.obj' },
  { name : 'disc', file: 'shapes/selected/disc.obj' },
  { name : 'cone', file: 'shapes/selected/cone.obj' },
  { name : 'cylinder', file: 'shapes/selected/cylinder.obj' },
  { name : 'feather', file: 'shapes/selected/feather.obj' },
  { name : 'sphere', file: 'shapes/selected/sphere.obj' }
];

Assets.ShapesByName = {};
Assets.Shapes.forEach(function(shape) {
  Assets.ShapesByName[shape.name] = shape;
})

Assets.MatCaps = [
  'textures/matcaps_extact/Blue_Mirror.png',
  'textures/matcaps_extact/BluryBlack.png',
  'textures/matcaps_extact/Candy.png',
  'textures/matcaps_extact/Chrome.png',
  'textures/matcaps_extact/Coal.png',
  'textures/matcaps_extact/Cyan_Glow.png',
  'textures/matcaps_extact/Cyan_Glow2.png',
  'textures/matcaps_extact/Fabric_Gray.png',
  'textures/matcaps_extact/Fabric_Green.png',
  'textures/matcaps_extact/GlossyBlue.png',
  'textures/matcaps_extact/GlossyGray.png',
  'textures/matcaps_extact/GlossyPurple.png',
  'textures/matcaps_extact/Granite2.png',
  'textures/matcaps_extact/Ice.png',
  'textures/matcaps_extact/IronCast.png',
  'textures/matcaps_extact/Lead.png',
  'textures/matcaps_extact/MatGold.png',
  'textures/matcaps_extact/MattBeige.png',
  'textures/matcaps_extact/Metal-Tungsten-Lighter.png',
  'textures/matcaps_extact/Metal-Tungsten.png',
  'textures/matcaps_extact/Pink.png',
  'textures/matcaps_extact/Rubber.png',
  'textures/matcaps_extact/SSS_Purple.png',
  'textures/matcaps_extact/Sandstone.png',
  'textures/matcaps_extact/Sandstone1.png',
  'textures/matcaps_extact/SilverAntique.png',
  'textures/matcaps_extact/Skin1.png',
  'textures/matcaps_extact/Soft.png',
  'textures/matcaps_extact/Steel-Brushed-Lighter.png',
  'textures/matcaps_extact/Steel-Brushed.png',
  'textures/matcaps_extact/Steel-Brushed2.png',
  'textures/matcaps_extact/Toxic.png',
  'textures/matcaps_extact/matcap.jpg',
  'textures/matcaps_extact/plastic_red.png'
];

//node module support
if (typeof(module) != 'undefined') {
  module.exports = Assets;
}
