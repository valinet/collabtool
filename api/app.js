var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var jwt = require('jsonwebtoken');
const jwtSecret = 'redacted';
var bcrypt = require('bcrypt');
const cryptSalt = 'redacted';
var bodyParser = require('body-parser');
var cors = require('cors');
const { ObjectId } = require('bson');
const { v4: uuidv4 } = require('uuid'); 

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: "redacted"}));
app.use(express.static(path.join(__dirname, 'public')));

var MongoClient = require('mongodb-legacy').MongoClient;
var url = "mongodb://127.0.0.1:27017/";

var forceEmptyDb = true;
var db;
var collUsers;
var collBoards;

MongoClient.connect(url, function(err, client) {
  if (err) throw err;
  console.log("connected to database");

  var defaultUsersList = [
  /* redacted */
  ];

  var defaultBoardsList = new Map();
  defaultBoardsList.set('827826A9-567A-4B8C-896E-BCC857764543', [
    { name: "Windows", key: "668B1940-8FD2-4848-8FED-DF3FD66864E3", desc: "Microsoft Operating System" },
    { name: "Ubuntu",  key: "403847F4-1A9A-4FA7-AEB5-CBC91DF96FCD", desc: "GNU/Linux distribution" },
  ]);
  defaultBoardsList.set('668B1940-8FD2-4848-8FED-DF3FD66864E3', [
    { name: "Windows 7",   key: "5E5E97C2-6AA4-4226-8077-6AD3C197917B", desc: "Launched in 2009." },
    { name: "Windows 8.1", key: "A1E60397-6D7C-40DD-878E-76A1BB50B3C1", desc: "Launched in 2013." },
    { name: "Windows 10",  key: "7BA0901E-C48C-47CF-9CEE-B1AB581175BB", desc: "Launched in 2015." },
  ]);
  defaultBoardsList.set('403847F4-1A9A-4FA7-AEB5-CBC91DF96FCD', [
    { name: "Ubuntu 20.04 LTS", key: "5185B5A3-8DC4-4F6F-8B3C-4953813B1C33", desc: "Launched in 2020." },
    { name: "Ubuntu 22.04 LTS", key: "993702B1-FD6B-4075-8F2A-190447D99158", desc: "Launched in 2022." },
  ]);
  defaultBoardsList.set('5E5E97C2-6AA4-4226-8077-6AD3C197917B', [
    { name: "Windows Aero",  key: "1F1DE26E-7559-4168-821D-81E625266049", desc: "Windows Aero (a backronym for Authentic, Energetic, Reflective, and Open) is a design language introduced in the Windows Vista operating system." },
    { name: "Superbar", key: "3CD02BC6-5DD9-4526-8C36-B11A2F99D575", desc: "Windows 7 debuted the “superbar”: a beefed up taskbar with larger app icons (with no text labels by default), the ability to “pin” frequent apps, app “jump lists” to quickly access recent files, and a Show Desktop button." },
  ]);

  db = client.db("madagascar");
  collUsers = db.collection("users");

  (async function () {
    if (forceEmptyDb || collUsers.find({}).toArray().length === 0) {
      await db.dropDatabase();
      db = client.db("madagascar");
      collUsers = db.collection("users");
      await collUsers.drop();
      await collUsers.insertMany(defaultUsersList);
      for (let [key, value] of defaultBoardsList) {
        let coll = db.collection(key);
        await coll.drop();
        await coll.insertMany(value);
      }
    }
  })();
}); 

const corsOptions = {
  headers: [
      { key: "Access-Control-Allow-Credentials", value: "true" },
      { key: "Access-Control-Allow-Origin", value: "*" },
      // ...
  ],
  origin: "*", // accept requests from any hostname
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors());

function validateCredentials(req, res, next) {
  cors(corsOptions);
  const token = req.header('X-Auth-Token');
  //console.log("supplied token", token);
  if (!token) return res.status(401).send({ desc: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.username = decoded.username;
    next();
  } catch (err) {
    res.status(401).send({ desc: 'Unauthorized' });
  }
};

app.get('/boards/:key', validateCredentials, (req, res) => {
  const key = req.params['key'];
  db.collection(key).count(function(err, count) {
    if (count === 0) res.status(200).send([]);
    else {
      db.collection(key).find().toArray(function(err, result) {
        if (err) throw err;
        if (key === '827826A9-567A-4B8C-896E-BCC857764543') {
          res.status(200).send(result);
          //console.log(result);
        } else {
          let z = result.length;
          result.forEach(function (entry) {
            db.collection(entry.key).find({}).toArray(function(err, result2) {
              //console.log(result2);
              entry.elems = result2;
              z--;
              if (z == 0) {
                res.status(200).send(result);
                //console.log(result);
              }
            });
          });
        }
      }); 
    } 
  });
});

app.delete('/boards/:key/:id', validateCredentials, (req, res) => {
  const key = req.params['key'];
  const id = req.params['id'];
  //console.log("deleting id", id);
  try {
    db.collection(key).deleteOne({ "_id": new ObjectId(id) });
    res.status(200).send("");
  } catch (e) {
    //console.log(e);
    res.status(500).send({ desc: e });
  }
});

app.post('/boards/:key', validateCredentials, (req, res) => {
  const key = req.params['key'];
  const { id, name, desc } = req.body;
  //console.log("id", id);
  //console.log("name", name);
  //console.log("desc", desc);
  if (name == "" || desc == "") res.status(500).send({ desc: "Blank values forbidden" });
  if (id == undefined) {
    db.collection(key).insertOne({ name: name, key: uuidv4(), desc: desc }, function(err, rv) {
      if (err) {
        //console.log(err);
        res.status(500).send({ desc: err });
      }
      res.status(200).send("");
    });
  } else {
    let set = {};
    if (name !== undefined) set.name = name;
    if (desc !== undefined) set.desc = desc;
    try {
      db.collection(key).updateOne(
        { _id: new ObjectId(id) },
        { $set: set }
      );
      res.status(200).send("");
    } catch (e) {
      //console.log(e);
      res.status(500).send({ desc: e });
    }
  }
});

app.post('/login', cors(corsOptions), (req, res) => {
  const { username, password } = req.body;
  //console.log(username);
  collUsers.findOne({ username: username }).then((user) => {
    if (!user || !user.password || (bcrypt.hashSync(password, cryptSalt).toString() !== user.password.toString())) {
      return res.status(401).send({ desc: 'Unauthorized' });
    }
    const token = jwt.sign({ username: { username } }, jwtSecret, {
      expiresIn: '1h',
    });
    res.status(200).send({ token: token });
  });
});

//app.get('/login', (req, res) => {
//  // Add your login form or logic here
//  res.render('login');
//});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
