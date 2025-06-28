# LangSmith 모니터링 가이드

## 🔍 개요

LangSmith는 LangChain/LangGraph 애플리케이션의 실행을 추적, 디버깅, 평가하는 플랫폼입니다. Cushion 프로젝트에서 AI 워크플로우를 효과적으로 모니터링하는 방법을 다룹니다.

## 🚀 LangSmith 설정

### 1. 기본 설정

```typescript
// config/langsmith.config.ts
import { Client } from "langsmith";

export const configureLangSmith = () => {
  // 환경 변수 검증
  const apiKey = process.env.LANGSMITH_API_KEY;
  const environment = process.env.NODE_ENV;
  
  if (!apiKey) {
    console.warn("LangSmith API key not found. Tracing disabled.");
    return null;
  }

  // LangSmith 클라이언트 설정
  const client = new Client({
    apiUrl: "https://api.smith.langchain.com",
    apiKey: apiKey,
  });

  // 전역 환경 변수 설정
  process.env.LANGCHAIN_TRACING_V2 = "true";
  process.env.LANGCHAIN_ENDPOINT = "https://api.smith.langchain.com";
  process.env.LANGCHAIN_API_KEY = apiKey;
  process.env.LANGCHAIN_PROJECT = `cushion-${environment}`;
  
  // 개발/프로덕션 환경별 설정
  if (environment === "production") {
    // 프로덕션에서는 샘플링
    process.env.LANGCHAIN_TRACING_SAMPLING_RATE = "0.1"; // 10% 샘플링
  } else {
    // 개발에서는 모든 트레이스 수집
    process.env.LANGCHAIN_TRACING_SAMPLING_RATE = "1.0";
  }

  return client;
};

// 애플리케이션 시작 시
export const initializeLangSmith = async () => {
  const client = configureLangSmith();
  
  if (client) {
    // 프로젝트 생성 (없으면)
    try {
      await client.createProject({
        projectName: `cushion-${process.env.NODE_ENV}`,
        description: "Cushion AI diary analysis project"
      });
    } catch (error) {
      // 프로젝트가 이미 존재하면 무시
      console.log("LangSmith project already exists");
    }
    
    console.log("✅ LangSmith configured successfully");
  }
};
```

### 2. Docker/Kubernetes 환경 설정

```yaml
# docker-compose.yml
services:
  ai-worker:
    environment:
      # LangSmith 설정
      - LANGCHAIN_TRACING_V2=true
      - LANGCHAIN_API_KEY=${LANGSMITH_API_KEY}
      - LANGCHAIN_PROJECT=cushion-development
      - LANGCHAIN_TRACING_SAMPLING_RATE=1.0
      
      # 추가 메타데이터
      - LANGSMITH_ENVIRONMENT=docker
      - LANGSMITH_DEPLOYMENT_NAME=local
```

```yaml
# k8s/ai-worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-worker
spec:
  template:
    spec:
      containers:
      - name: worker
        env:
        - name: LANGCHAIN_TRACING_V2
          value: "true"
        - name: LANGCHAIN_API_KEY
          valueFrom:
            secretKeyRef:
              name: langsmith-secret
              key: api-key
        - name: LANGCHAIN_PROJECT
          value: "cushion-production"
        - name: LANGCHAIN_TRACING_SAMPLING_RATE
          value: "0.1"  # 프로덕션은 10% 샘플링
        - name: LANGSMITH_RUN_TAGS
          value: "production,k8s,$(POD_NAME)"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
```

## 📊 LangGraph 추적 구현

### 1. 기본 추적 설정

