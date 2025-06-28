# LangGraph 라우팅 및 결과 처리 패턴

## 🎯 개요

복잡한 LangGraph 워크플로우에서 다양한 경로와 결과를 유연하게 처리하는 패턴들을 다룹니다.

## 🏗 모듈화된 그래프 아키텍처

### 1. 기본 구조: Conditional Routing

```typescript
// types/graph-types.ts
import { Annotation } from "@langchain/langgraph";

// 공통 상태 정의
export const BaseState = Annotation.Root({
  // 입력
  input: Annotation<string>,
  userId: Annotation<string>,
  requestType: Annotation<"simple" | "detailed" | "expert">,
  
  // 라우팅 정보
  routePath: Annotation<string[]>({ default: [] }),
  shouldContinue: Annotation<boolean>({ default: true }),
  
  // 중간 결과 저장
  intermediateResults: Annotation<Record<string, any>>({ default: {} }),
  
  // 최종 결과
  finalResult: Annotation<any>,
  resultSource: Annotation<string>,
  confidence: Annotation<number>,
  
  // 메타데이터
  executionTime: Annotation<Record<string, number>>({ default: {} }),
  tokensUsed: Annotation<Record<string, number>>({ default: {} }),
});

// 특화된 상태들
export const DiaryAnalysisState = Annotation.Root({
  ...BaseState.spec,
  
  // 일기 분석 특화 필드
  emotions: Annotation<string[]>({ default: [] }),
  topics: Annotation<string[]>({ default: [] }),
  strengths: Annotation<string[]>({ default: [] }),
  insights: Annotation<string[]>({ default: [] }),
  
  // 분석 깊이 제어
  analysisDepth: Annotation<"quick" | "standard" | "deep">({ default: "standard" }),
});
```

### 2. 조건부 라우팅 구현

```typescript
// graphs/routing-graph.ts
import { StateGraph, END } from "@langchain/langgraph";

export class SmartRoutingGraph {
  private graph: any;
  
  constructor() {
    this.graph = this.buildGraph();
  }
  
  private buildGraph() {
    const workflow = new StateGraph(DiaryAnalysisState);
    
    // 노드 추가
    workflow
      .addNode("router", this.routerNode)
      .addNode("quick_analysis", this.quickAnalysisNode)
      .addNode("emotion_agent", this.emotionAgentNode)
      .addNode("strength_agent", this.strengthAgentNode)
      .addNode("insight_agent", this.insightAgentNode)
      .addNode("expert_synthesis", this.expertSynthesisNode)
      .addNode("result_formatter", this.resultFormatterNode);
    
    // 라우팅 로직
    workflow.addConditionalEdges(
      "router",
      // 조건 함수
      (state) => {
        switch (state.requestType) {
          case "simple":
            return "quick_analysis";
          case "detailed":
            return "parallel_analysis";
          case "expert":
            return "expert_flow";
          default:
            return "quick_analysis";
        }
      },
      // 가능한 경로들
      {
        quick_analysis: "quick_analysis",
        parallel_analysis: "emotion_agent",
        expert_flow: "emotion_agent",
      }
    );
    
    // 병렬 처리를 위한 팬아웃
    workflow.addConditionalEdges(
      "emotion_agent",
      (state) => {
        if (state.requestType === "detailed") {
          return ["strength_agent", "insight_agent"];
        }
        return "strength_agent";
      }
    );
    
    // 조건부 종료
    workflow.addConditionalEdges(
      "quick_analysis",
      (state) => state.shouldContinue ? "result_formatter" : END
    );
    
    // 병렬 처리 후 합류
    workflow.addEdge(["strength_agent", "insight_agent"], "expert_synthesis");
    workflow.addEdge("expert_synthesis", "result_formatter");
    workflow.addEdge("result_formatter", END);
    
    return workflow.compile();
  }
  
  // 라우터 노드: 요청 분석 및 경로 결정
  private routerNode = async (state: typeof DiaryAnalysisState.State) => {
    const startTime = Date.now();
    
    // 입력 복잡도 분석
    const complexity = this.analyzeComplexity(state.input);
    
    // 사용자 선호도 확인
    const userPreference = await this.getUserPreference(state.userId);
    
    // 라우팅 결정
    let requestType = state.requestType;
    if (!requestType) {
      if (complexity < 0.3) {
        requestType = "simple";
      } else if (complexity < 0.7) {
        requestType = "detailed";
      } else {
        requestType = "expert";
      }
    }
    
    return {
      requestType,
      routePath: [...state.routePath, "router"],
      executionTime: {
        ...state.executionTime,
        router: Date.now() - startTime,
      },
    };
  };
  
  // 빠른 분석 (단일 모델)
  private quickAnalysisNode = async (state: typeof DiaryAnalysisState.State) => {
    const startTime = Date.now();
    
    try {
      // 간단한 GPT-3.5 호출
      const result = await this.callSimpleAnalysis(state.input);
      
      return {
        emotions: result.emotions || [],
        strengths: result.strengths || [],
        insights: [result.mainInsight],
        finalResult: result,
        resultSource: "quick_analysis",
        confidence: 0.7,
        routePath: [...state.routePath, "quick_analysis"],
        executionTime: {
          ...state.executionTime,
          quick_analysis: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error("Quick analysis failed:", error);
      return {
        shouldContinue: false,
        error: error.message,
      };
    }
  };
  
  // 감정 분석 에이전트
  private emotionAgentNode = async (state: typeof DiaryAnalysisState.State) => {
    const result = await this.emotionAnalyzer.analyze(state.input);
    
    return {
      emotions: result.emotions,
      intermediateResults: {
        ...state.intermediateResults,
        emotionAnalysis: result,
      },
      routePath: [...state.routePath, "emotion_agent"],
    };
  };
  
  // 강점 분석 에이전트
  private strengthAgentNode = async (state: typeof DiaryAnalysisState.State) => {
    // 이전 분석 결과 활용
    const context = {
      emotions: state.emotions,
      previousAnalysis: state.intermediateResults.emotionAnalysis,
    };
    
    const result = await this.strengthAnalyzer.analyze(state.input, context);
    
    return {
      strengths: result.strengths,
      intermediateResults: {
        ...state.intermediateResults,
        strengthAnalysis: result,
      },
      routePath: [...state.routePath, "strength_agent"],
    };
  };
  
  // 전문가 종합 노드
  private expertSynthesisNode = async (state: typeof DiaryAnalysisState.State) => {
    // 모든 중간 결과 종합
    const synthesis = await this.synthesizer.combine({
      emotions: state.emotions,
      strengths: state.strengths,
      insights: state.insights,
      intermediateResults: state.intermediateResults,
    });
    
    return {
      finalResult: synthesis,
      resultSource: "expert_synthesis",
      confidence: 0.95,
      routePath: [...state.routePath, "expert_synthesis"],
    };
  };
}
```

