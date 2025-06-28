module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{css,scss,sass}': [
    'stylelint --fix',
    'prettier --write',
  ],
  '*.{json,yml,yaml}': [
    'prettier --write',
  ],
  '*.md': [
    'prettier --write',
  ],
  '*.prisma': [
    'prisma format',
  ],
};