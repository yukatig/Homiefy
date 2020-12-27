/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var global_access_token;

var client_id = '22c6082ec6974b168bb64b966f927bcf'; // Your client id
var client_secret = 'a46390a2779f47bea29ff16b856f6152'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var global_access_token;

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

// View engine setup 
app.set('view engine', 'ejs'); 

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());


app.get('/play', function(req, res) {

        var access_token = global_access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me/player/recently-played?limit=10',
          headers: { 'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token }
        };

        request.get(options, function(error, response, body) {
          
          playdata = JSON.parse(body);
          //console.log(playdata.items[0].track.album);

          ourPlaylist = [];

          var songs = playdata.items;

          for(var i = 0; i < songs.length; i++) {
            var artistlink = songs[i].track.album.artists[0].external_urls.spotify;
            var artistname = songs[i].track.album.artists[0].name;
            var songlink = songs[i].track.external_urls.spotify;
            var image = songs[i].track.album.images[0].url;
            var songname = songs[i].track.name;
            ourPlaylist.push({
              artref: artistlink,
              artname: artistname,
              songref: songlink,
              name: songname,
              cover: image
            });
          }

          res.render('play', {
            'playlist': ourPlaylist
          });
        });

});


app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

            global_access_token = access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));

        //RUN HELLO 
        //hello();

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      } 
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


/*
var fetch = require('node-fetch');

async function hello() {

  var request = require('request');

  var headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + global_access_token
  };

  var options = {
      url: 'https://api.spotify.com/v1/me/player/recently-played',
      headers: headers
  };

  function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log(body);
      }

      else {
        console.log("not working");
      }
  }

  request(options, callback);

  //FETCH OPTION
  var response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + global_access_token
    }
  });

  const json = await response.json();

  console.log(json); 
  //FETCH OPTION END, WAS PRINTING TYPES OF ERROR 

}

hello(); */

/*
var request = require('request');

var headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + global_access_token
};

var options = {
    url: 'https://api.spotify.com/v1/me/player/recently-played',
    headers: headers
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}

request(options, callback); */



console.log('Listening on 8888');
app.listen(8888);
