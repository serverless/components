import { error } from '@serverless/utils'

const errorBadVariableEvaluation = (variable, evalError) =>
  error(
    `An error occurred while evaluating the variable '${variable.variableString}'.\n\n"${
      evalError.message
    }"\n\n`,
    {
      data: {
        variable,
        error: evalError
      },
      type: 'BadVariableEvaluation',
      reasons: [evalError]
    }
  )

export default errorBadVariableEvaluation
