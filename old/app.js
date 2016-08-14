/// <reference path="typings/tsd.d.ts" />
/// <reference path="routes/agent-router.ts" />
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var agentRouter = require('./routes/agent-router');
var quickDirtyResponse = function (req, res) {
    var data;
    if (req.hasOwnProperty('streams')) {
        data = { streams: req['streams'] };
    }
    else if (req.hasOwnProperty('items')) {
        data = { devices: req['items'] };
    }
    res.status(200).send(data);
};
app.get('/', agentRouter.getItems, quickDirtyResponse);
app.get('/probe', agentRouter.getItems, quickDirtyResponse);
app.get('/sample', agentRouter.getItems, agentRouter.getStreams, agentRouter.mergeDeviceAndStreams, quickDirtyResponse);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: err
    });
});
module.exports = app;