```typescript
// services/ai/langgraph-traced.ts
import { StateGraph, Annotation } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

// 추적을 위한 메타데이터 추가
export interface TracingMetadata {
  userId: string;
  diaryId: string;
  requestId: string;
  environment: string;
  version: string;
}

export class TracedDiaryAnalysisGraph {
  private graph: any;
  
  constructor() {
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph(DiaryAnalysisState)
      .addNode("extract_topics", this.wrapNode(extractTopicsNode))
      .addNode("analyze_emotions", this.wrapNode(analyzeEmotionsNode))
      .addNode("identify_strengths", this.wrapNode(identifyStrengthsNode))
      .addNode("generate_insights", this.wrapNode(generateInsightsNode))
      .addNode("create_feedback", this.wrapNode(createFeedbackNode));

    // 엣지 설정
    workflow
      .addEdge("__start__", "extract_topics")
      .addEdge("extract_topics", "analyze_emotions")
      .addEdge("analyze_emotions", "identify_strengths")
      .addEdge("identify_strengths", "generate_insights")
      .addEdge("generate_insights", "create_feedback")
      .addEdge("create_feedback", "__end__");

    return workflow.compile();
  }

  // 노드 래핑으로 추가 추적 정보 삽입
  private wrapNode(node: Function) {
    return async (state: any, config?: RunnableConfig) => {
      const startTime = Date.now();
      
      try {
        // 노드 실행
        const result = await node(state, config);
        
        // 성공 메트릭
        const duration = Date.now() - startTime;
        if (config?.callbacks) {
          config.callbacks.forEach(callback => {
            callback.handleCustomEvent?.({
              name: "node_execution",
              data: {
                nodeName: node.name,
                duration,
                success: true,
                stateSize: JSON.stringify(state).length,
              }
            });
          });
        }
        
        return result;
      } catch (error) {
        // 실패 메트릭
        if (config?.callbacks) {
          config.callbacks.forEach(callback => {
            callback.handleCustomEvent?.({
              name: "node_error",
              data: {
                nodeName: node.name,
                error: error.message,
                duration: Date.now() - startTime,
              }
            });
          });
        }
        throw error;
      }
    };
  }

  async invoke(
    input: any, 
    metadata: TracingMetadata
  ): Promise<any> {
    // LangSmith 추적 설정
    const config: RunnableConfig = {
      tags: [
        `user:${metadata.userId}`,
        `env:${metadata.environment}`,
        `version:${metadata.version}`,
      ],
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        hostName: process.env.HOSTNAME || "unknown",
      },
      runName: `diary-analysis-${metadata.diaryId}`,
      callbacks: [
        {
          // 커스텀 콜백으로 추가 정보 수집
          handleLLMStart: async (llm: any, prompts: string[]) => {
            console.log(`LLM Start: ${llm.name}, Prompt length: ${prompts[0]?.length}`);
          },
          handleLLMEnd: async (output: any) => {
            console.log(`LLM End: Tokens used: ${output.llmOutput?.tokenUsage?.totalTokens}`);
          },
          handleChainError: async (error: any) => {
            console.error(`Chain Error: ${error.message}`);
            // 에러를 Sentry에도 전송
            if (process.env.SENTRY_DSN) {
              Sentry.captureException(error, {
                tags: metadata,
              });
            }
          },
        },
      ],
    };

    // 실행 with 추적
    const result = await this.graph.invoke(input, config);
    
    return result;
  }
}
```

### 2. 고급 추적 패턴

