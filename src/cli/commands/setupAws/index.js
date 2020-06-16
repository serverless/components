'use strict'
const inquirer = require('@serverless/inquirer');
const open = require('open')

const {
  resolveFileProfiles,
  resolveEnvCredentials,
  saveFileProfiles
} = require('./credentials');

const isValidAwsAccessKeyId = RegExp.prototype.test.bind(/^[A-Z0-9]{10,}$/);
const isValidAwsSecretAccessKey = RegExp.prototype.test.bind(/^[a-zA-Z0-9/+]{10,}$/);

const confirm = async (message) => {
  const res = await inquirer.prompt({
    message,
    type: 'confirm',
    name: 'isConfirmed'
  })
  return res.isConfirmed
}

const awsAccessKeyIdInput = async () => {
  const { accessKeyId } = await inquirer
    .prompt({
      message: 'AWS Access Key Id:',
      type: 'input',
      name: 'accessKeyId',
      validate: input => {
        if (isValidAwsAccessKeyId(input.trim())) return true;
        return 'AWS Access Key Id seems not valid.\n   Expected something like AKIAIOSFODNN7EXAMPLE';
      },
    })
  return accessKeyId.trim()
}


const awsSecretAccessKeyInput = async () => {
  const { secretAccessKey} = await inquirer
    .prompt({
      message: 'AWS Secret Access Key:',
      type: 'input',
      name: 'secretAccessKey',
      validate: input => {
        if (isValidAwsSecretAccessKey(input.trim())) return true;
        return (
          'AWS Secret Access Key seems not valid.\n' +
          '   Expected something like wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        );
      },
    })
  return secretAccessKey.trim()
}

const confirmAws = async () => {
  const hasAws = await confirm('An AWS account is required to deploy, do you have an account?')
  // Prompt the user to sign up, if they don't have an account
  if (!hasAws) {
    open('https://portal.aws.amazon.com/billing/signup');
    await inquirer.prompt({
      message: 'Press Enter to continue after creating an AWS account',
      name: 'createAwsAccountPrompt',
    });
  }
  const accessKeyId = await awsAccessKeyIdInput()
  const secretAccessKey = await awsSecretAccessKeyInput()
  return { accessKeyId, secretAccessKey }
}

module.exports = async (config, cli) => {
  cli.status('Checking for AWS credentials');
  if (resolveEnvCredentials()) {
    cli.status('Successfully found credentials in ENV');
    return true
  }
  if (await resolveFileProfiles()) {
    cli.status('Successfully found credentials in home directory');
    return true
  }
  // Close CLI silently so that inquirer works
  cli.close('silent')
  const { accessKeyId, secretAccessKey } = await confirmAws()
  return saveFileProfiles(new Map([['default', { accessKeyId, secretAccessKey }]]))
}
