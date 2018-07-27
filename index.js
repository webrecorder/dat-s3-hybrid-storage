const DatStorage = require('dat-storage')
const ras3 = require('random-access-s3')
const AWS = require('aws-sdk')

/**
 * @desc A Dat storage provider that provides dat metadata locally but content data from S3
 */
class S3HybridStorage {
  /**
   * @desc Create a new instance of S3HybridStorage
   * @param {string} localDir - Path to where the local metadata is stored
   * @param {string} bucket   - Name of the S3 bucket where the content data is stored
   * @param {string} s3prefix - Path to content in S3 bucket
   * @param {S3} s3           - AWS.S3 instance to use
   */
  constructor (localDir, bucket, s3prefix, s3) {
    /**
     * @desc AWS.S3 instance to use for loading content from the bucket
     * @type {S3}
     */
    this.s3 = s3

    /**
     * @desc Storage provider for locally stored metadata
     * @type {Object}
     */
    this.localStorage = DatStorage(localDir)

    /**
     * @desc Prepended to filename argument of {@link loadFile}
     * @type {string}
     */
    this.s3prefix = s3prefix

    this.loadFile = this.loadFile.bind(this)
    this.storageProvider = this.storageProvider.bind(this)

    /**
     * @desc Store used with custom loadFile to return s3 reader
     * @type {Object}
     */
    this.s3Store = DatStorage(this.loadFile)

    /**
     * @desc Options supplied to random-access-s3
     * @type {{bucket: string, s3: S3}}
     */
    this.ras3Opts = {
      bucket,
      s3: this.s3
    }
  }

  /**
   * @desc Create a new instance of S3HybridStorage and receive a {@link storageProvider} for hyperdrive or dat-node
   * @param {string} localDir - Path to where the local metadata is stored
   * @param {string} bucket   - Name of the S3 bucket where the content data is stored
   * @param {string} s3prefix - Path to content in S3 bucket
   * @param {S3}    [s3]      - Optional AWS.S3 instance to use. Defaults to "new S3({ apiVersion: '2006-03-01' })"
   * @return {{metadata: function(string, Object), content: function(string, Object, hyperdrive)}}
   */
  static create (localDir, bucket, s3prefix, s3) {
    if (!s3) {
      s3 = new AWS.S3({ apiVersion: '2006-03-01' })
    }
    const hs = new S3HybridStorage(localDir, bucket, s3prefix, s3)
    return hs.storageProvider()
  }

  /**
   * @desc Loads a file from S3
   * @param {string} filename - Name of the file to be loaded from S3
   * @return {ras3} - random-access-s3 loader for the file
   */
  loadFile (filename) {
    const path = this.s3prefix + filename
    return ras3(path, this.ras3Opts)
  }

  /**
   * @desc Returns a custom storage provider that provides metadata for local directory but content data from S3
   * @return {{metadata: function(file: string, opts: Object), content: function(file: string, opts: Object, archive: hyperdrive)}} - The hybrid storage provider
   */
  storageProvider () {
    return {
      metadata: (file, opts) => this.localStorage.metadata(file, opts),
      content: (file, opts, archive) => {
        if (file === 'data') {
          return this.s3Store.content(file, opts, archive)
        }
        return this.localStorage.content(file, opts, archive)
      }
    }
  }
}

module.exports = S3HybridStorage
