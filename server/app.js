var express = require('express');
var fs = require('fs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var session = require('express-session');
var formidable = require('formidable');
var  util = require('util');
var  fs   = require('fs-extra');
var  qt   = require('quickthumb');

var PORT = 3003;

function renderHtml(res, file) {
  fs.readFile(__dirname + '/' + file, 'utf8', function(err, text){
    res.send(text);
  });
}

var users = [
  { id: 1, username: 'vorg', password: 'kimchi' } ,
  { id: 2, username: 'mary', password: 'nachos' },
  { id: 3, username: 'convoy', password: 'convoystudio'},
  { id: 4, username: 'malafacha', password: 'tA87mp2'},
  { id: 5, username: 'trista', password: 'mR93esB'},
  { id: 6, username: 'vanessa', password: 'k9NB36s'},
  { id: 7, username: 'juliayrenata', password: 'T62hwQ7'},
  { id: 8, username: 'featureddesigner', password: 'eE39BY1x'},
  { id: 9, username: 'user4', password: 'convoystudio'},
  { id: 10, username: 'user5', password: 'convoystudio'},
  { id: 11, username: 'user6', password: 'convoystudio'},
  { id: 12, username: 'COM', password: 'jj339Rv'},
  { id: 13, username: 'COM1', password: 'jj339Rv'},
  { id: 14, username: 'COM2', password: 'jj339Rv'},
  { id: 15, username: 'malafacha1', password: 'tA87mp2'},
  { id: 16, username: 'malafacha2', password: 'tA87mp2'},
  { id: 17, username: 'trista1', password: 'mR93esB'},
  { id: 18, username: 'trista2', password: 'mR93esB'},
  { id: 19, username: 'vanessa1', password: 'k9NB36s'},
  { id: 20, username: 'vanessa2', password: 'k9NB36s'},
  { id: 21, username: 'juliayrenata1', password: 'T62hwQ7'},
  { id: 22, username: 'juliayrenata2', password: 'T62hwQ7'}
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
function stringGen(len)
{
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    process.nextTick(function () {
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));

var app = express();

//setup static files folder now public/assets becomes localhost:3000/assets
app.use(allowCrossDomain);
app.use(express.static(__dirname + '/public'));
app.use(qt.static(__dirname + '/')); //quickthumb
app.use(session({ secret: 'WE_NEED_TO_CHANGE_THIS', resave: true, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res, next) {
  var host = req.headers.host;
  if (host == 'www.googlerose.com' || host == 'googlerose.com' || host == 'localhost:3003') {
    res.redirect('/end-user/index.html');
  }
  else {
    next();
  }
});

app.get('/', function(req, res){
  renderHtml(res, 'public/login.html');
});

app.get('/intro', function(req, res){
  renderHtml(res, 'public/intro.html');
});

app.get('/hello', function(req, res){
  res.send('ROSE says hello from JS!')
});

app.get('/collection', function(req, res){
  renderHtml(res, 'public/collection.html');
});

app.post('/collection', ensureAuthenticated, function(req, res) {
    console.log(req.body.data);

    var dataFile = __dirname+'/data/'+req.user.username+'_collection.json';
    if (req.user && req.user.username) {
      fs.writeFile(dataFile, req.body.data, function (err) {
        if (err) return console.log(err);
        console.log('saved '+ req.user.username);
        res.send('collection saved');
      });
    } else {
      console.log('not logged in');
      res.status(500).send({ error: 'not logged in' });
    }

});

app.post('/looks', function(req, res) {
    console.log(req.body.data);

    var dataFile;
    if (req.user && req.user.username) {
      dataFile = __dirname+'/data/'+req.user.username+'_looks.json';

      fs.writeFile(dataFile, req.body.data, function (err) {
        if (err) return console.log(err);
        console.log('saved '+ req.user.username);
        res.send(req.user.username);
      });
    } else {
      var tmp_name = stringGen(7);
      dataFile = __dirname+'/data/'+tmp_name+'_looks.json';

      fs.writeFile(dataFile, req.body.data, function (err) {
        if (err) return console.log(err);
        console.log('saved '+ tmp_name);
        res.send(tmp_name);
      });
      //console.log('not logged in');
      //res.status(500).send({ error: 'not logged in' });
    }

});



app.get('/garments', function(req, res){
  renderHtml(res, 'public/garments.html');
});

app.get('/embellish', function(req, res){
  renderHtml(res, 'public/embellish.html');
});

app.get('/materials', function(req, res){
  renderHtml(res, 'public/materials.html');
});

app.get('/generate', function(req, res){
  renderHtml(res, 'public/generate.html');
});

app.get('/remix', function(req, res){
  renderHtml(res, 'public/remix.html');
});

app.get('/runway/', function(req, res) {
  if (req.user && req.user.username) {
    res.redirect('/runway/' + req.user.username + '/');
  }
  else {
    res.redirect('/');
  }
});

app.get('/runway/:user', function(req, res) {
  renderHtml(res, 'public/runway.html');
});

app.post('/upload', function (req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    //res.writeHead(200, {'content-type': 'text/plain'});
    //res.write('received upload:\n\n');
    //res.end(util.inspect({fields: fields, files: files}));
  });

  form.on('end', function(fields, files) {
    /* Temporary location of our uploaded file */
    var temp_path = this.openedFiles[0].path;
    /* The file name of the uploaded file */
    var file_name = this.openedFiles[0].name;
    /* Location where we want to copy the uploaded file */
    var new_location = 'uploads/';

    fs.copy(temp_path, new_location + file_name, function(err) {  
      if (err) {
        console.error(err);
      } else {
        console.log("success!")
        res.send(new_location + file_name);
      }
    });
  });

});

app.post('/look', function(req, res){
  if(req.query.num) {
    if (req.user && req.user.username) {
      ensureExists(__dirname+'/data/'+req.user.username, 0777, function(err) {
        if (err) {} // handle folder creation error
        else {}// we're all good
      });
      
      var data = req.body.data.replace(/^data:image\/\w+;base64,/, "");
      var buf = new Buffer(data, 'base64');
    fs.writeFile(__dirname+'/data/'+req.user.username+'/look'+req.query.num+'.png', buf, function (err) {
        if (err) return console.log(err);
        console.log('saved look'+ req.query.num);
        res.send('saved look');
      });

    }
  }
});


app.get('/user', function(req, res){
  renderHtml(res, 'public/user.html');
});

app.post('/user', function(req, res) {
    console.log(req.body);
    fs.writeFile(__dirname+'/data/'+req.body.username+'.json', JSON.stringify(req.body, null, 4), function (err) {
      if (err) return console.log(err);
      console.log('saved '+ req.body.username);
    });

});

app.get('/login', function(req, res){
  renderHtml(res, 'public/login.html');
});

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/collection');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/api/user/', ensureAuthenticated, function(req, res){
  if (req.user && req.user.username) {
    var dataFile = __dirname + '/data/' + req.user.username + '.json';
    if (fs.existsSync(dataFile)) {
      var data = fs.readFileSync(dataFile);
      res.set('Content-Type', 'application/json');
      res.send(data);
    }
    else {
      res.status(500).send({ error: 'no data' });
    }
  } else {
    res.status(500).send({ error: 'not logged in' });
  }
});

app.get('/api/designer/', ensureAuthenticated, function(req, res) {
  if (req.user && req.user.username) {
      res.send(req.user.username);
  } else {
    res.status(500).send({ error: 'not logged in' });
  }
});

app.get('/api/user/collection/', function(req, res){
  if(req.query.designer) {
      console.log(req.query.designer);
      var dataFile = __dirname + '/data/' + req.query.designer + '_collection.json';
      if (fs.existsSync(dataFile)) {
        var data = fs.readFileSync(dataFile);
        res.set('Content-Type', 'application/json');
        res.send(data);
      } else {
        res.send({});
      }
  } else {
    if (req.user && req.user.username) {
      var dataFile = __dirname + '/data/' + req.user.username + '_collection.json';
      if (fs.existsSync(dataFile)) {
        var data = fs.readFileSync(dataFile);
        res.set('Content-Type', 'application/json');
        res.send(data);
      } else {
        res.send({});
      }
    }
  }
});

if (process.argv.length == 3) {
  PORT = process.argv[2];
}

console.log('Starting ROSE server at ' + PORT);

app.listen(PORT);