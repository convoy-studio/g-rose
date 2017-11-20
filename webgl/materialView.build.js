var browserify = require('browserify');
var fs = require('fs');

var b = browserify();

b.add('./materialView.js');
b.transform({global:true}, 'brfs');
b.ignore('plask');
b.bundle().pipe(fs.createWriteStream('./materialView.web.js'));
