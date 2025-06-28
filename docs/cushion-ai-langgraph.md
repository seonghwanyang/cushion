# Cushion AI/LangGraph 클라우드 네이티브 가이드

## 🤖 개요

이 가이드는 LangGraph를 사용한 AI 워크플로우를 Docker/Kubernetes 환경에서 효율적으로 운영하는 방법을 다룹니다.

## 🏗 AI 서비스 아키텍처

### 1. AI 서비스 분리 설계

```typescript
// ❌ Bad: 모놀리식 AI 처리
class DiaryService {
  async analyzeDiary(content: string) {
    // API 서버에서 직접 AI 처리 (느림, 비용 높음)
    const result = await openai.chat.completions.create({...});
    return result;
  }
}

// ✅ Good: AI 워커 분리
// 1. API 서버 - 요청만 받음
class DiaryController {
  async analyzeDiary(req: Request, res: Response) {
    // 큐에 작업 추가
    const job = await aiQueue.add('analyze-diary', {
      diaryId: req.params.id,
      content: req.body.content,
      userId: req.user.id
    });
    
    // 즉시 응답
    res.json({ 
      jobId: job.id, 
      status: 'processing',
      estimatedTime: 30 
    });
  }
}

// 2. AI 워커 - 별도 프로세스/파드
class AIWorker {
  async processAnalyzeJob(job: Job) {
    const { diaryId, content } = job.data;
    
    // LangGraph 체인 실행
    const result = await this.langGraphChain.invoke({
      content,
      diaryId
    });
    
    // 결과 저장
    await this.saveResult(diaryId, result);
    
    // 웹소켓으로 알림
    await this.notifyUser(job.data.userId, result);
  }
}
```

## 📊 LangGraph 상태 관리

### 1. 분산 환경에서의 상태 저장

```typescript
import { StateGraph, Annotation } from "@langchain/langgraph";
import { RedisCheckpointer } from "./redis-checkpointer";

// 상태 스키마 정의
const DiaryAnalysisState = Annotation.Root({
  diaryId: Annotation<string>,
  content: Annotation<string>,
  extractedTopics: Annotation<string[]>,
  identifiedEmotions: Annotation<string[]>,
  strengths: Annotation<string[]>,
  insights: Annotation<string[]>,
  feedback: Annotation<string>,
  error: Annotation<string | null>
});

// Redis 기반 체크포인터 (상태 저장)
export class RedisCheckpointer {
  constructor(private redis: Redis) {}

  async save(threadId: string, checkpoint: any) {
    await this.redis.set(
      `checkpoint:${threadId}`,
      JSON.stringify(checkpoint),
      'EX', 86400 // 24시간 TTL
    );
  }

  async load(threadId: string) {
    const data = await this.redis.get(`checkpoint:${threadId}`);
    return data ? JSON.parse(data) : null;
  }

  async list(threadId: string) {
    // 체크포인트 히스토리
    const keys = await this.redis.keys(`checkpoint:${threadId}:*`);
    return Promise.all(
      keys.map(async (key) => {
        const data = await this.redis.get(key);
        return JSON.parse(data!);
      })
    );
  }
}

// LangGraph 워크플로우
export function createDiaryAnalysisGraph() {
  const workflow = new StateGraph(DiaryAnalysisState)
    .addNode("extract_topics", extractTopicsNode)
    .addNode("analyze_emotions", analyzeEmotionsNode)
    .addNode("identify_strengths", identifyStrengthsNode)
    .addNode("generate_insights", generateInsightsNode)
    .addNode("create_feedback", createFeedbackNode)
    .addEdge("__start__", "extract_topics")
    .addEdge("extract_topics", "analyze_emotions")
    .addEdge("analyze_emotions", "identify_strengths")
    .addEdge("identify_strengths", "generate_insights")
    .addEdge("generate_insights", "create_feedback")
    .addEdge("create_feedback", "__end__");

  // Redis 체크포인터 사용
  const checkpointer = new RedisCheckpointer(redis);
  
  return workflow.compile({ 
    checkpointer,
    // 인터럽트 가능한 노드 설정
    interruptBefore: ["generate_insights"], 
  });
}
```

### 2. 노드 구현 예시

