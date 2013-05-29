'use strict';

var http = require('http');

var Spotify = function() {

  var baseUrl = 'http://ws.spotify.com/search/1/track.json';

  return {
    'searchForTrack': function(input, cb) {
      http.get(baseUrl+'?q='+input.replace(" ", "+"), function(response) {
        response.setEncoding('utf8');
        var body = '';
        response.on('data', function(data) {
          body += data;
        });
        response.on('end', function() {
          cb(JSON.parse(body));
        });
      });
    }
  };
};

exports.Spotify = Spotify();