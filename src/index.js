import fs from 'fs';
import path from 'path';
import typeOf from 'gettype.js';
import basePath from 'pkg-dir';

import _createDirectory from './util/createDirectory';
import _readStorage from './util/readStorage';

const Storage = function (options = null) {
  if (!options || typeOf(options) !== 'Object') {
    throw new TypeError('Configuration should be option with dir and/or parent');
  }

  let nsParentDirectory = path.join(
    basePath.sync(__dirname),
    options.parent && typeOf(options.parent) === 'string' ?
    options.parent.replace(/[^\w\s]/gi, '_') :
    'ns'
  );

  if (fs.existsSync(nsParentDirectory)) {
    try {
      const nsParentDirectoryStats = fs.statSync(nsParentDirectory);

      if (!nsParentDirectoryStats.isDirectory()) {
        throw new TypeError(`A file with the same parent directory name already exist`);
      }
    } catch (error) {
      throw new Error(`Can't read parent path`);
    }
  } else {
    _createDirectory(nsParentDirectory);
  }

  if (options.dir) {
    this._path = path.resolve(
      path.join(nsParentDirectory,
      `${options.dir.replace(/[^\w\s]/gi, '').toLowerCase().replace(' ', '_')}`)
    );
  } else {
    throw new Error('Please provide a configuration for `dir`');
  }

  try {
    const stats = fs.statSync(this._path);

    if (!stats.isDirectory()) {
      throw new TypeError('Path exist but is not a directory');
    }
  } catch (e) {
    _createDirectory(this._path);
  }

  const nodeStorage = _readStorage(this._path);

  this.length = Object.keys(nodeStorage).length;

  for (let data of Object.keys(nodeStorage)) {
    this[data] = nodeStorage[data];
  }
}

Storage.prototype.getItem = function (key = null) {
  
  if (!key) {
    throw new TypeError('Invalid argument');
  }

  const storage = _readStorage(this._path);

  if (key.toString() in storage) {
    return storage[key].toString();
  }

  return null;
}

Storage.prototype.setItem = function (key = null, value = null) {
  if (!key || !value) {
    throw new TypeError('Invalid arguments');
  }

  try {
    const write = fs.writeFileSync(`${this._path}/${key.toString()}`, value.toString());

    if (write) {
      return;
    }
  } catch (e) {
    throw new Error (e);
  }
}

Storage.prototype.removeItem = function (key = null) {
  if (!key) {
    throw new TypeError('Invalid argument');
  }

  try {
    const stats = fs.statSync(`${this._path}/${key.toString()}`);

    if (!stats) return;

    if (!stats.isFile()) return;
  } catch (e) {
    return;
  }

  try {
    const removeFile = fs.unlinkSync(`${this._path}/${key}`);

    if (removeFile) {
      return;
    }
  } catch (e) {
    return;
  }
}

Storage.prototype.clear = function () {
  if (!fs.existsSync(this._path)) return;

  if (!fs.statSync(this._path).isDirectory()) return;

  if (this.length < 1) return;

  try {
    const files = fs.readdirSync(this._path);

    for (file of files) {
      try {
       fs.unlinkSync(path.join(this._path, file));
      } catch (e) {
        throw e;
      }
    }

    return;

  } catch (err) {
    throw new Error('Can\'t read storage directory');
  }
}

Storage.prototype.key = function (index) {
  return Object.keys(_readStorage(this._path))[index] || null;
}

module.exports = Storage;
