var sys       = require('pex-sys');
var glu       = require('pex-glu');
var Q         = require('q');
var ObjReader = require('../utils/ObjReader');

var Platform  = sys.Platform;
var Texture2D = glu.Texture2D;

var ASSETS_URL = '';
var href = Platform.isBrowser ? document.location.href : '';
var isLocalhost = href.indexOf('localhost') != -1;
var isServer = href.indexOf('3003') != -1;
var isOnline = href.indexOf('googlerose.com') != -1;
var isDev = Platform.isPlask || isLocalhost || href.indexOf('dev.googlerose.com') != -1;

if (Platform.isPlask)
  ASSETS_URL = __dirname + '/../../server/public/assets';

if (isLocalhost)
  ASSETS_URL = '../server/public/assets';

if (isLocalhost && isServer)
  ASSETS_URL = '/public/assets';

if (isOnline)
  ASSETS_URL = '/assets/';


function AssetsLoader() {

}

AssetsLoader.getAssetsPath = function() {
  return ASSETS_URL;
}

AssetsLoader.isDev = function() {
  return isDev;
}

AssetsLoader.loadTexture = function(url) {
  if (!url) {
    return null;
  }


  if (url.indexOf('uploads') != -1) {
    if (Platform.isPlask) {
      url = '../server' + url;
    }
  }
  else {
    url = ASSETS_URL + url.replace('assets', '');
  }

  return Texture2D.load(url);
}

AssetsLoader.loadShape = function(url) {
  var deferred = Q.defer();

  ObjReader.load(ASSETS_URL + '/' + url, function(g) {
    if (g) deferred.resolve(g);
    else deferred.reject(new Error('Failed to load ' + url));
  });

  return deferred.promise;
}

module.exports = AssetsLoader;