'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { v4 } = require('uuid');
const fse = require('fs-extra');
const { printOutput, colorLog } = require('./utils');

module.exports = async (event, context, handlerFile, handlerFunc, cli) => {
  const tempResFile = `serverless_res_${v4().split('-')[0]}.txt`;
  const tempPyFile = `serverless_tmep_${v4().split('-')[0]}.py`;
  fse.createFileSync(tempResFile);

  const tempPyFileContent = `
# -*- coding: utf-8 -*-
import json
from ${handlerFile} import ${handlerFunc}

res = ${handlerFunc}(${JSON.stringify(event)},${JSON.stringify(context)})
f = open('${tempResFile}', 'w')
json.dump(res, f)
f.close()`;

  fse.writeFileSync(tempPyFile, tempPyFileContent);
  try {
    const res = spawn(`${process.env.INVOKE_LOCAL_PYTHON || 'python'}`, [
      path.join(process.cwd(), tempPyFile),
    ]);
    res.stdout.on('data', (d) => {
      console.log(d.toString());
    });

    res.stderr.on('data', (data) => {
      // we need to remove the error which is from the temp python file, directly show the origin error
      const errData = data.toString().split('\n');
      errData.splice(1, 2);

      cli.log('---------------------------------------------');
      fse.unlinkSync(tempPyFile);
      fse.unlinkSync(tempResFile);
      colorLog(`调用错误\n\n ${errData.join('\n').toString()}`, 'red', cli);
      process.exit();
    });

    res.on('close', () => {
      const data = fse.readFileSync(tempResFile);
      printOutput(cli, JSON.parse(data.toString()));

      fse.unlinkSync(tempPyFile);
      fse.unlinkSync(tempResFile);
    });
  } catch (e) {
    printOutput(cli, null, e);
  }
};