```typescript
// services/ai/advanced-tracing.ts
import { Client } from "langsmith";
import { RunTree } from "langsmith/run_trees";

export class AdvancedTracingService {
  private client: Client;
  
  constructor() {
    this.client = new Client();
  }

  // 수동 런 트리 생성 (복잡한 워크플로우용)
  async traceComplexWorkflow(metadata: TracingMetadata) {
    // 루트 런 생성
    const rootRun = new RunTree({
      name: "complex_diary_analysis",
      run_type: "chain",
      inputs: { metadata },
      tags: [`user:${metadata.userId}`, `diary:${metadata.diaryId}`],
      extra: {
        metadata,
        startTime: new Date().toISOString(),
      },
    });

    try {
      // 1. 데이터 준비 단계
      const prepRun = await rootRun.createChild({
        name: "data_preparation",
        run_type: "tool",
      });
      
      const preparedData = await this.prepareData(metadata.diaryId);
      await prepRun.end({ outputs: { prepared: true } });

      // 2. 병렬 분석 실행
      const analysisRuns = await Promise.all([
        this.runAnalysis(rootRun, "emotion_analysis", preparedData),
        this.runAnalysis(rootRun, "topic_extraction", preparedData),
        this.runAnalysis(rootRun, "strength_identification", preparedData),
      ]);

      // 3. 결과 통합
      const integrationRun = await rootRun.createChild({
        name: "result_integration",
        run_type: "chain",
      });
      
      const finalResult = await this.integrateResults(analysisRuns);
      await integrationRun.end({ outputs: finalResult });

      // 루트 런 완료
      await rootRun.end({ outputs: finalResult });
      
      // LangSmith에 전송
      await rootRun.postRun();
      
      return finalResult;
    } catch (error) {
      await rootRun.end({ error: error.message });
      await rootRun.postRun();
      throw error;
    }
  }

  private async runAnalysis(
    parentRun: RunTree, 
    analysisType: string, 
    data: any
  ) {
    const childRun = await parentRun.createChild({
      name: analysisType,
      run_type: "llm",
      inputs: { data },
    });

    try {
      const result = await this.performAnalysis(analysisType, data);
      await childRun.end({ outputs: result });
      return result;
    } catch (error) {
      await childRun.end({ error: error.message });
      throw error;
    }
  }
}
```

### 3. 평가(Evaluation) 설정

```typescript
// services/ai/evaluation.ts
import { Client } from "langsmith";
import { EvaluationResult } from "langsmith/evaluation";

export class DiaryAnalysisEvaluator {
  private client: Client;
  
  constructor() {
    this.client = new Client();
  }

  // 데이터셋 생성
  async createEvaluationDataset() {
    const datasetName = "diary-analysis-test-set";
    
    // 테스트 케이스 정의
    const examples = [
      {
        inputs: {
          content: "오늘 팀 미팅에서 새로운 프로젝트 아이디어를 제안했다...",
        },
        outputs: {
          expectedStrengths: ["리더십", "창의성", "소통능력"],
          expectedEmotions: ["excited", "confident"],
        },
      },
      // ... 더 많은 예제
    ];

    // 데이터셋 생성 또는 업데이트
    const dataset = await this.client.createDataset(datasetName, {
      description: "Test cases for diary analysis",
      dataType: "kv",
    });

    // 예제 추가
    for (const example of examples) {
      await this.client.createExample(
        example.inputs,
        example.outputs,
        { datasetId: dataset.id }
      );
    }

    return dataset;
  }

  // 평가 함수 정의
  async defineEvaluators() {
    // 1. 강점 추출 정확도
    const strengthAccuracy = async (
      run: any,
      example: any
    ): Promise<EvaluationResult> => {
      const predicted = new Set(run.outputs?.strengths || []);
      const expected = new Set(example.outputs?.expectedStrengths || []);
      
      const intersection = [...predicted].filter(x => expected.has(x));
      const precision = intersection.length / predicted.size;
      const recall = intersection.length / expected.size;
      const f1 = 2 * (precision * recall) / (precision + recall) || 0;

      return {
        key: "strength_f1_score",
        score: f1,
        comment: `Precision: ${precision.toFixed(2)}, Recall: ${recall.toFixed(2)}`,
      };
    };

    // 2. 응답 품질 평가
    const responseQuality = async (
      run: any,
      example: any
    ): Promise<EvaluationResult> => {
      const feedback = run.outputs?.feedback || "";
      
      // 품질 체크리스트
      const hasSpecificExamples = feedback.includes("예를 들어") || feedback.includes("구체적");
      const hasActionableAdvice = feedback.includes("제안") || feedback.includes("방법");
      const isPositiveTone = !feedback.includes("부정") && !feedback.includes("실패");
      const appropriateLength = feedback.length > 100 && feedback.length < 1000;
      
      const score = [
        hasSpecificExamples,
        hasActionableAdvice,
        isPositiveTone,
        appropriateLength,
      ].filter(Boolean).length / 4;

      return {
        key: "response_quality",
        score,
        comment: `Quality checks passed: ${score * 4}/4`,
      };
    };

    // 3. 레이턴시 평가
    const latencyEvaluator = async (
      run: any,
      example: any
    ): Promise<EvaluationResult> => {
      const latencyMs = run.endTime - run.startTime;
      const score = latencyMs < 5000 ? 1 : latencyMs < 10000 ? 0.5 : 0;
      
      return {
        key: "latency_score",
        score,
        value: latencyMs,
        comment: `Response time: ${latencyMs}ms`,
      };
    };

    return {
      strengthAccuracy,
      responseQuality,
      latencyEvaluator,
    };
  }

  // 평가 실행
  async runEvaluation(projectName: string) {
    const dataset = await this.createEvaluationDataset();
    const evaluators = await this.defineEvaluators();
    
    // 평가 설정
    const evalConfig = {
      evaluators: Object.values(evaluators),
      projectName: `${projectName}-eval`,
      maxConcurrency: 5,
    };

    // 평가 실행
    const results = await this.client.evaluate(
      async (example: any) => {
        // 실제 그래프 실행
        const graph = new TracedDiaryAnalysisGraph();
        return await graph.invoke(example.inputs, {
          userId: "eval-user",
          diaryId: "eval-diary",
          requestId: "eval-request",
          environment: "evaluation",
          version: "latest",
        });
      },
      {
        data: dataset.id,
        ...evalConfig,
      }
    );

    return results;
  }
}
```

