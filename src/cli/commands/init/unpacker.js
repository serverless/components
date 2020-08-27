'use strict';
const fs = require('fs-extra');
const spawn = require('child-process-ext/spawn');
const {
  writeMainAttrs,
  getServerlessFilePath,
  rootServerlessFileExists,
  createRootServerlessFile,
} = require('../../serverlessFile');
const path = require('path');
const {
  legacyLoadComponentConfig,
  legacyLoadInstanceConfig,
  runningTemplate,
} = require('../../utils');

class Unpacker {
  /**
   * Recusively unpacks a template, running npm i
   * or yarn install for each project
   * @param {*} cli
   * @param {*} tenantName
   * @param {*} serviceName
   */
  constructor(cli, tenantName, serviceName) {
    this.cli = cli;
    this.tenantName = tenantName;
    this.serviceName = serviceName;
  }

  /**
   * isComponents
   *
   * Uses logic from legacy.js to determine of project in
   * CWD is a component project or not, to determine which
   * attrs to write into sls.yml
   */
  isComponents(dir) {
    let componentConfig;
    let instanceConfig;
    try {
      componentConfig = legacyLoadComponentConfig(dir);
    } catch (e) {
      // ignore
    }
    try {
      instanceConfig = legacyLoadInstanceConfig(dir);
    } catch (e) {
      // ignore
    }
    if (!componentConfig && !instanceConfig) {
      return false;
    }
    if (instanceConfig && !instanceConfig.component) {
      return false;
    }
    return true;
  }
  /**
   * Recursive method
   * @param {*} dir
   */
  async unpack(dir, isTopLevel = false) {
    // Check if the directory contains a serverless.yml/yaml/json/js.
    // If it does, we need to unpack it
    if (getServerlessFilePath(dir) || isTopLevel) {
      this.cli.sessionStatus(`Installing node_modules via npm in ${dir}`);
      if (await fs.exists(path.resolve(dir, 'package.json'))) {
        await spawn('npm', ['install'], { cwd: dir });
      }

      if (!runningTemplate(dir)) {
        if (this.isComponents(dir)) {
          // components service
          if (!rootServerlessFileExists(dir)) {
            // single component template that does not have a parent
            await writeMainAttrs(this.cli, dir, this.tenantName, this.serviceName);
          }
        } else {
          // v1 service
          await writeMainAttrs(this.cli, dir, this.tenantName, this.serviceName, this.serviceName);
        }
      } else {
        // create root level serverless file if running templates
        await createRootServerlessFile(dir, this.serviceName, this.serviceName, this.tenantName);
      }

      const files = await fs.readdir(dir);
      await Promise.all(
        files.map(async (file) => {
          // Check if the file is a directory, or a file
          const stats = await fs.stat(`${dir}/${file}`);
          if (stats.isDirectory()) {
            return this.unpack(path.resolve(dir, file), false);
          }
          return null;
        })
      );
      return null;
    }
    return null;
  }
}

module.exports = Unpacker;
