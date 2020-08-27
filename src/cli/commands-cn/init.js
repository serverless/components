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
const spawn = require('child-process-ext/spawn');
const { parseYaml, saveYaml } = require('./utils');

const pipeline = promisify(require('stream.pipeline-shim'));

async function unpack(cli, dir) {
  if (await fse.exists(path.resolve(dir, 'package.json'))) {
    cli.sessionStatus(`Installing node_modules via npm in ${dir}`);
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
    // skip node_modules folder
    if (file === 'node_modules') {
      continue;
    }
    // Check if the file is a directory, or a file
    const stats = await fse.stat(`${dir}/${file}`);
    if (stats.isDirectory()) {
      await unpack(cli, path.resolve(dir, file));
    }
  }
  return null;
}

const initTemplateFromCli = async (targetPath, packageName, registryPackage, cli, appName) => {
  cli.sessionStatus('Fetching template from registry', packageName);
  const tmpFilename = path.resolve(path.basename(registryPackage.downloadKey));
  await pipeline(got.stream(registryPackage.downloadUrl), fs.createWriteStream(tmpFilename));

  cli.sessionStatus('Unpacking your new app', packageName);
  const zip = new AdmZip(tmpFilename);
  zip.extractAllTo(targetPath);
  // Need to polyfill this promise feature for support of nodejs>=8
  if (fs.promises) {
    await fs.promises.unlink(tmpFilename);
  } else {
    const unlink = promisify(fs.unlink);
    await unlink(tmpFilename);
  }

  cli.sessionStatus('app.YAML processd');
  const serverlessFilePath = path.resolve(targetPath, 'serverless.yml');
  if (!(await fse.existsSync(serverlessFilePath))) {
    await fse.createFile(serverlessFilePath);
  }
  const serverlessFile = await parseYaml(serverlessFilePath);
  if (appName) {
    serverlessFile.app = appName;
  }

  await saveYaml(serverlessFilePath, serverlessFile);

  cli.sessionStatus('app.YAML processd end');

  cli.sessionStatus('Setting up your new app');
  await unpack(cli, targetPath);
};

const init = async (config, cli) => {
  // Start CLI persistance status
  cli.sessionStart('Initializing', { timer: false });

  // Presentation
  cli.logLogo();
  cli.log();

  let packageName = config.t || config.template;
  if (!packageName) {
    if (config.params && config.params.length > 0) {
      packageName = config.params[0];
    } else {
      throw new Error(
        'Need to specify component or template name. e.g. "serverless init some-template".'
      );
    }
  }

  const sdk = new ServerlessSDK();
  const registryPackage = await sdk.getPackage(packageName);
  if (!registryPackage) {
    throw new Error(`Serverless Registry Package "${packageName}" does not exist.`);
  }
  // registryPackage.component will be null if component is not found
  // this is the design for platform API backward compatibility
  delete registryPackage.component;
  if (Object.keys(registryPackage).length === 0) {
    throw new Error(`Serverless Registry Package "${packageName}" does not exist.`);
  }

  const targetName = config.name || packageName;
  const targetPath = path.resolve(targetName);

  if (registryPackage.type !== 'template') {
    await fse.mkdir(targetPath);
    const envDestination = path.resolve(targetPath, 'serverless.yml');
    const envConfig = `component: ${packageName}\nname: ${targetName}\ninputs:\n`;
    await fse.writeFile(envDestination, envConfig);
  } else {
    await initTemplateFromCli(targetPath, packageName, registryPackage, cli, targetName);
  }

  cli.log(`- Successfully created "${targetName}" in the current working directory.`);
  cli.log(`- Run "cd ${targetName} && serverless deploy" to deploy your new application.`);

  cli.sessionStop('success', 'Created');
  return null;
};

module.exports = {
  init,
  initTemplateFromCli,
};
