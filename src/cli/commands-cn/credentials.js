'use strict';

const path = require('path');
const os = require('os');
const fse = require('fs-extra');
const { fileExistsSync, loadCredentialsToJson, writeJsonToCredentials } = require('../utils');

const globalTencentCredentials = path.join(os.homedir(), '.serverless/tencent/credentials');

module.exports = async (config, cli) => {
  const subCommand = config.params[0];

  if (subCommand === 'set') {
    const { secretId, secretKey, section } = config;
    if (!secretId) {
      throw new Error('缺少secretId, 请使用 --secretId 指定');
    }
    if (!secretKey) {
      throw new Error('缺少secretKey, 请使用 --secretKey 指定');
    }

    if (!section) {
      throw new Error('缺少section, 请使用 --section 指定全局认证文件中要设置的section');
    }

    try {
      if (!fileExistsSync(globalTencentCredentials)) {
        fse.createFileSync(globalTencentCredentials);
      }
      const credContent = loadCredentialsToJson(globalTencentCredentials);
      if (credContent[section]) {
        credContent[section] = {
          ...credContent[section],
          TENCENT_SECRET_KEY: secretKey,
          TENCENT_SECRET_ID: secretId,
        };
      } else {
        credContent[section] = { TENCENT_SECRET_KEY: secretKey, TENCENT_SECRET_ID: secretId };
      }
      writeJsonToCredentials(globalTencentCredentials, credContent);
      cli.log('更新Serverless全局认证信息成功');
    } catch (e) {
      cli.log(
        `更新Serverless全局认证信息失败, 配置文件地址: ${globalTencentCredentials}, 错误信息: ${e.message}`,
        'red'
      );
    }
  }

  if (subCommand === 'revoke') {
    const { section } = config;
    if (!section) {
      throw new Error('缺少section, 请使用 --section 指定全局认证文件中要设置的section');
    }

    if (fileExistsSync(globalTencentCredentials)) {
      try {
        const credContent = loadCredentialsToJson(globalTencentCredentials);
        if (!credContent[section]) {
          cli.log(`配置文件 ${globalTencentCredentials} 中没有要删除的部分: ${section}`);
          return;
        }
        delete credContent[section];
        writeJsonToCredentials(globalTencentCredentials, credContent);
        cli.log('废除认证信息成功');
      } catch (e) {
        cli.log(`废除认证配置失败, 错误:${e.message}`, 'red');
      }
    } else {
      cli.log(`无法找到全局认证配置文件:${globalTencentCredentials}, 取消失败`);
    }
  }
};
