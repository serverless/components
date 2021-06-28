'use strict';

module.exports = Boolean(process.env.SLS_TELEMETRY_DISABLED || process.env.SLS_TRACKING_DISABLED);
