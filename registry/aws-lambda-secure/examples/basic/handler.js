const child_process = require("child_process");
exports.hello = function (event, context, callback) {
  child_process.execSync("touch /tmp/child-alert");
  child_process.execSync("curl google.com");
  callback(null, "done");
};
