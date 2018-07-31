# dat-s3-hybrid-storage

A hybrid S3 storage interface for [dat-node](https://github.com/datproject/dat-node) and [hyperdrive](https://github.com/mafintosh/hyperdrive)
that allows for dat metadata to be stored locally and content to be loaded from S3.

An inspiration for this is the [dat-s3-storage](https://github.com/e-e-e/dat-s3-storage) which loads .dat/ directory and content from S3.
It suggests a hybrid storage approach, which this module attempts to implement.

This storage interface instead keeps a .dat/ directory locally, while content is streamed from S3.

An importer class is also provided to initialize a new .dat directly from s3 as well.


## Installation
Via yarn `yarn add dat-s3-hybrid-storage`

Via npm `npm install dat-s3-hybrid-storage`


## Basic Swarming Example

```js
const DatNode = require('dat-node')
const S3HybridStorage = require('dat-s3-hybrid-storage')
const storage = S3HybridStorage.create('s3://bucket/path/to/somedata', '/local/data/path/')
DatNode(storage, (err, dat) => {
  if (err) throw err
  console.log(`Sharing: ${dat.archive.key.toString('hex')}`)
  dat.joinNetwork()
})
```

This assumes that dat metadata is stored in `/local/data/path/.dat/` while the content is found
under `s3://bucket/path/to/somedata/`


## S3 Importer

The S3 importer provides a way to initialize a dat directlry from S3. The importer streams content
from S3 and indexing into .dat, using 64k blocks by default to simulate a local file system import.

The `importFiles` function takes a hyperdrive returns a Promise that will perform the input.
Currently, files already existing in the hyperdrive with the same size are skipped, otherwise a file is imported.

```js
const s3_storage = new S3HybridStorage('s3://bucket/path/to/somedata', '/local/data/path/');
const archive = hyperdrive(s3_storage.storage(), opts)

s3_storage.importer().importFiles(archive).then(function() {
  console.log("Import Complete!")
})

```

