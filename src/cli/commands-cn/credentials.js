'use strict';

const path = require('path');
const os = require('os');
const fse = require('fs-extra');
const { fileExistsSync } = require('../utils');

const globalTencentEnvFilePath = path.join(os.homedir(), '.tencent_serverless.env');
const validCredentialsFields = ['secretId', 'secretKey'];
const contentKeyMap = {
  secretId: 'TENCENT_SECRET_ID',
  secretKey: 'TENCENT_SECRET_KEY',
};

module.exports = async (config, cli) => {
  const subCommand = config.params[0];

  if (subCommand === 'set') {
    const { secretId, secretKey } = config;
    if (!secretId) {
      throw new Error('缺少secretId, 请使用 --secretId 指定');
    }
    if (!secretKey) {
      throw new Error('缺少secretKey, 请使用 --secretKey 指定');
    }

    try {
      if (!fileExistsSync(globalTencentEnvFilePath)) {
        fse.createFileSync(globalTencentEnvFilePath);
      }
      let content = '';

      validCredentialsFields.forEach((field) => {
        if (config[field] && contentKeyMap[field]) {
          content += `${contentKeyMap[field]}=${config[field]}\n`;
        }
      });
      fse.writeFileSync(globalTencentEnvFilePath, content);
      cli.log('更新Serverless全局认证信息成功');
    } catch (e) {
      cli.log(
        `更新Serverless全局认证信息失败, 配置文件地址: ${globalTencentEnvFilePath}, 错误信息: ${e.message}`,
        'red'
      );
    }
  }

  if (subCommand === 'revoke') {
    if (fileExistsSync(globalTencentEnvFilePath)) {
      try {
        fse.writeFileSync(globalTencentEnvFilePath, '');
        cli.log('废除全局认证信息成功');
      } catch (e) {
        cli.log(`废除全局认证配置失败, 错误:${e.message}`, 'red');
      }
    } else {
      cli.log(`无法找到全局认证配置文件:${globalTencentEnvFilePath}, 取消失败`);
    }
  }
};