### 3. 스트리밍 및 실시간 결과 반환

```typescript
// services/streaming-executor.ts
export class StreamingGraphExecutor {
  private eventEmitter = new EventEmitter();
  
  // 스트리밍 실행 with 중간 결과
  async executeWithStreaming(
    graph: any,
    input: any,
    options: {
      streamIntermediateResults?: boolean;
      targetNodes?: string[]; // 특정 노드 결과만 스트리밍
      websocketId?: string;
    } = {}
  ) {
    const { streamIntermediateResults = true, targetNodes = [] } = options;
    
    // 스트리밍 설정
    const streamConfig = {
      callbacks: [
        {
          handleCustomEvent: async (event: any) => {
            if (event.name === "node_completed") {
              const { nodeName, result } = event.data;
              
              // 타겟 노드이거나 전체 스트리밍인 경우
              if (targetNodes.length === 0 || targetNodes.includes(nodeName)) {
                // 중간 결과 이벤트 발생
                this.eventEmitter.emit("intermediate_result", {
                  nodeName,
                  result,
                  timestamp: Date.now(),
                });
                
                // WebSocket으로 전송
                if (options.websocketId) {
                  await this.sendToWebSocket(options.websocketId, {
                    type: "intermediate_result",
                    data: { nodeName, result },
                  });
                }
              }
            }
          },
        },
      ],
      streamMode: "values" as const,
    };
    
    // 그래프 실행
    const stream = await graph.stream(input, streamConfig);
    
    // 스트림 처리
    const results: any[] = [];
    for await (const chunk of stream) {
      results.push(chunk);
      
      // 실시간 전송
      if (streamIntermediateResults) {
        this.eventEmitter.emit("stream_chunk", chunk);
      }
    }
    
    // 최종 결과
    const finalState = results[results.length - 1];
    return this.extractResult(finalState);
  }
  
  // 결과 추출 로직
  private extractResult(state: any): GraphResult {
    // 실행 경로에 따른 결과 구성
    const executionPath = state.routePath || [];
    
    return {
      // 기본 결과
      result: state.finalResult || this.buildDefaultResult(state),
      
      // 실행 정보
      execution: {
        path: executionPath,
        source: state.resultSource,
        confidence: state.confidence || 0,
        time: Object.values(state.executionTime || {}).reduce((a: number, b: any) => a + b, 0),
        tokensUsed: Object.values(state.tokensUsed || {}).reduce((a: number, b: any) => a + b, 0),
      },
      
      // 선택적 상세 정보
      details: state.requestType === "expert" ? {
        emotions: state.emotions,
        strengths: state.strengths,
        insights: state.insights,
        intermediateResults: state.intermediateResults,
      } : undefined,
    };
  }
  
  // 이벤트 구독
  onIntermediateResult(callback: (data: any) => void) {
    this.eventEmitter.on("intermediate_result", callback);
  }
  
  onStreamChunk(callback: (chunk: any) => void) {
    this.eventEmitter.on("stream_chunk", callback);
  }
}
```

