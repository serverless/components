'use strict';

const { join } = require('path');
const { constants, readFile, writeFile, mkdir } = require('fs-extra');
const os = require('os');

const homedir = os.homedir();
const awsConfigDirPath = join(homedir, '.aws');
const credentialsFilePath = homedir ? join(awsConfigDirPath, 'credentials') : null;

const isWindows = process.platform === 'win32';
const profileNameRe = /^\[([^\]]+)]\s*$/;
const settingRe = /^([a-zA-Z0-9_]+)\s*=\s*([^\s]+)\s*$/;
const settingMap = new Map([
  ['aws_access_key_id', 'accessKeyId'],
  ['aws_secret_access_key', 'secretAccessKey'],
  ['aws_session_token', 'sessionToken'],
]);
const parseFileProfiles = content => {
  const profiles = new Map();
  let currentProfile;
  for (const line of content.split(/[\n\r]+/)) {
    const profileNameMatches = line.match(profileNameRe);
    if (profileNameMatches) {
      currentProfile = {};
      profiles.set(profileNameMatches[1], currentProfile);
      continue;
    }
    if (!currentProfile) continue;
    const settingMatches = line.match(settingRe);
    if (!settingMatches) continue;
    let [, settingAwsName] = settingMatches;
    settingAwsName = settingAwsName.toLowerCase();
    const settingName = settingMap.get(settingAwsName);
    if (settingName) currentProfile[settingName] = settingMatches[2];
  }
  for (const [profileName, profileData] of profiles) {
    if (!profileData.sessionToken && (!profileData.accessKeyId || !profileData.secretAccessKey)) {
      profiles.delete(profileName);
    }
  }
  return profiles;
};

const writeCredentialsContent = async (content) => {
  await writeFile(
    credentialsFilePath,
    content,
    !isWindows ? { mode: constants.S_IRUSR | constants.S_IWUSR } : null,
    writeFileError => {
      if (writeFileError) {
        if (writeFileError.code === 'ENOENT') {
          mkdir(awsConfigDirPath, !isWindows ? { mode: constants.S_IRWXU } : null, mkdirError => {
            if (mkdirError) throw mkdirError
            else return writeCredentialsContent(content)
          });
        } else {
          throw writeFileError
        }
      }
      return
    }
  )
}

const resolveFileProfiles = async () => {
  if (!credentialsFilePath) {
    return false
  }
  let content
  try {
    content = await readFile(credentialsFilePath, { encoding: 'utf8' })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    }
    throw error
  }
  return parseFileProfiles(content);
}

const resolveEnvCredentials = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const saveFileProfiles = async (profiles) => {
    if (!credentialsFilePath) throw new Error('Could not resolve path to user credentials file');
    return writeCredentialsContent(
      `${Array.from(profiles)
        .map(([name, data]) => {
          const lineTokens = [`[${name}]`];
          if (data.sessionToken) lineTokens.push(`aws_session_token=${data.sessionToken}`);
          else {
            lineTokens.push(
              `aws_access_key_id=${data.accessKeyId}`,
              `aws_secret_access_key=${data.secretAccessKey}`
            );
          }
          return `${lineTokens.join('\n')}\n`;
        })
        .join('\n')}`
    );
}

module.exports = {
  resolveFileProfiles,
  resolveEnvCredentials,
  saveFileProfiles
};
