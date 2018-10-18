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
      experimentalObjectRestSpread: true
    }
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
    'curly': 'error',
    'eol-last': 'error',
    'func-names': 'off',
    'no-use-before-define': 'off',
    'prefer-destructuring': 'off',
    'no-alert': 'error',
    'no-console': 'error',
    'no-const-assign': 'error',
    'no-else-return': 'error',
    'no-empty': 'off',
    'no-shadow': 'error',
    'no-undef': 'error',
    'object-curly-newline': 'off',
    'no-unused-vars': 'error',
    semi: ['error', 'never'],
    'object-shorthand': 'off',
    'prettier/prettier': 'error',
    'prefer-const': 'error'
  }
}
