const AWS = require('aws-sdk')
const CloudWatchEvents = new AWS.CloudWatchEvents()

CloudWatchEvents.describeRule({ Name: 'eahefnawy000000000' })
  .promise()
  .then((res) => console.log(res))
  .catch((e) => console.log(e))

/*
 * { Name: 'eahefnawy000',
  Arn: 'arn:aws:events:us-east-1:552750238299:rule/eahefnawy000',
  ScheduleExpression: 'rate(3 minutes)',
  State: 'ENABLED' }


 code ResourceNotFoundException
 */
