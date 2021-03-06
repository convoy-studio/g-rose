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