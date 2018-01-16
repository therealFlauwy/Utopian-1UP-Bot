// Example express application adding the parse-server module to expose Parse
// compatible API routes.
var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var favicon = require('serve-favicon')
require('dotenv').config();
var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}
var serverURL=process.env.SERVER_URL||'http://localhost:1337';
var api = new ParseServer({
  databaseURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: serverURL+'/parse',  // Don't forget to change to https if needed

});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
//app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.get('/posts', function(req, res) {
  var post=null;
  var aPost = Parse.Object.extend("Posts");
  var query = new Parse.Query(aPost);
  query.descending("from_length");
  query.equalTo("voted",false);
  //query.equalTo("voted_utopian",false);
         query.find({
          success: function(posts) {
            if(posts!==undefined&&posts.length!==0)
            {
                res.render('main.ejs', {posts: posts,active:0});
                Parse.Cloud.run('checkVote', null).then(function(v){});
            }
            else
            {
              console.log('Nothing to show');
              res.render('main.ejs', {posts: [],active:0});
            }
          },error:function(error){console.log(error);}
        });
  });


// Serve the Parse API on the /parse URL prefix
var mountPath = '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Backend for Utopian 1UP!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
