import { getSwaggerDefinition, flattenRoutes, normalizeRoutes } from './utils'

describe('RestApi - utils', () => {
  describe('#getSwaggerDefinition()', () => {
    const name = 'my-swagger-definition'
    const roleArn = 'arn:aws:iam::XXXXX:role/some-role-name'
    const accountId = '558750028299'

    it('should generate a valid basic swagger definition', () => {
      let routes = {
        '/foo': {
          '/bar': {
            get: {
              function: {
                functionName: 'funcOne'
              }
            },
            '/baz': {
              '/{...qux}': {
                post: {
                  function: {
                    functionName: 'funcTwo'
                  }
                }
              }
            }
          }
        }
      }
      routes = normalizeRoutes(flattenRoutes(routes))

      const res = getSwaggerDefinition(name, roleArn, routes, accountId)

      expect(res.swagger).toEqual('2.0')
      expect(res.info).toEqual(expect.any(Object))
      expect(res.schemes).toEqual(['https'])
      expect(res.consumes).toEqual(['application/json'])
      expect(res.produces).toEqual(['application/json'])
      expect(res.securityDefinitions).toEqual({})

      expect(Object.keys(res.paths)).toHaveLength(2)
      expect(res.paths['/foo/bar']).toEqual({
        get: {
          responses: { '200': { description: 'Success' } },
          'x-amazon-apigateway-integration': {
            credentials: 'arn:aws:iam::XXXXX:role/some-role-name',
            httpMethod: 'POST',
            responses: { default: { statusCode: '200' } },
            type: 'aws_proxy',
            uri:
              'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:558750028299:function:funcOne/invocations'
          }
        }
      })
      expect(res.paths['/foo/bar/baz/{qux+}']).toEqual({
        post: {
          responses: { '200': { description: 'Success' } },
          'x-amazon-apigateway-integration': {
            credentials: 'arn:aws:iam::XXXXX:role/some-role-name',
            httpMethod: 'POST',
            responses: { default: { statusCode: '200' } },
            type: 'aws_proxy',
            uri:
              'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:558750028299:function:funcTwo/invocations'
          }
        }
      })
    })
  })

  describe('#flattenRoutes()', () => {
    it('should throw if single-key-only route is not a HTTP method', () => {
      const routes = {
        foo: 'someFunction'
      }

      expect(() => flattenRoutes(routes)).toThrow('was interpreted as an HTTP')
    })

    it('should throw if invalid HTTP method is used', () => {
      const routes = {
        '/foo': {
          invalid: {
            function: 'someFunction'
          }
        }
      }

      expect(() => flattenRoutes(routes)).toThrow('was interpreted as an HTTP')
    })

    it('should flatten valid routes', () => {
      const routes = {
        '/foo': {
          '/bar': {
            '/baz': {
              post: {
                function: 'someFunction'
              }
            },
            get: {
              function: 'someFunction'
            }
          }
        }
      }

      const res = flattenRoutes(routes)
      expect(res).toEqual({
        '/foo/bar': {
          get: {
            function: 'someFunction'
          }
        },
        '/foo/bar/baz': {
          post: {
            function: 'someFunction'
          }
        }
      })
    })
  })

  describe('#normalizeRoutes()', () => {
    it('should normalize valid routes', () => {
      const flatRoutes = {
        '/foo/bar': {
          get: {
            function: 'someFunction'
          }
        },
        '/foo/bar/baz/{...qux}': {
          post: {
            function: 'someFunction'
          }
        }
      }

      const res = normalizeRoutes(flatRoutes)

      expect(res).toEqual({
        'foo/bar': {
          GET: {
            function: 'someFunction'
          }
        },
        'foo/bar/baz/{qux+}': {
          POST: {
            function: 'someFunction'
          }
        }
      })
    })
  })
})
