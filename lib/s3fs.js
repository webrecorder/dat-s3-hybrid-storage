/**
 * S3FS uses bluebird for its Promise impl but
 * none of the awesome features of bluebird.
 * Monkey patching require only for first s3fs require in order to
 * make it use native Promises. Once s3fs is in the require
 * cache restore normal order of things.
 */
let Module = require('module');
const _require = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'bluebird') return Promise;
  return _require.apply(this, arguments);
};
const s3fs = require('s3fs');
Module.prototype.require = _require;

/**
 * @type {s3fs}
 */
module.exports = s3fs;
