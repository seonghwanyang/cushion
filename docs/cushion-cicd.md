# Cushion CI/CD 파이프라인 가이드

## 🚀 CI/CD 아키텍처 개요

```mermaid
graph LR
    A[Local Dev] -->|Push| B[GitHub]
    B -->|Trigger| C[GitHub Actions]
    
    C -->|PR| D[Preview Build]
    C -->|main| E[Staging Build]
    C -->|tag| F[Production Build]
    
    D --> G[Vercel Preview]
    E --> H[Staging Env]
    F --> I[Production Env]
    
    C -->|Tests| J[Quality Gates]
    J -->|Pass| K[Deploy]
    J -->|Fail| L[Block]
```

## 📋 GitHub Actions 워크플로우

### 1. PR 검증 워크플로우

#### `.github/workflows/pr-validation.yml`
```yaml
name: PR Validation

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20.x'
  PNPM_VERSION: '8'

jobs:
  # 1. 코드 품질 검사
  code-quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for better analysis
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          run_install: false
      
      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
      
      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run ESLint
        run: pnpm lint:js --format @microsoft/eslint-formatter-sarif --output-file eslint-results.sarif
        continue-on-error: true
      
      - name: Upload ESLint results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: eslint-results.sarif
      
      - name: Run Prettier check
        run: pnpm format:check
      
      - name: Run StyleLint
        run: pnpm lint:css
      
      - name: TypeScript type check
        run: pnpm type-check

  # 2. 테스트 실행
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: code-quality
    
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: cushion_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Setup test database
        run: |
          cp .env.test .env
          pnpm prisma:migrate:test
          pnpm prisma:seed:test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/cushion_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run unit tests (shard ${{ matrix.shard }})
        run: pnpm test:unit --shard=${{ matrix.shard }}/4 --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/cushion_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}
      
      - name: Upload coverage reports
        uses: actions/upload-artifact@v3
        with:
          name: coverage-${{ matrix.shard }}
          path: coverage/
          retention-days: 1

  # 3. 통합 테스트
  integration-test:
    name: Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: code-quality
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: cushion_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/cushion_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret

  # 4. E2E 테스트
  e2e-test:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [test, integration-test]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      
      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3001
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          CI: true
          BASE_URL: http://localhost:3000
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  # 5. 보안 스캔
  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run npm audit
        run: npm audit --audit-level=high

  # 6. 빌드 검증
  build-check:
    name: Build Verification
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [code-quality, test]
    
    strategy:
      matrix:
        app: [frontend, backend]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build ${{ matrix.app }}
        run: pnpm build:${{ matrix.app }}
        env:
          NODE_ENV: production
      
      - name: Check build output
        run: |
          if [ "${{ matrix.app }}" = "frontend" ]; then
            test -d frontend/.next
          else
            test -d backend/dist
          fi
      
      - name: Analyze bundle size (frontend only)
        if: matrix.app == 'frontend'
        run: |
          pnpm --filter frontend analyze
          echo "Bundle size report generated"

  # 7. 최종 검증
  pr-status:
    name: PR Status Check
    runs-on: ubuntu-latest
    needs: [code-quality, test, integration-test, e2e-test, security-scan, build-check]
    if: always()
    
    steps:
      - name: Check job results
        run: |
          if [[ "${{ needs.code-quality.result }}" != "success" || 
                "${{ needs.test.result }}" != "success" || 
                "${{ needs.integration-test.result }}" != "success" ||
                "${{ needs.e2e-test.result }}" != "success" ||
                "${{ needs.security-scan.result }}" != "success" ||
                "${{ needs.build-check.result }}" != "success" ]]; then
            echo "One or more jobs failed"
            exit 1
          fi
          echo "All checks passed!"
```

### 2. 메인 브랜치 배포 워크플로우

#### `.github/workflows/deploy-staging.yml`
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20.x'
  PNPM_VERSION: '8'

