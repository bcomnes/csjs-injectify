'use strict';

var through = require('through2');
var acorn = require('acorn');
var falafel = require('falafel');

var regex = /(['"`])csjs2\1/;

module.exports = function (file) {
  if (/\.json$/.test(file)) return through();
  var output = through(function(buf, enc, next) {
    var source = buf.toString('utf8');

    try {
      var injectified = falafel(source, {
        parser: acorn,
        sourceType: 'module'
      }, walk);
    } catch (err) {
      return error(err)
    }

    this.push(injectified.toString());
    next();
  });

  function error(msg) {
    var err = typeof msg === 'string' ? new Error(msg) : msg;
    output.emit('error', err);
  }

  return output;
};

function walk(node){
  if (node.type === 'ImportDeclaration') {
    node.update(node.source().replace(regex, '$1csjs2-injectify/csjs-inject$1'))
  } else if (isRequire(node)) {
    if (node.arguments[0].value === 'csjs2') {
      var quote = node.arguments[0].raw[0][0];
      node.arguments[0].update(quote + 'csjs2-injectify/csjs-inject' + quote);
    }
  }
}

function isRequire(node) {
  return node.callee &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require';
}
