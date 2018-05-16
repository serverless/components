module.exports = {
  root: true,
  extends: 'prettier',
  plugins: ['import', 'prettier'],
  env: {
    es6: true,
    node: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  rules: {
    'array-bracket-spacing': [
      'error',
      'never',
      {
        objectsInArrays: false,
        arraysInArrays: false
      }
    ],
    'arrow-parens': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'func-names': 'off',
    'no-param-reassign': 'off',
    'no-use-before-define': 'off',
    'prefer-destructuring': 'off',
    'object-curly-newline': 'off',
    semi: ['error', 'never'],
    'object-shorthand': 'off',
    'prettier/prettier': 'error'
  }
}
