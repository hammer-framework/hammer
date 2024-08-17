"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = builder;
exports.description = exports.command = void 0;
exports.handler = handler;
var _cliHelpers = require("@redwoodjs/cli-helpers");
const command = exports.command = 'azure-active-directory';
const description = exports.description = 'Set up auth for Azure Active Directory';
function builder(yargs) {
  return (0, _cliHelpers.standardAuthBuilder)(yargs);
}
async function handler(options) {
  const {
    handler
  } = await import('./setupHandler.js');
  return handler(options);
}