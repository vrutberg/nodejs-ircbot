'use strict';

var irc = require('./client');
var spotify = require('./spotify');
var util = require('util');

var myClient = new irc.Client('irc.esper.net',
                              6667,
                              'kilbot',
                              ['#bottest']);

myClient.on("!spotify", function(input) {
  spotify.Spotify.searchForTrack(input.value, function(data) {
    var out = '';
    if(data.info.num_results > 0) {
      var track = data.tracks[0];
      var artist = track.artists[0];
      var hrefData = track.href.split(":");

      out = util.format("%s - %s (http://open.spotify.com/%s/%s)", artist.name, track.name, hrefData[1], hrefData[2]);
    } else {
      out = "No tracks found for '"+ input.value +"'!";
    }

    myClient.privmsg(input.source, out);
  });
});
