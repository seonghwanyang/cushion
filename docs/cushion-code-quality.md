# Cushion 코드 품질 관리 가이드

## 🛠 Linting & Formatting 도구 설정

### 1. ESLint 설정 (JavaScript/TypeScript)

#### 프로젝트 루트 `.eslintrc.js`
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
    'plugin:prettier/recommended', // Prettier와 통합, 항상 마지막에
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
    // TypeScript 규칙
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
    
    // Import 규칙
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-duplicates': 'error',
    'import/newline-after-import': 'error',
    'simple-import-sort/imports': ['error', {
      groups: [
        // Node.js 내장 모듈
        ['^node:'],
        // 외부 패키지
        ['^@?\\w'],
        // 내부 패키지
        ['^@/'],
        // 상대 경로
        ['^\\.'],
        // 스타일 파일
        ['\\.s?css$']
      ]
    }],
    'simple-import-sort/exports': 'error',
    'unused-imports/no-unused-imports': 'error',
    
    // 일반 규칙
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
    // 테스트 파일 규칙
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // 설정 파일 규칙
    {
      files: ['*.js', '*.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
```

#### Frontend 전용 `.eslintrc.js` (frontend/)
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
    // React 규칙
    'react/react-in-jsx-scope': 'off', // Next.js에서는 불필요
    'react/prop-types': 'off', // TypeScript 사용
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
    
    // React Hooks 규칙
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    
    // 접근성 규칙
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['hrefLeft', 'hrefRight'],
      aspects: ['invalidHref', 'preferButton'],
    }],
  },
};
```

### 2. Prettier 설정

#### `.prettierrc.js`
```javascript
module.exports = {
  // 기본 설정
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
  
  // 플러그인 설정
  plugins: [
    'prettier-plugin-tailwindcss',
    'prettier-plugin-organize-imports',
    'prettier-plugin-packagejson',
  ],
  
  // Tailwind CSS 클래스 정렬
  tailwindConfig: './tailwind.config.js',
  
  // import 정렬 (typescript-eslint와 함께 사용)
  importOrder: [
    '^node:',
    '<THIRD_PARTY_MODULES>',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  
  // 파일별 설정
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

# Prisma
*.db
migrations

# 기타
.DS_Store
*.log
```

### 3. StyleLint 설정 (CSS/SCSS)

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
    // Tailwind CSS 허용
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
    
    // 선택자 규칙
    'selector-class-pattern': '^[a-z][a-zA-Z0-9-]*$',
    'selector-id-pattern': '^[a-z][a-zA-Z0-9-]*$',
    
    // 속성 순서
    'order/properties-order': [
      // 위치
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      
      // 박스 모델
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
      
      // 타이포그래피
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'text-align',
      'color',
      
      // 배경
      'background',
      'background-color',
      'background-image',
      'background-position',
      'background-size',
      
      // 테두리
      'border',
      'border-radius',
      
      // 기타
      'opacity',
      'overflow',
      'cursor',
      'transition',
      'transform',
    ],
  },
};
```

### 4. CommitLint 설정

#### `.commitlintrc.js`
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 타입 enum
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 새로운 기능
        'fix',      // 버그 수정
        'docs',     // 문서 수정
        'style',    // 코드 포맷팅
        'refactor', // 코드 리팩토링
        'test',     // 테스트 추가/수정
        'chore',    // 빌드/설정 수정
        'perf',     // 성능 개선
        'ci',       // CI/CD 수정
        'revert',   // 커밋 되돌리기
        'build',    // 빌드 관련 수정
      ],
    ],
    // 타입 대소문자
    'type-case': [2, 'always', 'lower-case'],
    // 타입 비어있음 금지
    'type-empty': [2, 'never'],
    // 제목 대소문자
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    // 제목 비어있음 금지
    'subject-empty': [2, 'never'],
    // 제목 마침표 금지
    'subject-full-stop': [2, 'never', '.'],
    // 제목 최대 길이
    'header-max-length': [2, 'always', 72],
    // 본문 최대 길이
    'body-max-line-length': [2, 'always', 100],
  },
};
```

### 5. Husky 설정 (Git Hooks)

#### `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Lint staged files
npx lint-staged

# Type check
npm run type-check

# Run tests for changed files
npm run test:changed
```

#### `.husky/commit-msg`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message
npx --no -- commitlint --edit ${1}
```

