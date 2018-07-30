const { Transform } = require('stream')

const DEFAULT_CHUNK_SIZE = 65536

/**
 * @desc Transform a stream into chunks of specified size
 */
class FixedChunkTransform extends Transform {
  constructor (size, options) {
    super(options)
    this.size = size || DEFAULT_CHUNK_SIZE
    this._buffered = null
    this._bufferedBytes = 0
  }

  _transform (buf, enc, next) {
    this._bufferedBytes += buf.length
    if (this._buffered == null) {
      this._buffered = buf
    } else {
      this._buffered = Buffer.concat([this._buffered, buf])
    }
    while (this._bufferedBytes >= this.size) {
      this._bufferedBytes -= this.size
      this.push(this._buffered.slice(0, this.size))
      this._buffered = this._buffered.slice(this.size, this._buffered.length)
    }
    next()
  }

  _flush (next) {
    if (this._bufferedBytes) {
      this.push(this._buffered)
      this._buffered = null
    }
    this.push(null)
    next()
  }
}

module.exports = FixedChunkTransform
