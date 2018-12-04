import * as acorn from 'acorn'
import * as walk from 'acorn-walk'

function extractExpressions(code) {
  const expressions = []
  let expressionStart = 0
  let expressionEnd = 0
  let trackingExpression = false
  walk.full(acorn.parse(code), (node, state, type) => {
    if (
      (type === 'MemberExpression' && node.property.type === 'Identifier') ||
      (type === 'ExpressionStatement' && node.expression.type === 'Identifier')
    ) {
      trackingExpression = true
      expressionStart = node.start
      expressionEnd = node.end
    }
    if ((trackingExpression && expressionStart !== node.start) || type === 'Program') {
      expressions.push(code.slice(expressionStart, expressionEnd))
      trackingExpression = false
    }
  })

  return expressions
}

export default extractExpressions