## 📈 대시보드 및 모니터링

### 1. 커스텀 메트릭 전송

```typescript
// services/monitoring/langsmith-metrics.ts
export class LangSmithMetricsCollector {
  private metricsBuffer: any[] = [];
  private flushInterval = 60000; // 1분

  constructor() {
    // 주기적으로 메트릭 전송
    setInterval(() => this.flush(), this.flushInterval);
  }

  // 비즈니스 메트릭 수집
  collectBusinessMetric(metric: {
    name: string;
    value: number;
    tags?: Record<string, string>;
  }) {
    this.metricsBuffer.push({
      ...metric,
      timestamp: new Date().toISOString(),
    });
  }

  // 일기 분석 완료 시
  onDiaryAnalysisComplete(result: any, metadata: TracingMetadata) {
    // 강점 발견 수
    this.collectBusinessMetric({
      name: "strengths_discovered",
      value: result.strengths?.length || 0,
      tags: {
        userId: metadata.userId,
        environment: metadata.environment,
      },
    });

    // 분석 신뢰도
    this.collectBusinessMetric({
      name: "analysis_confidence",
      value: result.confidence || 0,
      tags: {
        model: result.model || "unknown",
      },
    });

    // 사용자 만족도 (피드백 기반)
    if (result.userFeedback) {
      this.collectBusinessMetric({
        name: "user_satisfaction",
        value: result.userFeedback.score,
        tags: {
          feedbackType: result.userFeedback.type,
        },
      });
    }
  }

  private async flush() {
    if (this.metricsBuffer.length === 0) return;

    try {
      // LangSmith 커스텀 메트릭 API로 전송
      const client = new Client();
      await client.createMetrics({
        metrics: this.metricsBuffer,
        projectName: process.env.LANGCHAIN_PROJECT,
      });

      // 버퍼 초기화
      this.metricsBuffer = [];
    } catch (error) {
      console.error("Failed to send metrics to LangSmith:", error);
    }
  }
}
```

### 2. 알림 설정

