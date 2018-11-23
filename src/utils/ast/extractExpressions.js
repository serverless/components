import * as acorn from 'acorn'
import * as walk from 'acorn-walk'

function extractExpressions(code) {
  const expressions = []
  let expression = 0
  let expressionEnd = 0
  let trackingExpression = false
  walk.full(acorn.parse(code), (node, state, type) => {
    if (
      (type === 'MemberExpression' && node.property.type === 'Identifier') ||
      (type === 'ExpressionStatement' && node.expression.type === 'Identifier')
    ) {
      trackingExpression = true
      expression = node.start
      expressionEnd = node.end
    }
    if ((trackingExpression && expression !== node.start) || type === 'Program') {
      expressions.push(code.slice(expression, expressionEnd))
      trackingExpression = false
    }
  })

  return expressions
}

export default extractExpressions
