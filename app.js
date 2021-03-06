var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);

var server = require('./bin/www');
var five = require('johnny-five');
var etherport = require('etherport');

var index = require('./routes/index');
var userRoutes = require('./routes/user');
var cardRoutes = require('./routes/card');

var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://starktech:starktech55@ds247178.mlab.com:47178/gamezone');
//mongoose.connect('mongodb://127.0.0.1:27017/gamezone');
var db = mongoose.connection;
db.on('error',console.error);
db.once('open',function(){
    console.log('connection successfull');
});

require('./config/passport');

// view engine setup
app.engine('.hbs', hbs({defaultLayout: 'layout', extname:'.hbs'}));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
    secret: 'mysupersecret',
    resave:true,
    saveUninitialized: true,
    store: new MongoStore({mongooseConnection: mongoose.connection }),
    cookie: { maxAge: 180 * 60 * 1000 }
}));

app.use(function(req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

var User = require('./models/user');
app.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated();
    if(req.isAuthenticated()) {
        res.locals.owner = req.user.isOwner;
    }
    res.locals.session = req.session;
    res.locals.currentUser = req.user;
    res.locals.dbs = db.collection('users');
    res.locals.sessionFlash = req.session.sessionFlash;
    res.locals.messages = require('express-messages')(req,res);
    next();
});

app.use(validator({
    errorFormatter: function (param,msg,value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while(namespace.length){
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

app.use('/card',cardRoutes);
app.use('/user', userRoutes);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

var SerialPort = require("serialport");
var parsers = SerialPort.parsers;
var parser = new parsers.Readline({
    delimiter: '\r\n'
});
var port = new SerialPort("COM6", {
    baudRate: 9600
});
port.pipe(parser);

parser.on('data', function (data) {

    console.log(data);
});



var http = require('http');
setInterval(function() {
    http.get("http://starktech05.herokuapp.com");
    console.log("executed");
}, 300000); // every 5 minutes (300000)


module.exports = app;
