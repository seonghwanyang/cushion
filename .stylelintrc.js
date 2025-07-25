module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-prettier',
  ],
  plugins: [
    'stylelint-order',
    'stylelint-scss',
  ],
  rules: {
    'at-rule-no-unknown': [true, {
      ignoreAtRules: [
        'tailwind',
        'apply',
        'variants',
        'responsive',
        'screen',
        'layer',
      ],
    }],
    'scss/at-rule-no-unknown': [true, {
      ignoreAtRules: [
        'tailwind',
        'apply',
        'variants',
        'responsive',
        'screen',
        'layer',
      ],
    }],
    'selector-class-pattern': '^[a-z][a-zA-Z0-9-]*$',
    'selector-id-pattern': '^[a-z][a-zA-Z0-9-]*$',
    'order/properties-order': [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      'display',
      'flex',
      'flex-direction',
      'flex-wrap',
      'justify-content',
      'align-items',
      'width',
      'height',
      'margin',
      'padding',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'text-align',
      'color',
      'background',
      'background-color',
      'background-image',
      'background-position',
      'background-size',
      'border',
      'border-radius',
      'opacity',
      'overflow',
      'cursor',
      'transition',
      'transform',
    ],
  },
};