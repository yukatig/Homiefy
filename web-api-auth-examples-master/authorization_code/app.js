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
var userID;
var imageURL;
var spotifyURL;
var display_name;

var client_id = '22c6082ec6974b168bb64b966f927bcf'; // Your client id
var client_secret = 'a46390a2779f47bea29ff16b856f6152'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var global_access_token;

const fs = require('fs');
const { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } = require('constants');


var myCss = {
    style : fs.readFileSync('public/css/play.css','utf8')
};


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
          url: 'https://api.spotify.com/v1/me/player/recently-played?limit=50',
          headers: { 'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token }
        };

        console.log(req.query.search);
        console.log(req.query.search === undefined);

        var friend = req.query.search;

        if(friend === undefined) {

        request.get(options, function(error, response, body) {
          
          var playdata = JSON.parse(body);

          ourPlaylist = [];

          var songs = playdata.items;

          var idList = [];
          for(var i = 0; i < songs.length; i++) {
            var songID = songs[i].track.id;
            var artistlink = songs[i].track.album.artists[0].external_urls.spotify;
            var artistname = songs[i].track.album.artists[0].name;
            var songlink = songs[i].track.external_urls.spotify;
            var image = songs[i].track.album.images[1].url;
            var songname = songs[i].track.name;

            ourPlaylist.push({
              id: songID,
              artref: artistlink,
              artname: artistname,
              songref: songlink,
              name: songname,
              cover: image
            });

            idList.push({
              id: songID,
              artref: artistlink,
              artname: artistname,
              songref: songlink,
              name: songname,
              cover: image
            });
          }

          console.log(idList);

          var fs = require('fs');

          var datastr = fs.readFileSync('storeID.txt', 'utf8');

          console.log(datastr);
          console.log(datastr == "");

          /*
          var dataArray = datastr.split("*");

          for (i = 0; i < dataArray.length; i++) {
            var userObject = JSON.parse(dataArray[i]);
            if ()
          } */

          var userObject = {
            id: userID,
            idList: idList,
            imageURL: imageURL,
            spotifyURL: spotifyURL,
            display_name: display_name
          };

          var userArray;

          if(datastr == "") {
            userArray = [];
            userArray.push(userObject);
          }
          else {
            userArray = JSON.parse(datastr);
            var notfound = true;
            userArray.forEach((element) => {
              if(element.id == userID) {
                notfound = false;
                element.idList = idList;
              }
            });
            if(notfound) {
              userArray.push(userObject);
            }
          }
          
          fs.writeFile('storeID.txt', JSON.stringify(userArray), (err) => {
            // throws an error, you could also catch it here
            if (err) throw err;
        
            // success case, the file was saved
            console.log('user saved!');
          });

          app.use(express.static("public"));
          res.render('play', {
            'playlist': ourPlaylist
          });
        });
      }
      else {
        
        request.get(options, function(error, response, body) {
          
          var playdata = JSON.parse(body);

          var fs = require('fs');
          var datastr = fs.readFileSync('storeID.txt', 'utf8');
          var userArray = JSON.parse(datastr);

          ourPlaylist = [];
          friendPlaylist = [];

          userArray.forEach((element) => {
            if(element.id == userID) {
              ourPlaylist = element.idList;
            }
            if(friend != '' && element.display_name.toLowerCase().includes(friend.toLowerCase())) {
              friendPlaylist.push(element);
            }
          });

          if(friendPlaylist.length == 0) {
            app.use(express.static("public"));
            res.render('play', {
              'playlist': ourPlaylist,
              'noResult': 'No user found'
            });
          }
          else {
            var display_people = [];
            friendPlaylist.forEach((element) => {
              display_people.push({
                'pic': element.imageURL,
                'name': element.display_name,
                'id': element.id,
              });
            });
            app.use(express.static("public"));
            res.render('play', {
              'results': display_people
            });
          }
        });
      }

});

app.get('/play/:id', function(req, res) {

  var access_token = global_access_token;

  var options = {
    url: 'https://api.spotify.com/v1/me/player/recently-played?limit=50',
    headers: { 'Accept': 'application/json',
'Content-Type': 'application/json',
'Authorization': 'Bearer ' + access_token }
  };

  console.log(req.params.id);

  friendID = req.params.id;

  request.get(options, function(error, response, body) {

  var fs = require('fs');
  var datastr = fs.readFileSync('storeID.txt', 'utf8');
  var userArray = JSON.parse(datastr);

  var ourPlaylist = [];
  var friendPlaylist = [];

  var friendName = '';

  userArray.forEach((element) => {
    if(element.id == userID) {
      ourPlaylist = element.idList;
    }
    if(friendID == element.id) {
      friendPlaylist = element.idList;
      friendName = element.display_name;
    }
  });

  var sharedPlaylist = [];

  ourPlaylist.forEach((element) => {
    if(friendPlaylist.includes(element)) {
      sharedPlaylist.push(element);
    }
  });

  if(sharedPlaylist.length == 0) {
    app.use(express.static("public"));
    res.render('play', {
      'noshared': 'No common songs found',
      myCss: myCss
    });
  }
  else {
    app.use(express.static("public"));
    res.render('play', {
      'friendName': friendName,
      'playlist': sharedPlaylist,
      myCss: myCss
    });
  }
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
          //var bodyObject = JSON.parse(body);
          userID = body.id;
          imageURL = body.images[0].url;
          spotifyURL = body.external_urls.spotify;
          display_name = body.display_name;
          console.log(userID);
          console.log(spotifyURL);
          console.log(imageURL);
          console.log(display_name);

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

/**
 * CODE FOR STORING USER STUFF IN JSON OBJECT
  app.post('/users', function (req, res) {
    const user = req.body
    fs.appendFile('users.txt', JSON.stringify({ name: user.name, age: user.age }), (err) => {
        res.send('successfully registered')
    })
})
{ username: user.name, list: [use a for loop here to put id into list] }
list: []
 */


/**
 * DATABASE
 */

/*
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "myusername",
  password: "mypassword"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  /*Create a database named "mydb":
  con.query("CREATE DATABASE mydb", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });
});
*/

