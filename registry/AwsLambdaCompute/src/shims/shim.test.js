import fn from './fn'
import shim from './shim'

jest.mock('./fn')

const ctxMock = {
  functionName: 'abc',
  awsRequestId: 'zxc'
}

const expectedContext = {
  name: ctxMock.functionName,
  invocationId: ctxMock.awsRequestId,
  provider: ctxMock
}

beforeEach(() => {
  process.env.SERVERLESS_HANDLER = 'fn.hello'
  process.env.AWS_REGION = 'us-east-1'
})

afterEach(() => {
  jest.restoreAllMocks()
  delete process.env.SERVERLESS_HANDLER
  delete process.env.AWS_REGION
})

describe('Shim Tests', () => {
  describe('Async Events', () => {
    it('should transform S3 events', async () => {
      const expectedCloudEvent = {
        eventTime: '2018-10-12T15:01:32.243Z',
        eventID: '1',
        eventType: 'aws.s3.ObjectCreated.Put',
        source: 'arn:aws:s3:::bucketName',
        data: {
          key: 'abc.pdf',
          size: 86333,
          eTag: 'a28c44f97c7edff74fd25bed8b7e3e0e',
          sequencer: '005BC0B74C2E7FEF50',
          bucket: 'bucketName'
        }
      }

      const eventMock = {
        Records: [
          {
            eventVersion: '2.0',
            eventSource: 'aws:s3',
            awsRegion: 'us-east-1',
            eventTime: '2018-10-12T15:01:32.243Z',
            eventID: '1',
            eventName: 'ObjectCreated:Put',
            userIdentity: {
              principalId: 'A3TMYWB7ZSTS35'
            },
            requestParameters: {
              sourceIPAddress: '88.238.77.46'
            },
            responseElements: {
              'x-amz-request-id': 'CF8FCBF939812FAC',
              'x-amz-id-2':
                'ok7oB60tSYepDWlHsK1BSQc9PHRHZCwD2VCKhHTfC8KEXkxVQkJI+wrqaNAacZeaJztWG6wCweI='
            },
            s3: {
              s3SchemaVersion: '1.0',
              configurationId: 'bc826ea4-1d68-4ea8-b614-da417c7d5add',
              bucket: {
                name: 'bucketName',
                ownerIdentity: {
                  principalId: 'A3TMYWB7ZSTS35'
                },
                arn: 'arn:aws:s3:::bucketName'
              },
              object: {
                key: 'abc.pdf',
                size: 86333,
                eTag: 'a28c44f97c7edff74fd25bed8b7e3e0e',
                sequencer: '005BC0B74C2E7FEF50'
              }
            }
          }
        ]
      }

      shim.handler(eventMock, ctxMock, () => {})

      expect(fn.hello).toBeCalledWith(expectedCloudEvent, expectedContext)
    })

    it('should transform SNS events', async () => {
      const expectedCloudEvent = {
        eventTime: 1,
        eventID: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
        eventType: 'aws.sns',
        source: 'arn:aws:abc',
        data: {
          message: 'Hello from SNS!',
          messageId: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
          type: 'Notification',
          subject: 'TestInvoke'
        }
      }

      const eventMock = {
        Records: [
          {
            EventVersion: '1.0',
            eventTime: 1,
            EventSubscriptionArn: 'arn:aws:abc',
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
              TopicArn: 'arn:aws:abc',
              Subject: 'TestInvoke'
            }
          }
        ]
      }

      shim.handler(eventMock, ctxMock, () => {})

      expect(fn.hello).toBeCalledWith(expectedCloudEvent, expectedContext)
    })

    it('should transform SES events', async () => {
      const expectedCloudEvent = {
        eventTime: 1,
        eventID: 'o3vrnil0e2ic28tr',
        eventType: 'aws.ses',
        source: 'aws.ses',
        data: {
          mail: {
            commonHeaders: {
              from: ['janedoe@example.com'],
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
                value: 'janedoe@example.com'
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
                value: 'janedoe@example.com'
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
        }
      }

      const eventMock = {
        Records: [
          {
            eventVersion: '1.0',
            eventTime: 1,
            ses: {
              mail: {
                commonHeaders: {
                  from: ['janedoe@example.com'],
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
                    value: 'janedoe@example.com'
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
                    value: 'janedoe@example.com'
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

      shim.handler(eventMock, ctxMock, () => {})

      expect(fn.hello).toBeCalledWith(expectedCloudEvent, expectedContext)
    })

    it('should transform SQS events', async () => {
      const expectedCloudEvent = {
        eventTime: 1,
        eventID: 'c80e8021-a70a-42c7-a470-796e1186f753',
        eventType: 'aws.sqs',
        source: 'arn:aws:sqs:us-west-2:594035263019:NOTFIFOQUEUE',
        data: JSON.parse('{"foo":"bar"}')
      }

      const eventMock = {
        Records: [
          {
            messageId: 'c80e8021-a70a-42c7-a470-796e1186f753',
            eventTime: 1,
            receiptHandle: 'abc',
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

      shim.handler(eventMock, ctxMock, () => {})

      expect(fn.hello).toBeCalledWith(expectedCloudEvent, expectedContext)
    })

    it('should transform Dynamo events', async () => {
      const expectedCloudEvent = {
        eventTime: 1,
        eventID: '1',
        eventType: `aws.dynamodb.insert`,
        source: 'arn:aws:abc',
        data: {
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
        }
      }

      const eventMock = {
        Records: [
          {
            eventID: '1',
            eventTime: 1,
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
            eventSourceARN: 'arn:aws:abc',
            eventSource: 'aws:dynamodb'
          }
        ]
      }

      shim.handler(eventMock, ctxMock, () => {})

      expect(fn.hello).toBeCalledWith(expectedCloudEvent, expectedContext)
    })
  })

  describe('Sync Events', () => {
    it('should transform APIG events', async () => {
      const eventMock = {
        path: '/users/create',
        httpMethod: 'GET',
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        },
        requestContext: {
          path: '/dev/users/create',
          requestId: 'c80c222f-ce1a-11e8-a26c-cfb9801fd8db',
          apiId: 'pmpprxgr46'
        },
        body: null,
        eventTime: 1
      }

      const expectedCloudEvent = {
        eventTime: 1,
        eventID: eventMock.requestContext.requestId,
        eventType: 'aws.apigateway.http',
        source: 'https://pmpprxgr46.execute-api.us-east-1.amazonaws.com/dev/users/create',
        data: eventMock
      }

      shim.handler(eventMock, ctxMock, () => {})

      expect(fn.hello).toBeCalledWith(expectedCloudEvent, expectedContext)
    })
    it('should NOT transform direct invocations', async () => {
      const eventMock = {
        hello: 'world'
      }

      shim.handler(eventMock, ctxMock, () => {})

      expect(fn.hello).toBeCalledWith(eventMock, expectedContext)
    })
  })
})
