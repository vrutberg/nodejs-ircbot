'use strict';

var net = require('net');
var util = require('util');

exports.Connection = Connection;

function Connection(server, port, nick, realname) {
  var self = this;

  self.opts = {
    server: server || '',
    port: port || '',
    nick: nick || '',
    realname: realname || '',
    encoding: 'utf8',
    autoConnect: true
  };

  self.state = {
    connected: false
  };

  self.connect = function() {
    self.sock = new net.Socket();
    self.sock.setEncoding(self.opts.encoding);

    util.log('Connecting...');
    self.sock.connect(self.opts.port, self.opts.server);

    self.sock.on('connect', function() {
      util.log("Connected!");
      self.state.connected = true;
      self.emit("connect");
    });

    self.sock.on('data', function(data) {
      parseRaw(data);
    });

    self.sock.on('close', function() {
      self.state.connected = false;
    });
  };

  self.printMessage = function(message) {
    util.log(message.command +' '+ (message.params.length > 0 ? message.params.join(' ') : ''));
  };

  self.on('connect', function() {
      self.send('NICK', self.opts.nick);
      self.send('USER', [self.opts.nick, '0', '*', ":"+self.opts.realname]);
  });

  self.on('PING', function(message) {
    self.send('PONG', message.params[0]);
  });

  self.on('ERROR', function() {
    self.sock.end();
    self.state.connected = false;
  });

  var parseRaw = function(raw) {
    raw.split("\r\n").forEach(function(line) {
      line = line.trim();
      if(line === '') return;

      var message = {
        prefix: '',
        command: '',
        params: []
      };

      if (line.charAt(0) === ':') {
        var indexOfSpace = line.indexOf(" ");
        message.prefix = line.substring(1, indexOfSpace);
        line = line.substring(indexOfSpace+1);
      }

      indexOfSpace = line.indexOf(" ");
      message.command = line.substring(0, indexOfSpace);
      line = line.substring(indexOfSpace+1);

      var middle, trailing;

      if (line.search(/^:|\s+:/) != -1) {
        var match = line.match(/(.*?)(?:^:|\s+:)(.*)/);
        middle = match[1].trimRight();
        trailing = match[2];
      }
      else {
        middle = line;
      }

      if (middle.length) {
        message.params = middle.split(/ +/);
      }

      if (typeof(trailing) != 'undefined' && trailing.length) {
        message.params.push(trailing);
      }

      self.emit('rawmessage', message);
    });
  };

  self.on('rawmessage', function(message) {
    self.emit(message.command, message);
  });

  if(self.opts.autoConnect) {
    self.connect();
  }
}

util.inherits(Connection, process.EventEmitter);

Connection.prototype.send = function(command, params) {
  if(!util.isArray(params)) {
    params = [params];
  }

  if(params.length > 0 && params[params.length -1].indexOf(' ') !== -1) {
    params[params.length -1] = ':'+params[params.length -1];
  }

  var out = [command].concat(params).join(' ');
  util.log('Sending command: '+ out);
  this.sock.write(out+'\r\n');
};

Connection.prototype.sendRaw = function(rawCommand) {
  util.log('Sending raw command: '+ rawCommand)
  this.sock.write(rawCommand+'\r\n');
};

Connection.prototype.disconnect = function(reason) {
  this.sock.end();
  this.state.connected = false;
};