```typescript
// services/monitoring/alerts.ts
export class LangSmithAlertManager {
  private thresholds = {
    errorRate: 0.05,        // 5% 이상 에러
    latency: 10000,         // 10초 이상 지연
    tokenUsage: 100000,     // 일일 10만 토큰
    cost: 50,               // 일일 $50
  };

  async setupAlerts() {
    const client = new Client();
    
    // 1. 에러율 알림
    await client.createAlert({
      name: "High Error Rate",
      condition: {
        metric: "error_rate",
        operator: ">",
        threshold: this.thresholds.errorRate,
        window: "5m",
      },
      channels: ["slack", "pagerduty"],
      projectName: process.env.LANGCHAIN_PROJECT,
    });

    // 2. 레이턴시 알림
    await client.createAlert({
      name: "High Latency",
      condition: {
        metric: "p95_latency",
        operator: ">",
        threshold: this.thresholds.latency,
        window: "5m",
      },
      channels: ["slack"],
      severity: "warning",
    });

    // 3. 비용 알림
    await client.createAlert({
      name: "Daily Cost Threshold",
      condition: {
        metric: "daily_cost",
        operator: ">",
        threshold: this.thresholds.cost,
        window: "24h",
      },
      channels: ["email", "slack"],
      severity: "critical",
    });
  }

  // Slack 통합
  async sendSlackNotification(alert: any) {
    const webhookUrl = process.env.SLACK_LANGSMITH_WEBHOOK;
    
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 LangSmith Alert: ${alert.name}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Alert:* ${alert.name}\n*Value:* ${alert.value}\n*Threshold:* ${alert.threshold}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "View in LangSmith" },
                url: `https://smith.langchain.com/projects/${process.env.LANGCHAIN_PROJECT}`,
              },
            ],
          },
        ],
      }),
    });
  }
}
```

## 🔧 프로덕션 최적화

### 1. 샘플링 전략

```typescript
// services/ai/sampling.ts
export class TracingSampler {
  // 조건부 샘플링
  shouldTrace(metadata: TracingMetadata): boolean {
    // VIP 사용자는 항상 추적
    if (this.isVIPUser(metadata.userId)) {
      return true;
    }

    // 에러가 자주 발생하는 사용자 추적
    if (this.hasRecentErrors(metadata.userId)) {
      return true;
    }

    // 새로운 기능은 더 많이 샘플링
    if (metadata.version.includes("beta")) {
      return Math.random() < 0.5; // 50%
    }

    // 기본 샘플링율
    const samplingRate = parseFloat(
      process.env.LANGCHAIN_TRACING_SAMPLING_RATE || "0.1"
    );
    
    return Math.random() < samplingRate;
  }

  // 동적 샘플링율 조정
  async adjustSamplingRate() {
    const currentLoad = await this.getCurrentSystemLoad();
    const errorRate = await this.getRecentErrorRate();
    
    let samplingRate = 0.1; // 기본 10%
    
    // 시스템 부하가 높으면 샘플링 감소
    if (currentLoad > 0.8) {
      samplingRate = 0.01; // 1%
    }
    // 에러율이 높으면 샘플링 증가
    else if (errorRate > 0.05) {
      samplingRate = 0.5; // 50%
    }
    
    process.env.LANGCHAIN_TRACING_SAMPLING_RATE = samplingRate.toString();
  }
}
```

### 2. 비용 관리

```typescript
// services/ai/cost-management.ts
export class LangSmithCostManager {
  private dailyLimit = 100; // $100/day
  private monthlyLimit = 2000; // $2000/month
  
