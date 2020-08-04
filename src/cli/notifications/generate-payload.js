'use strict';

const { version } = require('../../../package');

module.exports = (serviceConfig) => {
  const config = {};

  if (serviceConfig.component) {
    config.component = serviceConfig.component;
  } else {
    config.components = [];
    for (const componentConfig of Object.values(serviceConfig)) {
      if (componentConfig.component) {
        config.components.push({ component: componentConfig.component });
      }
    }
  }
  return {
    cliName: '@serverless/components',
    config,
    versions: {
      '@serverless/components': version,
    },
    isStandalone: Boolean(process.pkg),
    isDashboardEnabled: Boolean(serviceConfig.org),
  };
};