### 4. API 통합 레이어

```typescript
// api/graph-api.controller.ts
export class GraphAPIController {
  private executor: StreamingGraphExecutor;
  private graphs: Map<string, any> = new Map();
  
  constructor() {
    this.executor = new StreamingGraphExecutor();
    this.initializeGraphs();
  }
  
  // 동적 엔드포인트 처리
  @Post("/analyze")
  async analyze(
    @Body() body: AnalyzeRequest,
    @Res() res: Response,
    @Headers("accept") accept: string
  ) {
    const { content, options = {} } = body;
    const userId = req.user.id;
    
    // 그래프 선택
    const graph = this.selectGraph(options.graphType || "default");
    
    // 스트리밍 여부 결정
    const isStreaming = accept?.includes("text/event-stream") || options.stream;
    
    if (isStreaming) {
      return this.handleStreamingResponse(graph, content, options, res);
    } else {
      return this.handleStandardResponse(graph, content, options);
    }
  }
  
  // 일반 응답
  private async handleStandardResponse(
    graph: any,
    content: string,
    options: any
  ) {
    const result = await this.executor.executeWithStreaming(graph, {
      input: content,
      requestType: options.depth || "standard",
      userId: options.userId,
    }, {
      streamIntermediateResults: false,
    });
    
    // 요청된 형식으로 결과 변환
    return this.formatResponse(result, options.format || "standard");
  }
  
  // 스트리밍 응답 (SSE)
  private async handleStreamingResponse(
    graph: any,
    content: string,
    options: any,
    res: Response
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    // 중간 결과 스트리밍
    this.executor.onIntermediateResult((data) => {
      res.write(`data: ${JSON.stringify({
        type: "intermediate",
        ...data,
      })}\n\n`);
    });
    
    try {
      const result = await this.executor.executeWithStreaming(graph, {
        input: content,
        requestType: options.depth || "standard",
      }, {
        streamIntermediateResults: true,
        targetNodes: options.targetNodes,
      });
      
      // 최종 결과
      res.write(`data: ${JSON.stringify({
        type: "final",
        result,
      })}\n\n`);
      
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({
        type: "error",
        error: error.message,
      })}\n\n`);
      res.end();
    }
  }
  
  // 응답 포맷팅
  private formatResponse(result: GraphResult, format: string) {
    switch (format) {
      case "simple":
        // 최소한의 정보만
        return {
          success: true,
          data: {
            message: result.result.message || result.result,
            confidence: result.execution.confidence,
          },
        };
        
      case "detailed":
        // 중간 결과 포함
        return {
          success: true,
          data: result.result,
          details: result.details,
          execution: {
            path: result.execution.path.join(" → "),
            time: `${result.execution.time}ms`,
          },
        };
        
      case "debug":
        // 모든 정보
        return {
          success: true,
          ...result,
        };
        
      default:
        // 표준 형식
        return {
          success: true,
          data: result.result,
          metadata: {
            source: result.execution.source,
            confidence: result.execution.confidence,
          },
        };
    }
  }
  
  // WebSocket 지원
  @WebSocketGateway()
  handleWebSocketConnection(client: Socket) {
    client.on("analyze", async (data) => {
      const { content, options } = data;
      
      await this.executor.executeWithStreaming(
        this.selectGraph(options.graphType),
        { input: content, ...options },
        {
          streamIntermediateResults: true,
          websocketId: client.id,
        }
      );
    });
  }
}
```

### 5. 결과 캐싱 및 최적화

```typescript
// services/result-cache.service.ts
export class GraphResultCache {
  private cache: Redis;
  private similarityThreshold = 0.85;
  
