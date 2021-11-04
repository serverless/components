/**
 * Metrics for components cli
 * Author: Meng Zong <meng.zong@serverless.com>
 * Doc: https://hackmd.io/_xwPrkdET2aKKr1VWcaWjQ?view
 */

'use strict';
const path = require('path');
const ci = require('ci-info');
const { writeClientUid } = require('../utils');

const CHECKED_COMPONENTS = ['scf', 'multi-scf'];

/*
 * This functions is used for collecting event_types and event_count for scf and multi-scf components
 */
const resolveEvents = (component, inputs) => {
  if (!CHECKED_COMPONENTS.includes(component) || !inputs) {
    return null;
  }

  if (component === 'scf') {
    if (!inputs.events || inputs.events.length === 0) {
      return null;
    }

    const types = inputs.events.map((item) => Object.keys(item)[0]);

    return [types.length, types];
  } else if (component === 'multi-scf') {
    if (!inputs.triggers || inputs.triggers.length === 0) {
      return null;
    }

    const types = inputs.triggers.reduce((total, curr) => [...total, curr.type], []);
    return [types.length, types];
  }

  return null;
};

// Collect project's npm dependencies, due to this's an expensive action, we only run it when rootConfig has a **depMode** field as true
// And it will not collect sub-instance's dependencies within a template project, it will make action very slow
const npmDependencies = (p) => {
  const pkgJson = (() => {
    try {
      return require(path.resolve(p, 'package.json'));
    } catch (error) {
      return null;
    }
  })();
  if (!pkgJson) return [];
  return Array.from(
    new Set([
      ...Object.keys(pkgJson.dependencies || {}),
      ...Object.keys(pkgJson.optionalDependencies || {}),
      ...Object.keys(pkgJson.devDependencies || {}),
    ])
  );
};

/*
 * @param{string}command: the using command
 * @param{string}userId: If this is a auth command, we can get the userId(appid) for the current user
 * @param{object}rootConfig: the root yaml config in project, if project is component, it should also be instance config, or it's a template root config
 * @param{[]ojbect}configs: if this project is a template, configs contains all sub-instance's yaml config
 * @@param{string}serviceDir: It should always be the location command running
 */
module.exports = async ({
  command,
  userId = null,
  rootConfig = null,
  configs = null,
  serviceDir = process.cwd(),
}) => {
  try {
    if (!command) {
      throw new Error('command is required for sending metrics analytics');
    }

    const ciName = (() => {
      if (process.env.SERVERLESS_CI_CD) {
        return 'Serverless CI/CD';
      }

      if (process.env.SEED_APP_NAME) {
        return 'Seed';
      }

      if (ci.isCI) {
        if (ci.name) {
          return ci.name;
        }
        return 'unknown';
      }
      return 'untracked';
    })();

    const { value: clientUid } = await writeClientUid(undefined, { ciName, command }); // get client uid, if it doesn't exist, create one firstly.

    let payload = {
      event: `components.command.${command}`,
      client_uid: clientUid,
      timestamp: Date.now(),
      provider_name: 'tencent', // This should be fixed as 'tencent'
      ciName,
      outcome: 'success', // default outcome is success
    };

    // If this is an action(deploy, logs...) which needs auth, it can have a userID(appId), we save and send it, or skip it(init, invoke local...)
    if (userId) {
      payload.user_uid = userId;
    }

    try {
      payload.timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      payload.components_cli_version = require('../../../../package.json').version;
      // eslint-disable-next-line no-empty
    } catch (e) {}

    const components = []; // Which components used in this project
    const providerRuntimes = []; // which runtime used in this project

    if (rootConfig) {
      if (rootConfig.depMode) {
        payload.npmDependencies = npmDependencies(serviceDir);
      }
      if (rootConfig.stage) {
        payload.provider_stage = rootConfig.stage;
      }

      if (rootConfig.component) {
        components.push(rootConfig.component);

        if (rootConfig.inputs) {
          // Tencent supports two types for component: web and event
          if (rootConfig.inputs.type) {
            payload.type = rootConfig.inputs.type;
          }
          if (rootConfig.inputs.runtime) {
            providerRuntimes.push(rootConfig.inputs.runtime);
          }
          if (rootConfig.inputs.region) {
            payload.provider_region = rootConfig.inputs.region;
          }
        }
        // count single instance project's functions number, only works for scf and multi-scf components
        if (rootConfig.component === 'scf') {
          payload.functions_count = 1;
        } else if (
          rootConfig.component === 'multi-scf' &&
          rootConfig.inputs &&
          rootConfig.inputs.functions
        ) {
          payload.functions_count = Object.keys(rootConfig.inputs.functions).length;
        }

        const resolveEventsResult = resolveEvents(rootConfig.component, rootConfig.inputs);
        if (resolveEventsResult) {
          payload.events_count = resolveEventsResult[0];
          payload.events_type = resolveEventsResult[1];
        }
      }
    }

    // collection sub-instance's info
    if (configs) {
      for (const config of configs) {
        if (config.component) {
          components.push(config.component);
        }

        // If we already set stage from rootConfig, we do not need to set it again, because all sub-instance will inherit that value
        if (!payload.provider_stage && config.stage) {
          payload.provider_stage = config.stage;
        }

        if (config.inputs) {
          if (config.inputs.runtime) {
            providerRuntimes.push(config.inputs.runtime);
          }
          if (config.inputs.region) {
            payload.provider_region = config.inputs.region;
          }
        }

        // collect functions count for sub-instances
        if (config.component === 'scf') {
          if (payload.functions_count) {
            payload.functions_count += 1;
          } else {
            payload.functions_count = 1;
          }
        } else if (config.component === 'multi-scf' && config.inputs && config.inputs.functions) {
          const count = Object.keys(config.inputs.functions);
          if (payload.functions_count) {
            payload.functions_count += count;
          } else {
            payload.functions_count = count;
          }
        }

        // collect events for each sub-instance
        const resolveEventsResult = resolveEvents(rootConfig.component, rootConfig.inputs);
        if (resolveEventsResult) {
          if (payload.events_count) {
            payload.events_count += resolveEventsResult[0];
            payload.events_type += resolveEventsResult[1];
          } else {
            payload.events_count = resolveEventsResult[0];
            payload.events_type = resolveEventsResult[1];
          }
        }
      }
    }

    payload = {
      ...payload,
      components,
      provider_runtimes: providerRuntimes,
    };

    return payload;
  } catch (e) {
    return {};
  }
};
