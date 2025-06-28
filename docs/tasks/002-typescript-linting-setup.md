# Task 002: TypeScript 및 코드 품질 도구 설정

## 📋 작업 개요

**작업 ID**: 002  
**작업명**: TypeScript, ESLint, Prettier 설정  
**예상 소요시간**: 20-30분  
**우선순위**: 🔴 Critical (코드 품질 기반)  
**선행 작업**: Task 001 (완료됨)

## 🎯 목표

프로젝트 전반에 걸쳐 일관된 코드 스타일과 타입 안전성을 보장하기 위한 도구들을 설정합니다. `docs/cushion-code-quality.md` 문서의 가이드라인을 따릅니다.

## 📋 작업 내용

### 1. TypeScript 설정

#### 루트 `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@cushion/types": ["packages/types/src"],
      "@cushion/utils": ["packages/utils/src"]
    }
  },
  "exclude": ["node_modules", "dist", "build", ".next"]
}
```

#### Frontend `frontend/tsconfig.json`
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@cushion/types": ["../packages/types/src"],
      "@cushion/utils": ["../packages/utils/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Backend `backend/tsconfig.json`
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@cushion/types": ["../packages/types/src"],
      "@cushion/utils": ["../packages/utils/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. ESLint 설정

#### 루트 `.eslintrc.js`
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'unused-imports',
    'simple-import-sort',
    'prettier'
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json'],
      },
    },
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      disallowTypeAnnotations: true
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-duplicates': 'error',
    'import/newline-after-import': 'error',
    'simple-import-sort/imports': ['error', {
      groups: [
        ['^node:'],
        ['^@?\\w'],
        ['^@/'],
        ['^\\.'],
        ['\\.s?css$']
      ]
    }],
    'simple-import-sort/exports': 'error',
    'unused-imports/no-unused-imports': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-return-await': 'error',
    'require-await': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'no-nested-ternary': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['*.js', '*.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
```

#### Frontend `.eslintrc.js` (`frontend/.eslintrc.js`)
```javascript
module.exports = {
  extends: [
    '../.eslintrc.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'next/core-web-vitals',
  ],
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-curly-brace-presence': ['error', { 
      props: 'never', 
      children: 'never' 
    }],
    'react/self-closing-comp': 'error',
    'react/jsx-sort-props': ['error', {
      callbacksLast: true,
      shorthandFirst: true,
      noSortAlphabetically: false,
      reservedFirst: true,
    }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['hrefLeft', 'hrefRight'],
      aspects: ['invalidHref', 'preferButton'],
    }],
  },
};
```

### 3. Prettier 설정

#### 루트 `.prettierrc.js`
```javascript
module.exports = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  
  plugins: [
    'prettier-plugin-tailwindcss',
    'prettier-plugin-organize-imports',
    'prettier-plugin-packagejson',
  ],
  
  tailwindConfig: './frontend/tailwind.config.js',
  
  importOrder: [
    '^node:',
    '<THIRD_PARTY_MODULES>',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'preserve',
      },
    },
    {
      files: ['*.json', '*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
      },
    },
  ],
};
```

#### `.prettierignore`
```
# 빌드 산출물
dist
build
.next
out

# 의존성
node_modules

# 캐시
.cache
.turbo

# 환경 파일
.env*
!.env.example

# 자동 생성 파일
*.min.js
*.min.css
coverage
*.lock
package-lock.json
pnpm-lock.yaml

# Prisma
*.db
migrations

# 기타
.DS_Store
*.log
```

### 4. StyleLint 설정 (CSS/SCSS)

#### `.stylelintrc.js`
```javascript
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
```

### 5. CommitLint 설정

#### `.commitlintrc.js`
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'revert',
        'build',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

### 6. Husky 설정

#### `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Pre-commit checks starting..."

# Lint staged files
npx lint-staged

# Type check
echo "📝 Running type check..."
npm run type-check

echo "✅ Pre-commit checks passed!"
```

#### `.husky/commit-msg`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message
npx --no -- commitlint --edit ${1}
```

### 7. Lint-Staged 설정

#### `.lintstagedrc.js`
```javascript
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
```

### 8. VS Code 설정

#### `.vscode/settings.json`
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true,
    "source.organizeImports": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": [
    "./frontend",
    "./backend"
  ],
  "stylelint.validate": [
    "css",
    "scss",
    "postcss"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/.turbo": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/package-lock.json": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true
  }
}
```

#### `.vscode/extensions.json`
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "stylelint.vscode-stylelint",
    "streetsidesoftware.code-spell-checker",
    "streetsidesoftware.code-spell-checker-korean",
    "yoavbls.pretty-ts-errors",
    "aaron-bond.better-comments",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight",
    "mikestead.dotenv",
    "eamodio.gitlens",
    "orta.vscode-jest",
    "ms-playwright.playwright"
  ]
}
```

### 9. 필요한 패키지 설치

루트 `package.json`의 devDependencies에 추가:
```json
{
  "devDependencies": {
    "@commitlint/cli": "^18.0.0",
    "@commitlint/config-conventional": "^18.0.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-import-resolver-typescript": "^3.0.0",
    "eslint-plugin-import": "^2.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "eslint-plugin-simple-import-sort": "^10.0.0",
    "eslint-plugin-unused-imports": "^3.0.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "prettier-plugin-organize-imports": "^3.0.0",
    "prettier-plugin-packagejson": "^2.0.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "stylelint": "^15.0.0",
    "stylelint-config-prettier": "^9.0.0",
    "stylelint-config-standard": "^34.0.0",
    "stylelint-config-tailwindcss": "^0.2.0",
    "stylelint-order": "^6.0.0",
    "stylelint-scss": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

Frontend 추가 패키지:
```json
{
  "devDependencies": {
    "eslint-config-next": "14.0.0",
    "eslint-plugin-jsx-a11y": "^6.0.0",
    "eslint-plugin-react": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.0.0"
  }
}
```

## 🚀 설치 및 초기화 명령어

```bash
# 1. 루트에서 의존성 설치
pnpm install

# 2. Husky 초기화
npx husky install

# 3. 설정 검증
pnpm run lint
pnpm run type-check
```

## ✅ 완료 조건

1. 모든 설정 파일이 생성됨
2. `pnpm install` 성공
3. `pnpm run lint` 실행 가능
4. `pnpm run type-check` 실행 가능
5. Git commit 시 pre-commit hook 동작
6. VS Code에서 자동 포맷팅 동작

## 📝 추가 작업

### CI/CD 업데이트
`docs/cushion-cicd.md`를 참고하여 `.github/workflows/pr-validation.yml` 파일의 GitHub 관련 정보를 업데이트하세요:
- Repository: `https://github.com/seonghwanyang/cushion`
- 모든 `yourusername`을 `seonghwanyang`으로 변경

### 체크리스트 업데이트
작업 완료 후 `docs/cushion-checklist.md` 파일을 업데이트하세요:
- Phase 1의 "프로젝트 초기 설정" 체크
- Phase 1의 "기본 UI 프레임워크 설정" 체크

## 🔄 다음 단계

이 작업이 완료되면 다음 작업으로 진행:
- Task 003: 데이터베이스 스키마 및 Prisma 설정
- Task 004: 기본 API 구조 구현

---
작성일: 2024-01-20
작성자: Cushion AI Assistant
