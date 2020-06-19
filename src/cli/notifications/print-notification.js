'use strict';

const chalk = require('chalk');
const processBackendNotificationRequest = require('@serverless/utils/process-backend-notification-request');

module.exports = (cli, notifications) => {
  const notification = processBackendNotificationRequest(notifications);
  if (notification) {
    const borderLength = Math.min(notification.message.length, process.stdout.columns) || 10;
    cli.log(
      `${'*'.repeat(borderLength)}\n${chalk.bold(notification.message)}\n${'*'.repeat(
        borderLength
      )}\n`
    );
  }
};
