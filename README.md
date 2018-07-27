# dat-s3-hybrid-storage

A hybrid S3 storage interface for [dat-node](https://github.com/datproject/dat-node) and [hyperdrive](https://github.com/mafintosh/hyperdrive)
that allows for dat metadata to be stored locally and content to be loaded from S3.

## Installation
Via yarn `yarn add dat-s3-storage`

Via npm `npm install dat-s3-storage`

## Why?

[dat-s3-storage](https://github.com/e-e-e/dat-s3-storage) does not allow for a hybrid storage model.

### Basic Example

```js
const DatNode = require('dat-node')
const S3HybridStorage = require('dat-s3-hybrid-storage')
const storage = S3HybridStorage.create('local-metadata-dir', 'my-bucket', '/content-in-bucket')
DatNode(storage, (err, dat) => {
  if (err) throw err
  console.log(`Sharing: ${dat.archive.key.toString('hex')}`)
  dat.joinNetwork()
})
```
