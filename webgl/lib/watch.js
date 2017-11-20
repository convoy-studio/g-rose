#!/usr/bin/env node

var file = process.argv[2];

var fs = require('fs');
var browserify = require('browserify');
var watchify = require('watchify');
var browserSync = require('browser-sync');
var b = browserify(watchify.args);

function watch() {
    b.add('./' + file + '.js');

    b.transform({global:true}, 'brfs');
    b.ignore('plask');

    var bundler = watchify(b);
    bundler.on('update', rebundle);

    function rebundle () {
        return bundler.bundle()
        // log errors if they happen
        .on('error', function(e) {
            console.log('Browserify Error', e);
        })
        .pipe(fs.createWriteStream(file + '.web.js'))
        .on('end', function() { browserSync.reload(); });
    }

    return rebundle()

}

watch();

var files = [
    './' + file + '.web.js'
];

browserSync.init(files, {
    server: {
        baseDir: './'
    }
});



