'use strict';

/*
 * CLI: Command: CREATE
 */

const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const AdmZip = require('adm-zip');
const got = require('got');
const { ServerlessSDK } = require('@serverless/platform-client-china');

const pipeline = promisify(require('stream.pipeline-shim'));

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

  cli.sessionStatus('Downloading', templateName);

  const tmpFilename = path.resolve(process.cwd(), path.basename(template.downloadKey));
  await pipeline(got.stream(template.downloadUrl), fs.createWriteStream(tmpFilename));

  cli.sessionStatus('Creating', templateName);
  const zip = new AdmZip(tmpFilename);
  zip.extractAllTo(path.resolve(process.cwd(), template.name));
  await fs.promises.unlink(tmpFilename);

  cli.log(`- Successfully created "${templateName}" instance in the current working directory.`);

  cli.log("- Don't forget to update serverless.yml and install dependencies if needed.");

  cli.log('- Whenever you\'re ready, run "serverless deploy" to deploy your new instance.');

  cli.sessionStop('success', 'Created');
  return null;
};
