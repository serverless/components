const graphlib = require('graphlib')
const detectCircularDeps = require('./detectCircularDeps')

describe('#detectCircularDeps()', () => {
  let graph

  beforeEach(() => {
    graph = new graphlib.Graph()
    graph.setNode('myRestApi')
    graph.setNode('myApiGateway')
    graph.setNode('myFunction')
    graph.setNode('myRole')
    graph.setEdge('myRestApi', 'myApiGateway')
    graph.setEdge('myApiGateway', 'myFunction')
    graph.setEdge('myFunction', 'myRole')
  })

  describe('when not dealing with circular dependencies', () => {
    it('should simply return the graph', () => {
      const res = detectCircularDeps(graph)
      expect(res).toEqual(graph)
    })
  })

  describe('when dealing with circular dependencies', () => {
    beforeEach(() => {
      // circular dependency 2: myRestApi --> myApiGateway --> myFunction --> myRole
      graph.setEdge('myRole', 'myRestApi')
    })

    it('should throw if it detects circular dependencies', () => {
      expect(() => detectCircularDeps(graph)).toThrow(/has circular dependencies/)
    })

    it('should print the nodes which introduce circular dependencies', () => {
      let returnedGraph
      try {
        returnedGraph = detectCircularDeps(graph)
      } catch (error) {
        const forwardArrows = error.message.split('-->').length - 1
        const backwardArrows = error.message.split('<--').length - 1
        expect(forwardArrows).toEqual(3)
        expect(backwardArrows).toEqual(3)
      } finally {
        expect(returnedGraph).toBeFalsy()
      }
    })
  })
})
