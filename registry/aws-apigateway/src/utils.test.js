const { generateUrl, generateUrls } = require('./utils')

describe('Component aws-apigateway - Utils', () => {
  describe('#generateUrl()', () => {
    const restApiId = 'r35t4p11d'

    it('should generate the API Gateway base url', () => {
      const res = generateUrl(restApiId)
      expect(res).toEqual(`https://${restApiId}.execute-api.us-east-1.amazonaws.com/dev/`)
    })

    it('should be possible to set the region', () => {
      const region = 'eu-central-1'
      const res = generateUrl(restApiId, region)
      expect(res).toEqual(`https://${restApiId}.execute-api.${region}.amazonaws.com/dev/`)
    })

    it('should be possible to set the stage', () => {
      const region = 'eu-west-1'
      const stage = 'prod'
      const res = generateUrl(restApiId, region, stage)
      expect(res).toEqual(`https://${restApiId}.execute-api.${region}.amazonaws.com/${stage}/`)
    })

    it('should append a slash at the end of the generated url', () => {
      const res = generateUrl(restApiId)
      expect(res).toMatch(/^.+\/$/)
    })
  })

  describe('#generateUrls()', () => {
    const restApiId = 'r35t4p11d'
    const routes = {
      foo: {
        GET: {
          function: 'foo-function'
        }
      },
      '/bar': {
        post: {
          function: 'bar-function'
        }
      }
    }

    it('should generate the distinct URLs for the given paths', () => {
      const res = generateUrls(routes, restApiId)
      expect(res).toEqual([
        `https://${restApiId}.execute-api.us-east-1.amazonaws.com/dev/foo`,
        `https://${restApiId}.execute-api.us-east-1.amazonaws.com/dev/bar`
      ])
    })
  })
})
