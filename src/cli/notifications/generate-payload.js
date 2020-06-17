'use strict';

const { version } = require('../../../package');

module.exports = (instanceConfig) => {
  return {
    cliName: '@serverless/components',
    config: {
      component: instanceConfig.component,
    },
    versions: {
      '@serverless/components': version,
    },
    isDashboardEnabled: Boolean(instanceConfig.org),
  };
};
