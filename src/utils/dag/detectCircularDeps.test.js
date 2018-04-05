const graphlib = require('graphlib')
const detectCircularDeps = require('./detectCircularDeps')

describe('#detectCircularDeps()', () => {
  let graph

  beforeEach(() => {
    graph = new graphlib.Graph()
    graph.setNode('myFunction')
    graph.setNode('myApiGateway')
    graph.setNode('myRole')
    graph.setEdge('myFunction', 'myRole')
    graph.setEdge('myApiGateway', 'myRole')
  })

  describe('when not dealing with circular dependencies', () => {
    it('should simply return the graph', () => {
      const res = detectCircularDeps(graph)
      expect(res).toEqual(graph)
    })
  })

  describe('when dealing with circular dependencies', () => {
    beforeEach(() => {
      // circular dependency 1: myFunction <--> myRole
      graph.setEdge('myRole', 'myFunction')
      // circular dependency 2: myApiGateway <--> myRole
      graph.setEdge('myRole', 'myApiGateway')
    })

    it('should throw if it detects circular dependencies', () => {
      expect(() => detectCircularDeps(graph)).toThrow(/has circular dependencies/)
    })

    it('should print the nodes which introduce circular dependencies', () => {
      expect(() => detectCircularDeps(graph)).toThrow(/.+ --> .+/)
    })
  })
})
