/**
 *
 * @param {Hyperdrive} hyperdrive
 * @param {string} file
 * @param {Object} [opts]
 * @return {Promise<boolean>}
 */
function fileExists (hyperdrive, file, opts) {
  return new Promise((resolve) => {
    hyperdrive.exists(file, opts, exists => {
      resolve(exists)
    })
  })
}

/**
 *
 * @param {Hyperdrive} hyperdrive
 * @param {string} file
 * @param {Object} [opts]
 * @return {Promise<Object>}
 */
function statFile (hyperdrive, file, opts) {
  return new Promise((resolve, reject) => {
    hyperdrive.lstat(file, opts, (err, stats) => {
      if (err) return reject(stats)
      resolve(stats)
    })
  })
}

module.exports = {
  fileExists,
  statFile
}
