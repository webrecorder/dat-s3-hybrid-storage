const { pipeline } = require('stream')
const debug = require('debug')('S3Importer')
const S3FS = require('./s3fs')
const {fileExists, statFile} = require('./hyperdriveUtils')
const FixedChunkTransform = require('./fixedChunkTransform')

class S3Importer {
  /**
   *
   * @param {S3HybridStorage} storage
   */
  constructor (storage) {
    /**
     * @desc The hybrid storage to be importing into
     * @type {S3HybridStorage}
     */
    this.storage = storage

    /**
     * @desc The S3FS instance used to compare local hyperdrive content to S3 content
     * @type {s3fs}
     */
    this.s3fs = new S3FS(storage.bucket, storage.s3)
  }

  /**
   * @desc Import files from the S3 bucket to the supplied hyperdrive
   * @param {Hyperdrive} hyperdrive
   * @param {number} [blockSize = 65536]
   * @return {Promise<Array<{to: string, err: Error}>>} - If there were errors importing from S3 the returned array is populated otherwise it is not
   */
  async importFiles (hyperdrive, blockSize = 65536) {
    const from = this.storage.s3prefix.endsWith('/')
      ? this.storage.s3prefix
      : this.storage.s3prefix + '/'
    const promises = []
    const files = await this.s3fs.readdirp(from)
    for (let i = 0; i < files.length; ++i) {
      const file = files[i]
      const fileInS3 = from + file
      const fileInDrive = '/' + file
      const exists = await fileExists(hyperdrive, file)
      if (exists) {
        const archiveStats = await statFile(hyperdrive, file)
        let s3stats
        try {
          s3stats = await this.s3fs.stat(fileInS3)
        } catch (e) {
          debug(`importFiles s3 stat failed: ${file} %O`, e)
        }
        if (s3stats && s3stats.size !== archiveStats.size) {
          promises.push(this._import(hyperdrive, fileInS3, fileInDrive))
        }
      } else {
        promises.push(this._import(hyperdrive, fileInS3, fileInDrive))
      }
    }
    const results = await Promise.all(promises)
    return results.filter(Boolean)
  }

  _import (hyperdrive, from, to, blockSize) {
    return new Promise(resolve => {
      pipeline(
        this.s3fs.createReadStream(from),
        new FixedChunkTransform(blockSize),
        hyperdrive.createWriteStream(to),
        err => {
          if (err) {
            debug(`importFiles pipeline failed: ${from} %O`, err)
            return resolve({to, err})
          } else {
            debug(`importFiles pipeline pipeline succeeded: ${from}`)
          }
          resolve()
        }
      )
    })
  }
}

module.exports = S3Importer