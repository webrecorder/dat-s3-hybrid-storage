const { pipeline } = require('stream');
const debug = require('debug')('S3Importer');
const S3FS = require('./s3fs');
const { fileExists, statFile } = require('./hyperdriveUtils');
const FixedChunkTransform = require('./fixedChunkTransform');

const DEFAULT_CHUNK_SIZE = 65536;

class S3Importer {
  /**
   *
   * @param {string} bucket
   * @param {string} prefix
   * @param {s3} s3opts
   */
  constructor(bucket, prefix, s3opts) {
    /**
     * @desc s3 path prefix
     * @type {string}
     */
    this.prefix = prefix;

    if (!this.prefix.endsWith('/')) {
      this.prefix += '/';
    }

    /**
     * @desc The S3FS instance used to compare local hyperdrive content to S3 content
     * @type {s3fs}
     */
    this.s3fs = new S3FS(bucket, s3opts);
  }

  /**
   * @desc Import files from the S3 bucket to the supplied hyperdrive
   * @param {Hyperdrive} hyperdrive - The hyperdirive to import file metadata to
   * @param {number} [blockSize = 65536] - Size of blocks to be written to local metadata
   * @return {Promise<void | Array<{to: string, err: Error}>>} - If there were errors importing from S3 the returned array is populated otherwise it is not
   */
  async importFiles(hyperdrive, blockSize = DEFAULT_CHUNK_SIZE) {
    const from = this.prefix;
    const promises = [];
    const files = await this.s3fs.readdirp(from);
    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      const fileInS3 = from + file;
      const fileInDrive = '/' + file;
      const exists = await fileExists(hyperdrive, file);
      let shouldImport = false;

      if (exists) {
        const archiveStats = await statFile(hyperdrive, file);
        let s3stats;
        try {
          s3stats = await this.s3fs.stat(fileInS3);
        } catch (e) {
          debug(`importFiles s3 stat failed: ${file} %O`, e);
        }
        if (s3stats && s3stats.size !== archiveStats.size) {
          shouldImport = true;
        }
      } else {
        shouldImport = true;
      }

      if (shouldImport) {
        debug(`Importing ${fileInS3} -> ${fileInDrive}`);
        promises.push(
          this._import(hyperdrive, fileInS3, fileInDrive, blockSize)
        );
      } else {
        debug(`Already imported, skipping: ${file}`);
      }
    }
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }

  /**
   * @param hyperdrive - The hyperdirive to import file metadata to
   * @param {string} from - Path to file in s3
   * @param {string} to - Path to file in local metadata
   * @param {number} blockSize - Size of blocks to be written to local metadata
   * @returns {Promise<void | {to: string, err: Error}>}
   * @private
   */
  _import(hyperdrive, from, to, blockSize) {
    return new Promise(resolve => {
      pipeline(
        this.s3fs.createReadStream(from),
        new FixedChunkTransform(blockSize),
        hyperdrive.createWriteStream(to),
        err => {
          if (err) {
            debug(`importFiles pipeline failed: ${from} %O`, err);
            return resolve({ to, err });
          } else {
            debug(`importFiles pipeline pipeline succeeded: ${from}`);
          }
          resolve();
        }
      );
    });
  }
}

module.exports = S3Importer;
