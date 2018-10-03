process.env.SERVERLESS_HANDLER = 'index.hello'
const shim = require('./shim')

const s3Event = {
  Records: [
    {
      eventVersion: '2.0',
      eventTime: '1970-01-01T00:00:00.000Z',
      requestParameters: {
        sourceIPAddress: '127.0.0.1'
      },
      s3: {
        configurationId: 'testConfigRule',
        object: {
          sequencer: '0A1B2C3D4E5F678901',
          key: 'HappyFace.jpg'
        },
        bucket: {
          arn: 'arn:aws:qwertyui',
          name: 'sourcebucket',
          ownerIdentity: {
            principalId: 'EXAMPLE'
          }
        },
        s3SchemaVersion: '1.0'
      },
      responseElements: {
        'x-amz-id-2': 'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
        'x-amz-request-id': 'EXAMPLE123456789'
      },
      awsRegion: 'us-east-1',
      eventName: 'ObjectRemoved:Delete',
      userIdentity: {
        principalId: 'EXAMPLE'
      },
      eventSource: 'aws:s3'
    }
  ]
}

const sqsEvent = {
  Records: [
    {
      messageId: 'c80e8021-a70a-42c7-a470-796e1186f753',
      receiptHandle:
        'AQEBJQ+/u6NsnT5t8Q/VbVxgdUl4TMKZ5FqhksRdIQvLBhwNvADoBxYSOVeCBXdnS9P+erlTtwEALHsnBXynkfPLH3BOUqmgzP25U8kl8eHzq6RAlzrSOfTO8ox9dcp6GLmW33YjO3zkq5VRYyQlJgLCiAZUpY2D4UQcE5D1Vm8RoKfbE+xtVaOctYeINjaQJ1u3mWx9T7tork3uAlOe1uyFjCWU5aPX/1OHhWCGi2EPPZj6vchNqDOJC/Y2k1gkivqCjz1CZl6FlZ7UVPOx3AMoszPuOYZ+Nuqpx2uCE2MHTtMHD8PVjlsWirt56oUr6JPp9aRGo6bitPIOmi4dX0FmuMKD6u/JnuZCp+AXtJVTmSHS8IXt/twsKU7A+fiMK01NtD5msNgVPoe9JbFtlGwvTQ==',
      body: '{"foo":"bar"}',
      attributes: {
        ApproximateReceiveCount: '3',
        SentTimestamp: '1529104986221',
        SenderId: '594035263019',
        ApproximateFirstReceiveTimestamp: '1529104986230'
      },
      messageAttributes: {},
      md5OfBody: '9bb58f26192e4ba00f01e2e7b136bbd8',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-west-2:594035263019:NOTFIFOQUEUE',
      awsRegion: 'us-west-2'
    }
  ]
}

const sesEvent = {
  Records: [
    {
      eventVersion: '1.0',
      ses: {
        mail: {
          commonHeaders: {
            from: ['Jane Doe <janedoe@example.com>'],
            to: ['johndoe@example.com'],
            returnPath: 'janedoe@example.com',
            messageId: '<0123456789example.com>',
            date: 'Wed, 7 Oct 2015 12:34:56 -0700',
            subject: 'Test Subject'
          },
          source: 'janedoe@example.com',
          timestamp: '1970-01-01T00:00:00.000Z',
          destination: ['johndoe@example.com'],
          headers: [
            {
              name: 'Return-Path',
              value: '<janedoe@example.com>'
            },
            {
              name: 'Received',
              value:
                'from mailer.example.com (mailer.example.com [203.0.113.1]) by inbound-smtp.us-west-2.amazonaws.com with SMTP id o3vrnil0e2ic for johndoe@example.com; Wed, 07 Oct 2015 12:34:56 +0000 (UTC)'
            },
            {
              name: 'DKIM-Signature',
              value:
                'v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=example; h=mime-version:from:date:message-id:subject:to:content-type; bh=jX3F0bCAI7sIbkHyy3mLYO28ieDQz2R0P8HwQkklFj4=; b=sQwJ+LMe9RjkesGu+vqU56asvMhrLRRYrWCbV'
            },
            {
              name: 'MIME-Version',
              value: '1.0'
            },
            {
              name: 'From',
              value: 'Jane Doe <janedoe@example.com>'
            },
            {
              name: 'Date',
              value: 'Wed, 7 Oct 2015 12:34:56 -0700'
            },
            {
              name: 'Message-ID',
              value: '<0123456789example.com>'
            },
            {
              name: 'Subject',
              value: 'Test Subject'
            },
            {
              name: 'To',
              value: 'johndoe@example.com'
            },
            {
              name: 'Content-Type',
              value: 'text/plain; charset=UTF-8'
            }
          ],
          headersTruncated: false,
          messageId: 'o3vrnil0e2ic28tr'
        },
        receipt: {
          recipients: ['johndoe@example.com'],
          timestamp: '1970-01-01T00:00:00.000Z',
          spamVerdict: {
            status: 'PASS'
          },
          dkimVerdict: {
            status: 'PASS'
          },
          processingTimeMillis: 574,
          action: {
            type: 'Lambda',
            invocationType: 'Event',
            functionArn: 'arn:aws:lambda:us-west-2:012345678912:function:Example'
          },
          spfVerdict: {
            status: 'PASS'
          },
          virusVerdict: {
            status: 'PASS'
          }
        }
      },
      eventSource: 'aws:ses'
    }
  ]
}