  // 유사 쿼리 캐싱
  async getCachedResult(
    input: string,
    options: any
  ): Promise<GraphResult | null> {
    // 입력 해시
    const inputHash = this.hashInput(input, options);
    
    // 정확한 매칭
    const exactMatch = await this.cache.get(`exact:${inputHash}`);
    if (exactMatch) {
      return JSON.parse(exactMatch);
    }
    
    // 유사도 기반 매칭
    if (options.allowSimilar) {
      const similar = await this.findSimilarResult(input);
      if (similar && similar.similarity > this.similarityThreshold) {
        // 캐시 히트 로깅
        console.log(`Cache hit with similarity: ${similar.similarity}`);
        return similar.result;
      }
    }
    
    return null;
  }
  
  // 경로별 캐싱
  async cacheByPath(
    state: any,
    result: GraphResult,
    ttl: number = 3600
  ) {
    const path = state.routePath.join("-");
    const key = `path:${path}:${this.hashInput(state.input)}`;
    
    await this.cache.setex(
      key,
      ttl,
      JSON.stringify({
        result,
        path: state.routePath,
        timestamp: Date.now(),
      })
    );
  }
}
```

### 6. 에러 처리 및 폴백

```typescript
// services/fault-tolerant-executor.ts
export class FaultTolerantGraphExecutor {
  // 단계별 폴백 전략
  async executeWithFallback(
    primaryGraph: any,
    fallbackGraph: any,
    input: any
  ): Promise<GraphResult> {
    try {
      // 1차: 전체 그래프 실행
      return await this.executeGraph(primaryGraph, input);
    } catch (error) {
      console.error("Primary graph failed:", error);
      
      try {
        // 2차: 폴백 그래프
        return await this.executeGraph(fallbackGraph, input);
      } catch (fallbackError) {
        console.error("Fallback graph failed:", fallbackError);
        
        // 3차: 최소 응답
        return this.generateMinimalResponse(input);
      }
    }
  }
  
  // 부분 실행 지원
  async executePartialGraph(
    graph: any,
    input: any,
    stopAtNode?: string
  ): Promise<Partial<GraphResult>> {
    const config = {
      recursionLimit: 10,
      callbacks: [
        {
          handleNodeEnd: (output: any, node: string) => {
            if (node === stopAtNode) {
              // 특정 노드에서 중단
              throw new EarlyStopException(output);
            }
          },
        },
      ],
    };
    
    try {
      return await graph.invoke(input, config);
    } catch (error) {
      if (error instanceof EarlyStopException) {
        return error.partialResult;
      }
      throw error;
    }
  }
}
```

### 7. 사용 예시

```typescript
// 클라이언트 사용 예시

// 1. 간단한 분석 (빠른 응답)
const quickResult = await fetch("/api/analyze", {
  method: "POST",
  body: JSON.stringify({
    content: "오늘 회의에서 발표를 잘 마쳤다.",
    options: {
      depth: "simple",
      format: "simple"
    }
  })
});

// 2. 상세 분석 (여러 에이전트 거침)
const detailedResult = await fetch("/api/analyze", {
  method: "POST",
  body: JSON.stringify({
    content: "오늘 회의에서 발표를 잘 마쳤다...",
    options: {
      depth: "expert",
      format: "detailed"
    }
  })
});

// 3. 스트리밍으로 중간 결과 받기
const eventSource = new EventSource("/api/analyze", {
  method: "POST",
  headers: {
    "Accept": "text/event-stream"
  },
  body: JSON.stringify({
    content: "...",
    options: {
      stream: true,
      targetNodes: ["emotion_agent", "strength_agent"]
    }
  })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "intermediate") {
    // 중간 결과 표시
    console.log(`${data.nodeName} 완료:`, data.result);
  } else if (data.type === "final") {
    // 최종 결과
    console.log("최종 결과:", data.result);
  }
};

// 4. WebSocket으로 실시간 통신
const socket = io("/analysis");

socket.emit("analyze", {
  content: "...",
  options: {
    graphType: "advanced",
    stream: true
  }
});

socket.on("intermediate_result", (data) => {
  updateUI(data);
});

socket.on("final_result", (result) => {
  displayFinalResult(result);
});
```

이렇게 설계하면 복잡한 LangGraph 구조에서도 유연하게 결과를 처리하고 API로 제공할 수 있습니다!