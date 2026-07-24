module.exports = {
  root: true,
  extends: ['universe/native'],
  ignorePatterns: ['/dist/*'],
  rules: {
    'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
  },
};
