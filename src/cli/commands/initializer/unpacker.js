'use strict'
const fs = require('fs-extra');
const spawn = require('child-process-ext/spawn');
const { writeMainAttrs, getServerlessFilePath } = require('../../serverlessFile');
const path = require('path');

class Unpacker {
  constructor(cli, tenantName, serviceName) {
    this.cli = cli
    this.tenantName = tenantName
    this.serviceName = serviceName
  }

  async unpack(dir) {
    process.chdir(dir);
    // Check if the directory contains a serverless.yml/yaml/json/js.
    // If it does, we need to unpack it
    if (getServerlessFilePath(dir)) {
      this.cli.status(`Unpacking service ${dir}`);
      if (fs.existsSync('package.json')) {
        await spawn('npm', ['install']);
      }
      if (fs.existsSync('yarn.lock')) {
        await spawn('yarn', ['install']);
      }

      await writeMainAttrs(this.cli, dir, this.tenantName, this.serviceName);
      const files = fs.readdirSync(dir);
      const promises = []
      files.forEach(async (file) => {
        // Check if the file is a directory, or a file
        if (fs.statSync(`${dir}/${file}`).isDirectory()) {
          promises.push(this.unpack(path.resolve(dir, file)));
        }
      })
      return Promise.all(promises)
    }
    return true
  }
}

module.exports = Unpacker