#### `.husky/pre-push`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run all tests
npm run test

# Build check
npm run build
```

### 6. Lint-Staged 설정

#### `.lintstagedrc.js`
```javascript
module.exports = {
  // TypeScript/JavaScript 파일
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  
  // 스타일 파일
  '*.{css,scss,sass}': [
    'stylelint --fix',
    'prettier --write',
  ],
  
  // JSON, YAML 파일
  '*.{json,yml,yaml}': [
    'prettier --write',
  ],
  
  // Markdown 파일
  '*.md': [
    'prettier --write',
    'markdownlint --fix',
  ],
  
  // Prisma 스키마
  '*.prisma': [
    'prisma format',
  ],
};
```

### 7. VS Code 설정

#### `.vscode/settings.json`
```json
{
  // 에디터 설정
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true,
    "source.organizeImports": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  
  // 언어별 포맷터
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
  
  // ESLint
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
  
  // StyleLint
  "stylelint.validate": [
    "css",
    "scss",
    "postcss"
  ],
  
  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  
  // 파일 제외
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/.turbo": true
  },
  
  // 검색 제외
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
    // 필수
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    
    // 권장
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "stylelint.vscode-stylelint",
    "streetsidesoftware.code-spell-checker",
    "streetsidesoftware.code-spell-checker-korean",
    "yoavbls.pretty-ts-errors",
    "aaron-bond.better-comments",
    "usernamehw.errorlens",
    
    // 유틸리티
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight",
    "mikestead.dotenv",
    "eamodio.gitlens",
    
    // 테스트
    "orta.vscode-jest",
    "ms-playwright.playwright"
  ]
}
```

### 8. 통합 스크립트

#### `package.json` (루트)
```json
{
  "scripts": {
    // Linting
    "lint": "npm run lint:js && npm run lint:css && npm run lint:md",
    "lint:js": "eslint . --ext .js,.jsx,.ts,.tsx --cache",
    "lint:css": "stylelint \"**/*.{css,scss}\" --cache",
    "lint:md": "markdownlint \"**/*.md\" --ignore node_modules",
    "lint:fix": "npm run lint:js -- --fix && npm run lint:css -- --fix && npm run lint:md -- --fix",
    
    // Formatting
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,scss,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,scss,md,yml,yaml}\"",
    
    // Type checking
    "type-check": "npm run type-check:frontend && npm run type-check:backend",
    "type-check:frontend": "cd frontend && tsc --noEmit",
    "type-check:backend": "cd backend && tsc --noEmit",
    
    // 전체 검사
    "check-all": "npm run lint && npm run format:check && npm run type-check",
    "fix-all": "npm run lint:fix && npm run format",
    
    // Git hooks
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    
    // 품질 리포트
    "quality:report": "npm run lint -- --format json --output-file quality-report.json"
  }
}
```

## 🔧 도구 설치 명령어

```bash
# ESLint & TypeScript ESLint
npm install --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-import \
  eslint-plugin-unused-imports \
  eslint-plugin-simple-import-sort \
  eslint-import-resolver-typescript

# React ESLint (Frontend)
npm install --save-dev \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  eslint-config-next

# Prettier
npm install --save-dev \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier \
  prettier-plugin-tailwindcss \
  prettier-plugin-organize-imports \
  prettier-plugin-packagejson

# StyleLint
npm install --save-dev \
  stylelint \
  stylelint-config-standard \
  stylelint-config-tailwindcss \
  stylelint-config-prettier \
  stylelint-order \
  stylelint-scss

# CommitLint
npm install --save-dev \
  @commitlint/cli \
  @commitlint/config-conventional

# Husky & Lint-Staged
npm install --save-dev \
  husky \
  lint-staged

# Markdown
npm install --save-dev \
  markdownlint-cli

# 초기 설정
npx husky install
```

## 📊 품질 메트릭

### 코드 품질 목표
- ESLint 오류: 0
- TypeScript 오류: 0
- 테스트 커버리지: 80% 이상
- 번들 사이즈: 1.5MB 이하
- Lighthouse 점수: 90+ (모든 카테고리)

### 모니터링 도구
1. **SonarQube**: 코드 품질 분석
2. **CodeClimate**: 유지보수성 점수
3. **Bundle Analyzer**: 번들 크기 분석
4. **Lighthouse CI**: 성능 모니터링