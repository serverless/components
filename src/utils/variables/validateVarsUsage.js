const getVariableSyntax = require('./getVariableSyntax')

// "private" functions
function checkForViolations(serverlessYml) {
  const forbiddenProperties = [ 'type', 'version' ]
  const varSyntax = getVariableSyntax()

  return forbiddenProperties.some((property) => {
    const value = serverlessYml[property]
    return value && value.match(varSyntax)
  })
}

// "public" functions
function validateVarsUsage(serverlessYml) {
  const violationsFound = checkForViolations(serverlessYml)
  if (violationsFound) {
    throw new Error('The variable syntax cannot be used in "type" or "version" properties')
  }
  return true
}

module.exports = validateVarsUsage