jobs:
  # 1. 빌드 및 테스트
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    outputs:
      frontend-url: ${{ steps.frontend-deploy.outputs.url }}
      backend-url: ${{ steps.backend-deploy.outputs.url }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: pnpm test:ci
      
      - name: Build applications
        run: pnpm build
        env:
          NODE_ENV: production
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}

  # 2. 데이터베이스 마이그레이션
  database-migration:
    name: Database Migration
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: build-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run migrations
        run: |
          cd backend
          pnpm prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

  # 3. Frontend 배포 (Vercel)
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: database-migration
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          alias-domains: staging.cushion.app

  # 4. Backend 배포 (Railway/AWS)
  deploy-backend:
    name: Deploy Backend
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: database-migration
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: Build Docker image
        run: |
          docker build -t cushion-backend:${{ github.sha }} ./backend
          docker tag cushion-backend:${{ github.sha }} ${{ secrets.ECR_REGISTRY }}/cushion-backend:staging
          docker tag cushion-backend:${{ github.sha }} ${{ secrets.ECR_REGISTRY }}/cushion-backend:${{ github.sha }}
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker push ${{ secrets.ECR_REGISTRY }}/cushion-backend:staging
          docker push ${{ secrets.ECR_REGISTRY }}/cushion-backend:${{ github.sha }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster cushion-staging \
            --service cushion-backend \
            --force-new-deployment

  # 5. 스모크 테스트
  smoke-test:
    name: Smoke Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [deploy-frontend, deploy-backend]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Wait for deployment
        run: sleep 60
      
      - name: Run smoke tests
        run: |
          cd e2e
          pnpm install
          pnpm test:smoke
        env:
          BASE_URL: https://staging.cushion.app
          API_URL: https://api-staging.cushion.app

  # 6. 알림
  notify:
    name: Send Notifications
    runs-on: ubuntu-latest
    needs: [deploy-frontend, deploy-backend, smoke-test]
    if: always()
    
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Staging Deployment ${{ job.status }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
            Frontend: https://staging.cushion.app
            Backend: https://api-staging.cushion.app
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. 프로덕션 배포 워크플로우

#### `.github/workflows/deploy-production.yml`
```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy (e.g., v1.0.0)'
        required: true
        type: string

env:
  NODE_VERSION: '20.x'
  PNPM_VERSION: '8'

jobs:
  # 1. 배포 승인
  approval:
    name: Deployment Approval
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Request approval
        run: echo "Waiting for deployment approval..."

  # 2. 배포 전 검증
  pre-deploy-check:
    name: Pre-deployment Checks
    runs-on: ubuntu-latest
    needs: approval
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version || github.ref }}
      
      - name: Verify tag
        run: |
          if [[ ! "${{ github.ref }}" =~ ^refs/tags/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Invalid version tag"
            exit 1
          fi
      
      - name: Check staging status
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://staging.cushion.app/health)
          if [ $response -ne 200 ]; then
            echo "Staging environment is not healthy"
            exit 1
          fi

  # 3. 데이터베이스 백업
  backup-database:
    name: Backup Production Database
    runs-on: ubuntu-latest
    needs: pre-deploy-check
    
    steps:
      - name: Create database backup
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          pg_dump ${{ secrets.PROD_DATABASE_URL }} | gzip > backup_${TIMESTAMP}.sql.gz
          aws s3 cp backup_${TIMESTAMP}.sql.gz s3://cushion-backups/prod/${TIMESTAMP}/
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  # 4. Blue-Green 배포
  deploy-blue-green:
    name: Blue-Green Deployment
    runs-on: ubuntu-latest
    needs: backup-database
    
    strategy:
      matrix:
        environment: [blue, green]
        include:
          - environment: blue
            current: true
          - environment: green
            current: false
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version || github.ref }}
      
      - name: Deploy to ${{ matrix.environment }}
        if: matrix.current == false
        run: |
          # Deploy to inactive environment
          echo "Deploying to ${{ matrix.environment }} environment"
          
          # Build and push Docker images
          docker build -t cushion:${{ github.ref_name }} .
          docker tag cushion:${{ github.ref_name }} ${{ secrets.ECR_REGISTRY }}/cushion:prod-${{ matrix.environment }}
          docker push ${{ secrets.ECR_REGISTRY }}/cushion:prod-${{ matrix.environment }}
          
          # Update ECS service
          aws ecs update-service \
            --cluster cushion-prod-${{ matrix.environment }} \
            --service cushion-app \
            --force-new-deployment
      
      - name: Health check
        if: matrix.current == false
        run: |
          # Wait for deployment
          sleep 120
          
          # Check health
          for i in {1..10}; do
            response=$(curl -s -o /dev/null -w "%{http_code}" https://${{ matrix.environment }}.cushion.app/health)
            if [ $response -eq 200 ]; then
              echo "Health check passed"
              break
            fi
            echo "Health check attempt $i failed"
            sleep 30
          done

  # 5. 트래픽 전환
  switch-traffic:
    name: Switch Traffic
    runs-on: ubuntu-latest
    needs: deploy-blue-green
    environment: production
    
    steps:
      - name: Update load balancer
        run: |
          # Get current active environment
          CURRENT_ENV=$(aws elbv2 describe-target-groups \
            --names cushion-prod-active \
            --query 'TargetGroups[0].Tags[?Key==`Environment`].Value' \
            --output text)
          
          # Determine new environment
          if [ "$CURRENT_ENV" = "blue" ]; then
            NEW_ENV="green"
          else
            NEW_ENV="blue"
          fi
          
          echo "Switching from $CURRENT_ENV to $NEW_ENV"
          
          # Update ALB target group
          aws elbv2 modify-listener \
            --listener-arn ${{ secrets.PROD_ALB_LISTENER_ARN }} \
            --default-actions Type=forward,TargetGroupArn=${{ secrets["PROD_TG_${NEW_ENV}_ARN"] }}
      
      - name: Verify traffic switch
        run: |
          sleep 30
          response=$(curl -s https://api.cushion.app/version)
          if [[ "$response" != *"${{ github.ref_name }}"* ]]; then
            echo "Version mismatch after traffic switch"
            exit 1
          fi

  # 6. 후속 작업
  post-deploy:
    name: Post Deployment Tasks
    runs-on: ubuntu-latest
    needs: switch-traffic
    
    steps:
      - name: Invalidate CDN cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} \
            --paths "/*"
      
      - name: Update monitoring
        run: |
          # Update Datadog deployment marker
          curl -X POST "https://api.datadoghq.com/api/v1/events" \
            -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "title": "Production deployment",
              "text": "Deployed version ${{ github.ref_name }}",
              "tags": ["env:prod", "version:${{ github.ref_name }}"]
            }'
      
      - name: Create release notes
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ github.ref_name }}
          generate_release_notes: true
          prerelease: false

  # 7. 롤백 준비
  prepare-rollback:
    name: Prepare Rollback Plan
    runs-on: ubuntu-latest
    needs: post-deploy
    
    steps:
      - name: Document rollback procedure
        run: |
          cat > rollback-plan.md << EOF
          # Rollback Plan for ${{ github.ref_name }}
          
          ## Quick Rollback (< 5 minutes)
          1. Switch ALB target group back to previous environment
          2. Invalidate CDN cache
          
          ## Full Rollback (< 30 minutes)
          1. Restore database from backup
          2. Deploy previous version to inactive environment
          3. Switch traffic
          4. Monitor for 30 minutes
          
          ## Commands
          \`\`\`bash
          # Quick rollback
          ./scripts/rollback.sh quick ${{ github.ref_name }}
          
          # Full rollback
          ./scripts/rollback.sh full ${{ github.ref_name }}
          \`\`\`
          EOF
      
      - name: Upload rollback plan
        uses: actions/upload-artifact@v3
        with:
          name: rollback-plan-${{ github.ref_name }}
          path: rollback-plan.md
```

### 4. 일일 작업 워크플로우

#### `.github/workflows/daily-tasks.yml`
```yaml
name: Daily Maintenance

on:
  schedule:
    - cron: '0 2 * * *' # 매일 오전 2시 (UTC)
  workflow_dispatch:

jobs:
  # 1. 의존성 업데이트 확인
  dependency-check:
    name: Check Dependencies
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Check for updates
        run: |
          npx npm-check-updates -u --target minor
          pnpm audit
      
      - name: Create PR if updates available
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update dependencies'
          title: '[Bot] Update dependencies'
          body: |
            ## Dependency Updates
            
            This PR updates project dependencies to their latest minor versions.
            
            Please review and test before merging.
          branch: deps/update-${{ github.run_number }}

  # 2. 데이터베이스 최적화
  database-maintenance:
    name: Database Maintenance
    runs-on: ubuntu-latest
    
    steps:
      - name: Run VACUUM
        run: |
          psql ${{ secrets.PROD_DATABASE_URL }} -c "VACUUM ANALYZE;"
      
      - name: Check slow queries
        run: |
          psql ${{ secrets.PROD_DATABASE_URL }} -f scripts/slow-queries.sql > slow-queries.log
          
          if [ -s slow-queries.log ]; then
            # Send alert if slow queries found
            curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
              -H 'Content-type: application/json' \
              -d '{"text":"Slow queries detected in production database"}'
          fi

  # 3. 로그 정리
  cleanup-logs:
    name: Cleanup Old Logs
    runs-on: ubuntu-latest
    
    steps:
      - name: Archive old logs
        run: |
          aws s3 sync s3://cushion-logs/current/ s3://cushion-logs/archive/$(date +%Y/%m)/ \
            --exclude "*" --include "*.log" --include "*.json" \
            --storage-class GLACIER
      
      - name: Delete old logs
        run: |
          aws s3 rm s3://cushion-logs/current/ \
            --recursive \
            --exclude "*" \
            --include "*.log" \
            --include "*.json" \
            --exclude "$(date +%Y-%m-*)/*"
```

### 5. 모니터링 및 알림

#### `.github/workflows/monitoring.yml`
```yaml
name: Continuous Monitoring

on:
  schedule:
    - cron: '*/5 * * * *' # 5분마다
  workflow_dispatch:

jobs:
  health-check:
    name: Health Check
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        environment: [production, staging]
        service: [frontend, backend, database]
    
    steps:
      - name: Check ${{ matrix.service }} health (${{ matrix.environment }})
        run: |
          case "${{ matrix.service }}" in
            frontend)
              URL="https://${{ matrix.environment == 'production' && 'www' || 'staging' }}.cushion.app/health"
              ;;
            backend)
              URL="https://api-${{ matrix.environment == 'production' && 'prod' || 'staging' }}.cushion.app/health"
              ;;
            database)
              # Database connection check
              pg_isready -h ${{ secrets[format('{0}_DB_HOST', matrix.environment)] }}
              exit $?
              ;;
          esac
          
          if [ "${{ matrix.service }}" != "database" ]; then
            response=$(curl -s -o /dev/null -w "%{http_code}" $URL)
            if [ $response -ne 200 ]; then
              # Send alert
              curl -X POST ${{ secrets.PAGERDUTY_WEBHOOK }} \
                -H 'Content-Type: application/json' \
                -d '{
                  "routing_key": "${{ secrets.PAGERDUTY_KEY }}",
                  "event_action": "trigger",
                  "payload": {
                    "summary": "${{ matrix.service }} is down in ${{ matrix.environment }}",
                    "severity": "error",
                    "source": "github-actions"
                  }
                }'
            fi
          fi
```

## 🔧 로컬 개발 환경 설정

### 1. Pre-commit 훅 설정

#### `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Pre-commit checks starting..."

# 1. Lint staged files
echo "📝 Running linters..."
npx lint-staged

# 2. Type check
echo "🔍 Type checking..."
npm run type-check

# 3. Run tests for changed files
echo "🧪 Running tests..."
npm run test:changed

# 4. Check bundle size (frontend only)
if git diff --cached --name-only | grep -q "frontend/"; then
  echo "📊 Checking bundle size..."
  cd frontend && npm run build:analyze
  
  # Check if bundle size exceeds limit
  BUNDLE_SIZE=$(du -sk .next | cut -f1)
  MAX_SIZE=2048 # 2MB in KB
  
  if [ $BUNDLE_SIZE -gt $MAX_SIZE ]; then
    echo "❌ Bundle size ($BUNDLE_SIZE KB) exceeds limit ($MAX_SIZE KB)"
    exit 1
  fi
  cd ..
fi

echo "✅ All pre-commit checks passed!"
```

### 2. 로컬 CI 스크립트

#### `scripts/local-ci.sh`
```bash
#!/bin/bash

# Local CI simulation script
set -e

echo "🏃 Running local CI pipeline..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
run_step() {
  echo -e "${YELLOW}▶ $1${NC}"
  shift
  if "$@"; then
    echo -e "${GREEN}✓ Success${NC}\n"
  else
    echo -e "${RED}✗ Failed${NC}\n"
    exit 1
  fi
}

# Main pipeline
run_step "Installing dependencies" pnpm install
run_step "Running linters" npm run lint
run_step "Type checking" npm run type-check
run_step "Running unit tests" npm run test:unit
run_step "Running integration tests" npm run test:integration
run_step "Building applications" npm run build
run_step "Running E2E tests" npm run test:e2e:headless

echo -e "${GREEN}🎉 All checks passed! Ready to push.${NC}"
```

## 📊 CI/CD 메트릭 및 모니터링

### 주요 메트릭
1. **빌드 시간**: < 10분 목표
2. **테스트 커버리지**: > 80%
3. **배포 성공률**: > 99%
4. **롤백 시간**: < 5분
5. **평균 복구 시간 (MTTR)**: < 30분

### 모니터링 도구
1. **GitHub Actions Insights**: 워크플로우 성능
2. **Datadog**: 애플리케이션 성능
3. **Sentry**: 에러 추적
4. **PagerDuty**: 인시던트 관리
5. **AWS CloudWatch**: 인프라 모니터링

## 🔐 보안 고려사항

### Secrets 관리
1. GitHub Secrets에 모든 민감 정보 저장
2. 환경별 시크릿 분리
3. 정기적인 시크릿 로테이션
4. 최소 권한 원칙 적용

### 보안 스캔
1. Dependabot 활성화
2. CodeQL 분석
3. Trivy 컨테이너 스캔
4. OWASP 의존성 체크

## 🚨 문제 해결 가이드

### 일반적인 CI/CD 문제

1. **워크플로우 실패**
   ```bash
   # 로그 확인
   gh run view <run-id> --log
   
   # 재실행
   gh run rerun <run-id>
   ```

2. **캐시 문제**
   ```bash
   # 캐시 삭제
   gh cache delete <cache-key>
   
   # 모든 캐시 목록
   gh cache list
   ```

3. **시크릿 문제**
   ```bash
   # 시크릿 확인 (값은 표시되지 않음)
   gh secret list
   
   # 시크릿 업데이트
   gh secret set <name> < value.txt
   ```

이 설정으로 견고하고 확장 가능한 CI/CD 파이프라인을 구축할 수 있습니다!