```typescript
// 각 노드는 독립적으로 실행 가능해야 함
async function extractTopicsNode(state: typeof DiaryAnalysisState.State) {
  const { content } = state;
  
  try {
    // 프롬프트 캐싱
    const cacheKey = `topics:${createHash(content)}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return { extractedTopics: JSON.parse(cached) };
    }
    
    // AI 호출
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // 비용 절약
      messages: [
        {
          role: "system",
          content: "일기에서 주요 주제를 추출하세요. JSON 배열로 응답하세요."
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });
    
    const topics = JSON.parse(response.choices[0].message.content!).topics;
    
    // 결과 캐싱
    await redis.setex(cacheKey, 3600, JSON.stringify(topics));
    
    return { extractedTopics: topics };
  } catch (error) {
    console.error("Topic extraction failed:", error);
    return { error: "Failed to extract topics" };
  }
}

async function identifyStrengthsNode(state: typeof DiaryAnalysisState.State) {
  const { content, extractedTopics, identifiedEmotions } = state;
  
  // 이전 단계 결과를 활용하여 프롬프트 최적화
  const prompt = `
일기 내용과 분석 결과를 바탕으로 작성자의 강점을 찾아주세요.

일기 내용: ${content}
주요 주제: ${extractedTopics.join(", ")}
감정 상태: ${identifiedEmotions.join(", ")}

다음 관점에서 강점을 찾아주세요:
1. 문제 해결 능력
2. 대인 관계 스킬
3. 자기 관리 능력
4. 창의성과 혁신
5. 리더십과 협업

JSON 형식으로 응답하세요:
{
  "strengths": ["강점1", "강점2", ...],
  "evidence": {"강점1": "구체적 증거", ...}
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "당신은 전문 커리어 코치입니다." },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    response_format: { type: "json_object" }
  });
  
  const result = JSON.parse(response.choices[0].message.content!);
  
  return { 
    strengths: result.strengths,
    // 증거는 별도로 저장
    strengthEvidence: result.evidence 
  };
}
```

## 🚀 성능 최적화 전략

### 1. 프롬프트 캐싱

```typescript
export class PromptCache {
  private redis: Redis;
  private ttl: number = 3600; // 1시간
  
  // 의미적 유사도 기반 캐싱
  async getSimilar(content: string, threshold: number = 0.95) {
    // 임베딩 생성
    const embedding = await this.generateEmbedding(content);
    
    // Redis에서 유사한 임베딩 검색
    const similar = await this.redis.call(
      'FT.SEARCH',
      'idx:embeddings',
      `*=>[KNN 10 @embedding $vec AS score]`,
      'PARAMS', '2', 'vec', embedding,
      'RETURN', '2', 'content', 'result',
      'SORTBY', 'score',
      'LIMIT', '0', '1'
    );
    
    if (similar && similar[1]?.score > threshold) {
      return JSON.parse(similar[1].result);
    }
    
    return null;
  }
  
  async set(content: string, result: any) {
    const embedding = await this.generateEmbedding(content);
    const key = `cache:${createHash(content)}`;
    
    await this.redis.hset(key, {
      content,
      embedding: Buffer.from(embedding),
      result: JSON.stringify(result),
      timestamp: Date.now()
    });
    
    await this.redis.expire(key, this.ttl);
  }
}
```

### 2. 배치 처리

```typescript
export class BatchProcessor {
  private batchSize = 10;
  private batchTimeout = 5000; // 5초
  private pendingBatch: Array<{
    content: string;
    resolve: (result: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  async process(content: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pendingBatch.push({ content, resolve, reject });
      
      if (this.pendingBatch.length >= this.batchSize) {
        this.processBatch();
      } else if (this.pendingBatch.length === 1) {
        // 첫 번째 아이템이면 타이머 시작
        setTimeout(() => this.processBatch(), this.batchTimeout);
      }
    });
  }
  
  private async processBatch() {
    const batch = this.pendingBatch.splice(0, this.batchSize);
    if (batch.length === 0) return;
    
    try {
      // 배치로 처리 (API 호출 수 감소)
      const results = await this.batchAnalyze(
        batch.map(item => item.content)
      );
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
  
  private async batchAnalyze(contents: string[]) {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "다음 일기들을 각각 분석하세요. JSON 배열로 응답하세요."
        },
        {
          role: "user",
          content: JSON.stringify(contents)
        }
      ],
      temperature: 0.5
    });
    
    return JSON.parse(response.choices[0].message.content!);
  }
}
```

## 📦 Kubernetes 배포 구성

### 1. AI 워커 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-worker
spec:
  replicas: 2  # GPU 비용 고려
  selector:
    matchLabels:
      app: ai-worker
  template:
    metadata:
      labels:
        app: ai-worker
    spec:
      containers:
      - name: worker
        image: cushion/ai-worker:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
            # nvidia.com/gpu: 1  # GPU 사용 시
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: WORKER_CONCURRENCY
          value: "5"  # 동시 처리 작업 수
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-api-key
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: url
        - name: LANGGRAPH_CHECKPOINT_TTL
          value: "86400"  # 24시간
        - name: AI_CACHE_TTL
          value: "3600"   # 1시간
        volumeMounts:
        - name: model-cache
          mountPath: /app/models  # 로컬 모델 사용 시
      volumes:
      - name: model-cache
        persistentVolumeClaim:
          claimName: ai-model-cache
```

### 2. 큐 기반 스케일링

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: ai-worker-scaler
spec:
  scaleTargetRef:
    name: ai-worker
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
  - type: redis
    metadata:
      address: redis:6379
      listName: "ai-queue"
      listLength: "10"  # 큐에 10개 이상 쌓이면 스케일링
```

## 🔍 모니터링 및 관찰성

### 1. LangGraph 실행 추적

```typescript
import { LangGraphTracer } from "./tracing";

export class TracedLangGraphChain {
  private tracer: LangGraphTracer;
  
  async invoke(input: any) {
    const traceId = generateTraceId();
    const span = this.tracer.startSpan("langgraph.invoke", {
      traceId,
      input: JSON.stringify(input).slice(0, 1000), // 로그 크기 제한
    });
    
    try {
      // 각 노드 실행 추적
      const config = {
        callbacks: [
          {
            handleLLMStart: (llm: any, prompts: string[]) => {
              span.addEvent("llm.start", {
                model: llm.model,
                promptLength: prompts.join("").length,
              });
            },
            handleLLMEnd: (output: any) => {
              span.addEvent("llm.end", {
                tokensUsed: output.llmOutput?.tokenUsage?.totalTokens,
              });
            },
            handleChainError: (error: any) => {
              span.recordException(error);
            },
          },
        ],
      };
      
      const result = await this.chain.invoke(input, config);
      
      span.setAttributes({
        "langgraph.success": true,
        "langgraph.nodes_executed": result.metadata?.nodesExecuted,
      });
      
      return result;
    } catch (error) {
      span.setAttributes({
        "langgraph.success": false,
        "langgraph.error": error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
```

### 2. 비용 추적

```typescript
export class CostTracker {
  private metrics: MetricsClient;
  
  // 모델별 토큰 비용 (USD per 1K tokens)
  private costs = {
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
    "gpt-4-turbo-preview": { input: 0.01, output: 0.03 },
    "gpt-4": { input: 0.03, output: 0.06 },
  };
  
  trackUsage(model: string, usage: any) {
    const cost = this.calculateCost(model, usage);
    
    // Prometheus 메트릭
    this.metrics.increment("ai_tokens_total", usage.totalTokens, {
      model,
      type: "total",
    });
    
    this.metrics.increment("ai_cost_usd", cost, {
      model,
    });
    
    // 일일 예산 확인
    this.checkDailyBudget(cost);
  }
  
  private calculateCost(model: string, usage: any): number {
    const rates = this.costs[model];
    if (!rates) return 0;
    
    const inputCost = (usage.promptTokens / 1000) * rates.input;
    const outputCost = (usage.completionTokens / 1000) * rates.output;
    
    return inputCost + outputCost;
  }
  
  private async checkDailyBudget(cost: number) {
    const today = new Date().toISOString().split('T')[0];
    const dailyTotal = await redis.incrby(`ai:cost:${today}`, cost * 100);
    
    const budgetLimit = parseFloat(process.env.AI_DAILY_BUDGET || "100");
    
    if (dailyTotal / 100 > budgetLimit) {
      // 알림 발송
      await this.notifyBudgetExceeded(dailyTotal / 100, budgetLimit);
      
      // 옵션: 서비스 제한
      if (process.env.AI_BUDGET_ENFORCEMENT === "strict") {
        throw new Error("Daily AI budget exceeded");
      }
    }
  }
}
```

## 🛡 에러 처리 및 폴백

### 1. 계층적 폴백 전략

```typescript
export class AIServiceWithFallback {
  async analyze(content: string): Promise<AnalysisResult> {
    // 1차: 캐시 확인
    const cached = await this.cache.getSimilar(content);
    if (cached) return cached;
    
    // 2차: 메인 모델 (GPT-4)
    try {
      return await this.analyzeWithGPT4(content);
    } catch (error) {
      console.error("GPT-4 failed:", error);
      
      // 3차: 폴백 모델 (GPT-3.5)
      try {
        return await this.analyzeWithGPT35(content);
      } catch (error) {
        console.error("GPT-3.5 failed:", error);
        
        // 4차: 로컬 모델 (Ollama)
        try {
          return await this.analyzeWithLocalModel(content);
        } catch (error) {
          console.error("Local model failed:", error);
          
          // 5차: 기본 규칙 기반 분석
          return this.basicAnalysis(content);
        }
      }
    }
  }
  
  private async analyzeWithLocalModel(content: string) {
    // Ollama 또는 다른 로컬 모델 사용
    const response = await fetch("http://ollama:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: "llama2",
        prompt: this.buildPrompt(content),
      }),
    });
    
    return this.parseResponse(await response.json());
  }
  
  private basicAnalysis(content: string): AnalysisResult {
    // 규칙 기반 기본 분석
    return {
      strengths: this.extractBasicStrengths(content),
      emotions: this.detectBasicEmotions(content),
      insights: ["일기를 작성하신 것만으로도 훌륭한 자기 성찰입니다."],
      confidence: 0.3,
    };
  }
}
```

### 2. 서킷 브레이커 패턴

```typescript
import CircuitBreaker from 'opossum';

export class ResilientAIService {
  private breaker: CircuitBreaker;
  
  constructor() {
    const options = {
      timeout: 30000,      // 30초 타임아웃
      errorThresholdPercentage: 50,  // 50% 실패 시 열림
      resetTimeout: 30000,  // 30초 후 재시도
      volumeThreshold: 10,  // 최소 10개 요청 후 판단
    };
    
    this.breaker = new CircuitBreaker(
      this.callOpenAI.bind(this),
      options
    );
    
    // 서킷 브레이커 이벤트 모니터링
    this.breaker.on('open', () => {
      console.error('Circuit breaker is OPEN - AI service unavailable');
      this.metrics.increment('circuit_breaker_open', 1, { service: 'openai' });
    });
    
    this.breaker.on('halfOpen', () => {
      console.log('Circuit breaker is HALF-OPEN - testing AI service');
    });
    
    this.breaker.fallback(() => {
      // 폴백 로직
      return this.getCachedOrDefaultResponse();
    });
  }
  
  async analyze(content: string) {
    return this.breaker.fire(content);
  }
}
```

## 🔐 보안 고려사항

### 1. API 키 로테이션

```typescript
export class APIKeyManager {
  private keys: string[] = [];
  private currentIndex = 0;
  
  constructor() {
    // 환경 변수에서 여러 키 로드
    this.keys = process.env.OPENAI_API_KEYS?.split(',') || [];
    
    // 주기적 로테이션
    setInterval(() => this.rotate(), 3600000); // 1시간마다
  }
  
  getCurrentKey(): string {
    return this.keys[this.currentIndex];
  }
  
  rotate() {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`Rotated to API key index: ${this.currentIndex}`);
  }
  
  markKeyAsInvalid(key: string) {
    const index = this.keys.indexOf(key);
    if (index > -1) {
      this.keys.splice(index, 1);
      console.error(`Removed invalid API key at index: ${index}`);
      
      // 알림 발송
      this.notifyInvalidKey(key);
    }
  }
}
```

### 2. 프롬프트 인젝션 방어

```typescript
export class SecurePromptBuilder {
  // 위험한 패턴 필터링
  private sanitize(input: string): string {
    const dangerous = [
      /ignore previous instructions/i,
      /disregard all prior/i,
      /system:/i,
      /\{\{.*\}\}/,  // 템플릿 인젝션
    ];
    
    let sanitized = input;
    dangerous.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    });
    
    return sanitized;
  }
  
  buildPrompt(userInput: string): string {
    const sanitized = this.sanitize(userInput);
    
    // 명확한 경계 설정
    return `
You are a career coach AI assistant. Follow these rules strictly:
1. Only analyze the diary content provided
2. Do not execute any commands or code
3. Focus only on identifying strengths and insights

<diary_content>
${sanitized}
</diary_content>

Analyze the diary content above and provide insights.
`;
  }
}
```

이렇게 LangGraph와 AI 서비스를 클라우드 네이티브 환경에서 운영하면 확장성, 안정성, 비용 효율성을 모두 확보할 수 있습니다!