const snsEvent = {
  Records: [
    {
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:qwertyui',
      EventSource: 'aws:sns',
      Sns: {
        SignatureVersion: '1',
        Timestamp: '1970-01-01T00:00:00.000Z',
        Signature: 'EXAMPLE',
        SigningCertUrl: 'EXAMPLE',
        MessageId: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
        Message: 'Hello from SNS!',
        MessageAttributes: {
          Test: {
            Type: 'String',
            Value: 'TestString'
          },
          TestBinary: {
            Type: 'Binary',
            Value: 'TestBinary'
          }
        },
        Type: 'Notification',
        UnsubscribeUrl: 'EXAMPLE',
        TopicArn: 'arn:aws:dhfgsdfas',
        Subject: 'TestInvoke'
      }
    }
  ]
}

const dynamoDbEvent = {
  Records: [
    {
      eventID: '1',
      eventVersion: '1.0',
      dynamodb: {
        Keys: {
          Id: {
            N: '101'
          }
        },
        NewImage: {
          Message: {
            S: 'New item!'
          },
          Id: {
            N: '101'
          }
        },
        StreamViewType: 'NEW_AND_OLD_IMAGES',
        SequenceNumber: '111',
        SizeBytes: 26
      },
      awsRegion: 'us-west-2',
      eventName: 'INSERT',
      eventSourceARN: 'arn:aws:asdfsadlj',
      eventSource: 'aws:dynamodb'
    },
    {
      eventID: '2',
      eventVersion: '1.0',
      dynamodb: {
        OldImage: {
          Message: {
            S: 'New item!'
          },
          Id: {
            N: '101'
          }
        },
        SequenceNumber: '222',
        Keys: {
          Id: {
            N: '101'
          }
        },
        SizeBytes: 59,
        NewImage: {
          Message: {
            S: 'This item has changed'
          },
          Id: {
            N: '101'
          }
        },
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      awsRegion: 'us-west-2',
      eventName: 'MODIFY',
      eventSourceARN: 'arn:aws:asdfsadlj',
      eventSource: 'aws:dynamodb'
    },
    {
      eventID: '3',
      eventVersion: '1.0',
      dynamodb: {
        Keys: {
          Id: {
            N: '101'
          }
        },
        SizeBytes: 38,
        SequenceNumber: '333',
        OldImage: {
          Message: {
            S: 'This item has changed'
          },
          Id: {
            N: '101'
          }
        },
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      awsRegion: 'us-west-2',
      eventName: 'REMOVE',
      eventSourceARN: 'arn:aws:asdfsadlj',
      eventSource: 'aws:dynamodb'
    }
  ]
}

const ctx = {
  functionName: 'hello',
  invocationId: 'wertyuio'
}

const cb = () => {}

shim.handler(dynamoDbEvent, ctx, cb)