  async checkUsage(): Promise<{
    allowed: boolean;
    dailyUsed: number;
    monthlyUsed: number;
  }> {
    const client = new Client();
    
    // 일일/월간 사용량 조회
    const usage = await client.getUsage({
      projectName: process.env.LANGCHAIN_PROJECT,
      startDate: this.getStartOfDay(),
      endDate: new Date(),
    });
    
    const dailyUsed = usage.totalCost || 0;
    const monthlyUsed = await this.getMonthlyUsage();
    
    // 한도 확인
    const allowed = 
      dailyUsed < this.dailyLimit && 
      monthlyUsed < this.monthlyLimit;
    
    if (!allowed) {
      // 추적 비활성화
      process.env.LANGCHAIN_TRACING_V2 = "false";
      
      // 알림 전송
      await this.notifyLimitExceeded({
        dailyUsed,
        monthlyUsed,
        dailyLimit: this.dailyLimit,
        monthlyLimit: this.monthlyLimit,
      });
    }
    
    return { allowed, dailyUsed, monthlyUsed };
  }
}
```

## 📊 분석 및 인사이트

### 1. 자동 리포트 생성

```typescript
// services/reporting/langsmith-reports.ts
export class LangSmithReporter {
  async generateWeeklyReport() {
    const client = new Client();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 실행 통계 조회
    const stats = await client.getRunStats({
      projectName: process.env.LANGCHAIN_PROJECT,
      startDate,
      endDate,
    });
    
    // 에러 분석
    const errors = await client.listRuns({
      projectName: process.env.LANGCHAIN_PROJECT,
      filter: { status: "error" },
      startDate,
      endDate,
    });
    
    // 비용 분석
    const costByModel = await this.analyzeCostByModel(startDate, endDate);
    
    // 성능 트렌드
    const performanceTrend = await this.analyzePerformanceTrend(startDate, endDate);
    
    // 리포트 생성
    const report = {
      period: { startDate, endDate },
      summary: {
        totalRuns: stats.totalRuns,
        successRate: stats.successRate,
        avgLatency: stats.avgLatency,
        totalCost: stats.totalCost,
      },
      errors: {
        count: errors.length,
        topErrors: this.groupErrorsByType(errors),
      },
      costAnalysis: costByModel,
      performance: performanceTrend,
      recommendations: this.generateRecommendations(stats, errors),
    };
    
    // 이메일/Slack으로 전송
    await this.sendReport(report);
    
    return report;
  }
  
  private generateRecommendations(stats: any, errors: any[]): string[] {
    const recommendations = [];
    
    // 에러율이 높으면
    if (stats.errorRate > 0.05) {
      recommendations.push(
        "에러율이 5%를 초과했습니다. 주요 에러 패턴을 분석하고 수정이 필요합니다."
      );
    }
    
    // 레이턴시가 높으면
    if (stats.avgLatency > 5000) {
      recommendations.push(
        "평균 응답 시간이 5초를 초과합니다. 캐싱 전략을 검토하거나 더 빠른 모델 사용을 고려하세요."
      );
    }
    
    // 비용이 예산의 80% 초과
    if (stats.totalCost > this.weeklyBudget * 0.8) {
      recommendations.push(
        "주간 예산의 80%를 초과했습니다. 샘플링율을 낮추거나 저렴한 모델 사용을 검토하세요."
      );
    }
    
    return recommendations;
  }
}
```

## 🛡 보안 및 개인정보 보호

### 1. 민감 정보 필터링

```typescript
// services/security/pii-filter.ts
export class PIIFilter {
  private patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+82|010|011|016|017|018|019)-?\d{3,4}-?\d{4}/g,
    ssn: /\d{6}-\d{7}/g, // 주민등록번호
    creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  };
  
  // LangSmith에 전송 전 필터링
  filterTraceData(data: any): any {
    const filtered = JSON.stringify(data);
    
    // 패턴 매칭으로 치환
    let result = filtered;
    result = result.replace(this.patterns.email, "[EMAIL_REDACTED]");
    result = result.replace(this.patterns.phone, "[PHONE_REDACTED]");
    result = result.replace(this.patterns.ssn, "[SSN_REDACTED]");
    result = result.replace(this.patterns.creditCard, "[CC_REDACTED]");
    
    return JSON.parse(result);
  }
  
  // 커스텀 LangSmith 클라이언트
  createSecureClient() {
    const client = new Client();
    
    // 프록시 패턴으로 필터링 적용
    return new Proxy(client, {
      get(target, prop) {
        if (prop === "createRun" || prop === "updateRun") {
          return async (...args: any[]) => {
            // 인자 필터링
            const filteredArgs = args.map(arg => 
              this.filterTraceData(arg)
            );
            
            // 원본 메서드 호출
            return target[prop](...filteredArgs);
          };
        }
        
        return target[prop];
      },
    });
  }
}
```

이렇게 LangSmith를 설정하면 LangGraph 워크플로우의 모든 실행을 추적하고, 성능을 모니터링하며, 문제를 빠르게 진단할 수 있습니다!