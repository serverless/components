'use strict';

/*
 * CLI: Command: CREATE
 */

const fs = require('fs');
const fse = require('fs-extra');
const { promisify } = require('util');
const path = require('path');
const AdmZip = require('adm-zip');
const got = require('got');
const { ServerlessSDK } = require('@serverless/platform-client-china');
const { getServerlessFilePath } = require('../serverlessFile');
const spawn = require('child-process-ext/spawn');

const pipeline = promisify(require('stream.pipeline-shim'));

async function unpack(cli, dir, isTopLevel = false) {
  // Check if the directory contains a serverless.yml/yaml/json/js.
  // If it does, we need to unpack it
  if (getServerlessFilePath(dir) || isTopLevel) {
    cli.sessionStatus(`Installing node_modules via npm in ${dir}`);
    if (await fse.exists(path.resolve(dir, 'package.json'))) {
      try {
        await spawn('npm', ['install'], { cwd: dir });
      } catch (error) {
        cli.logError(
          'Failed install dependencies, make sure install dependencies manually before deploy.'
        );
        return null;
      }
    }

    const files = await fse.readdir(dir);
    for (const file of files) {
      // Check if the file is a directory, or a file
      const stats = await fse.stat(`${dir}/${file}`);
      if (stats.isDirectory()) {
        await unpack(cli, path.resolve(dir, file), false);
      }
    }
  }
  return null;
}

module.exports = async (config, cli) => {
  // Start CLI persistance status
  cli.sessionStart('Initializing', { timer: false });

  // Presentation
  cli.logLogo();
  cli.log();

  const templateName = config.t || config.template;
  if (!templateName) {
    throw new Error('Need to specify template name by using -t or --template option.');
  }

  const sdk = new ServerlessSDK();
  const template = await sdk.getPackage(templateName);
  if (!template || template.type !== 'template') {
    throw new Error(`Template "${templateName}" does not exist.`);
  }

  const targetPath = path.resolve(process.cwd(), template.name);

  cli.sessionStatus('Fetching template from registry', templateName);
  const tmpFilename = path.resolve(process.cwd(), path.basename(template.downloadKey));
  await pipeline(got.stream(template.downloadUrl), fs.createWriteStream(tmpFilename));

  cli.sessionStatus('Unpacking your new app', templateName);
  const zip = new AdmZip(tmpFilename);
  zip.extractAllTo(targetPath);
  await fs.promises.unlink(tmpFilename);

  cli.sessionStatus('Setting up your new app');
  await unpack(cli, targetPath, true);

  cli.log(`- Successfully created "${templateName}" in the current working directory.`);
  cli.log(`- Run "cd ${template.name} && serverless deploy" to deploy your new instance.`);

  cli.sessionStop('success', 'Created');
  return null;
};
