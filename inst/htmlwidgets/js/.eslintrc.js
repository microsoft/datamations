module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    "no-use-before-define": ["off"],
    "max-lines-per-function": ["off"],
    "promise/param-names" : ["off"],
    "n/no-callback-literal" : ["off"],
    "camelcase" : ["off"],
    "no-undef" : ["off"],
    "no-unused-vars" : ["off"],
    "promise/param-names" : ["off"],
    "brace-style" : ["off"],
    "no-var" : ["off"]
  }
}
