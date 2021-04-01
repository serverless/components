'use strict';

/*
 * CLI: Command: CREATE
 */

const fs = require('fs');
const fse = require('fs-extra');
const { promisify } = require('util');
const path = require('path');
const stream = require('stream');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const got = require('got');
const { ServerlessSDK } = require('@serverless/platform-client-china');
const spawn = require('child-process-ext/spawn');
const { parseYaml, saveYaml } = require('./utils');

const pipeline = promisify(stream.pipeline);

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
  await fs.promises.unlink(tmpFilename);

  cli.sessionStatus('app.YAML processd');
  let serverlessFilePath = path.resolve(targetPath, 'serverless.yaml');

  // Both yaml and yml is valid config file, if neither of them exist, create a new yml file
  if (!(await fse.existsSync(serverlessFilePath))) {
    const serverlessYmlFilePath = path.resolve(targetPath, 'serverless.yml');
    if (await fse.existsSync(serverlessYmlFilePath)) {
      serverlessFilePath = serverlessYmlFilePath;
    } else {
      await fse.createFile(serverlessFilePath);
    }
  }

  const ymlOriginal = await fse.readFile(serverlessFilePath, 'utf8');
  const ymlParsed = await parseYaml(serverlessFilePath);

  if (appName && ymlParsed.app) {
    const newYmlContent = ymlOriginal.replace(
      /^app:\s\S*/m,
      `app: ${appName}-${uuidv4().split('-')[0]}`
    );
    await fse.writeFile(serverlessFilePath, newYmlContent, 'utf8');
  }

  if (appName && !ymlParsed.app) {
    ymlParsed.app = appName;
    await saveYaml(serverlessFilePath, ymlParsed);
  }

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
      throw new Error('请指定 component 或 template 名称，如: "serverless init scf-starter"');
    }
  }

  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });
  const registryPackage = await sdk.getPackage(packageName);
  if (!registryPackage) {
    throw new Error(`查询的包 "${packageName}" 不存在.`);
  }
  // registryPackage.component will be null if component is not found
  // this is the design for platform API backward compatibility
  delete registryPackage.component;
  if (Object.keys(registryPackage).length === 0) {
    throw new Error(`查询的包 "${packageName}" 不存在.`);
  }

  const targetName = config.name || packageName;
  const targetPath = path.resolve(targetName);

  if (registryPackage.type !== 'template') {
    await fse.mkdir(targetPath);
    const envDestination = path.resolve(targetPath, 'serverless.yml');
    const envConfig = `component: ${packageName}\nname: ${targetName}\napp: ${targetName}-${
      uuidv4().split('-')[0]
    }\ninputs:\n`;
    await fse.writeFile(envDestination, envConfig);
  } else {
    await initTemplateFromCli(targetPath, packageName, registryPackage, cli, targetName);
  }

  cli.log(`- 项目 "${packageName}" 已在当前目录成功创建`);
  cli.log(`- 执行 "cd ${targetName} && serverless deploy" 部署应用`);

  cli.sessionStop('success', '创建成功');
  return null;
};

module.exports = {
  init,
  initTemplateFromCli,
};
