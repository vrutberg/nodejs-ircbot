'use strict';

var net = require('net');
var util = require('util');
var irc = require('./connection');

exports.Client = Client;

function Client(server, port, nick, channels) {
  var self = this;

  self.conn = new irc.Connection(server, port, nick, 'testingmybot');
  self.opts = {
    nick: nick || '',
    channels: channels || [],
    autoConnect: true
  };

  self.conn.on("rawmessage", function(message) {
    util.log(message.command +' '+ (message.params.length > 0 ? message.params.join(' ') : ''));
  });

  self.conn.on("001", function() { // welcome
    self.opts.channels.forEach(function(channel) {
      self.conn.send("JOIN", channel);
    });
  });

  self.conn.on("PRIVMSG", function(message) {
    var isChannelMessage = message.params[0].charAt(0) === "#",
        source = message.params[0],
        text = message.params[1];

    if(isChannelMessage && text.charAt(0) === "!") {
      var indexOfSpace = text.indexOf(" "),
          command = text.substring(0, indexOfSpace),
          commandObj = {
            "command": command,
            "value": text.substring(indexOfSpace+1, text.length),
            "source": source
          };

      self.emit(command, commandObj);
    }
  });

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk) {
    conn.sendRaw(chunk.trim());
  });

  process.stdin.on('end', function() {
    sock.end();
  });
}

util.inherits(Client, process.EventEmitter);

Client.prototype.privmsg = function(recipient, text) {
  this.conn.send("PRIVMSG", [recipient, text]);
};