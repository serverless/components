'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { v4 } = require('uuid');
const fse = require('fs-extra');
const { printOutput, colorLog } = require('./utils');

module.exports = async (event, context, handlerFile, handlerFunc, cli) => {
  const tempResFile = `serverless_res_${v4().split('-')[0]}.txt`;
  const tempPhpFile = `serverless_tmep_${v4().split('-')[0]}.php`;
  fse.createFileSync(tempResFile);

  const tempPyFileContent = `
  <?php
  include '${handlerFile}.php';

  $event = new stdClass();
  $eventVars = get_object_vars(json_decode('${JSON.stringify(event)}'));
  foreach($eventVars as $key=>$value) {
    $event->$key = $value;
  }

  $context = new stdClass();
  $contextVars = get_object_vars(json_decode('${JSON.stringify(context)}'));
  foreach($contextVars as $key=>$value) {
    $context->$key = $value;
  }

  $res = ${handlerFunc}($event, $context);
  $myfile = fopen("${tempResFile}", "w");

  fwrite($myfile, $res);
  fclose($myfile);
  ?>`;
  fse.writeFileSync(tempPhpFile, tempPyFileContent);
  try {
    const res = spawn(`${process.env.INVOKE_LOCAL_PHP || 'php'}`, [
      path.join(process.cwd(), tempPhpFile),
    ]);
    res.stdout.on('data', (d) => {
      console.log(d.toString());
    });

    res.stderr.on('data', (data) => {
      // we need to remove the error which is from the temp python file, directly show the origin error
      const errData = data.toString().split('\n');
      errData.splice(1, 2);

      cli.log('---------------------------------------------');
      fse.unlinkSync(tempPhpFile);
      fse.unlinkSync(tempResFile);
      colorLog(`调用错误\n\n ${errData.join('\n').toString()}`, 'red', cli);
      process.exit();
    });

    res.on('close', () => {
      let data = fse.readFileSync(tempResFile).toString();
      try {
        data = JSON.parse(data);
        // eslint-disable-next-line no-empty
      } catch (e) {}
      printOutput(cli, data);

      fse.unlinkSync(tempPhpFile);
      fse.unlinkSync(tempResFile);
    });
  } catch (e) {
    printOutput(cli, null, e);
    fse.unlinkSync(tempPhpFile);
    fse.unlinkSync(tempResFile);
  }
};
