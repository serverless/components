'use strict'

const readFile = require('fs');
const os = require('os');
const { join } = require('path');

const homedir = os.homedir();
const awsConfigDirPath = join(homedir, '.aws');
const credentialsFilePath = homedir ? join(awsConfigDirPath, 'credentials') : null;
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

module.exports = async () => {
  if (!credentialsFilePath) {
    return false;
  }
  let content
  try {
    content = await readFile(credentialsFilePath, { encoding: 'utf8' })
  } catch (error) {
    return false;
  }
  return parseFileProfiles(content)
}
