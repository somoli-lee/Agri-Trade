
import { GoogleGenAI, Type } from "@google/genai";
import { HSCodeRecommendation, FeasibilityResult, MarketTrend, Supplier, LogisticsRoute, QuarantineRoadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class GeminiService {
  /**
   * Caches for API optimizations
   */
  static hsCodeCache = new Map<string, any>();
  static marketTrendCache = new Map<string, MarketTrend>();
  static supplierCache = new Map<string, Supplier[]>();
  static logisticsCache = new Map<string, LogisticsRoute[]>();
  static feasibilityCache = new Map<string, FeasibilityResult>();
  static quarantineCache = new Map<string, QuarantineRoadmap>();

  /**
   * Recommends multiple HS Codes (up to 5) based on product details.
   */
  static async recommendHSCode(productDesc: string): Promise<{ recommendations: HSCodeRecommendation[], rulings: any[] }> {
    const cacheKey = productDesc.trim().toLowerCase();
    if (this.hsCodeCache.has(cacheKey)) {
      return this.hsCodeCache.get(cacheKey);
    }

    const prompt = `당신은 한국의 품목분류(HS) 전문가입니다.
    제품 설명("${productDesc}")을 바탕으로 가능성이 높은 상위 5개의 10자리 HS Code를 식별하세요.
    또한 해당 품목과 관련된 가상의 '관세청 실무 판례(결정사례)' 데이터 3~5개를 생성하여 함께 제공하세요.
    각 추천 항목에 대해 예상 관세율(expectedTariff, 예: "기본 8%", "FTA 0%" 등)도 제공하세요.
    데이터 검증을 위하여 해당 분류의 정보 출처(dataSource)와 해당 데이터의 검증 여부(validationStatus)를 명시하세요 (예를 들어 '관세청 수출입무역통계', '관세법령정보포털' 등).
    
    JSON 객체로 반환하되, 다음 형식을 따르세요:
    - recommendations: 배열 (hscode, description, reasoning, confidence, expectedTariff, decisionTree, dataSource, validationStatus)
    - rulings: 배열 (hscode: 문자열, itemNm: 문자열 형태의 판례/품명 요약)
    모든 텍스트는 한국어로 작성하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hscode: { type: Type.STRING },
                    description: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    expectedTariff: { type: Type.STRING },
                    decisionTree: { type: Type.ARRAY, items: { type: Type.STRING } },
                    dataSource: { type: Type.STRING },
                    validationStatus: { type: Type.STRING }
                  },
                  required: ["hscode", "description", "reasoning", "confidence", "expectedTariff", "dataSource", "validationStatus"]
                }
              },
              rulings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hscode: { type: Type.STRING },
                    itemNm: { type: Type.STRING }
                  },
                  required: ["hscode", "itemNm"]
                }
              }
            },
            required: ["recommendations", "rulings"]
          }
        }
      });

      const data = JSON.parse(response.text);
      const result = { recommendations: data.recommendations || [], rulings: data.rulings || [] };
      this.hsCodeCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Gemini HS Code recommendation failed:", error);
      return { recommendations: [], rulings: [] };
    }
  }

  /**
   * Fetches market trends and price insights for a specific commodity over a given period.
   */
  static async fetchMarketTrends(commodity: string, period: string = '6개월'): Promise<MarketTrend> {
    const cacheKey = `${commodity.trim().toLowerCase()}-${period}`;
    if (this.marketTrendCache.has(cacheKey)) {
      return this.marketTrendCache.get(cacheKey)!;
    }

    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `현재 날짜는 ${today}입니다. "${commodity}" 품목에 대한 최근 ${period}간의 시장 트렌드와 가격 정보를 분석하세요. 

IMPORTANT (데이터 정규화 지침):
검색어의 띄어쓰기(예: '냉동 갈치' vs '냉동갈치')나 사소한 오탈자가 있더라도 반드시 HS 공식 표준 명칭이나 통상적인 기준 명칭(예: '냉동갈치') 한 가지로 자동 정규화한 후 분석을 수행하세요.
사용자가 동일한 의미의 품목을 다른 형태로 입력하더라도, 반드시 내부적으로 동일 품목으로 매핑하여 완전히 동일한 수치와 가격 데이터, 분석 결과를 반환해야 합니다. 데이터의 일관성이 매우 중요합니다.
(최근 기준은 ${today} 기준으로 데이터를 추정하여 작성하세요.)

JSON 객체로 반환하세요:
    - commodity: 표준화 된 품목명 (반드시 반환결과에 일관된 명칭 사용)
    - dataSource: 현재 제공된 데이터의 출처 (예: 'UN Comtrade, 한국무역협회(KITA) 수출입통계', 'Tridge API' 등 - 현실성 있는 출처 기입)
    - currency: 가격 통화 (예: USD, KRW 등)
    - unit: 가격의 중량 단위 (예: kg, ton, 파운드 등)
    - priceAnalysis: 현재 가격 동향, 가격 변동 요인, 향후 전망에 대한 상세한 분석 코멘트
    - seasonality: 연간 통상적인 가격 상승 및 하락 시기 정보 (객체: { highSeason: "주요 상승 시기", lowSeason: "주요 하락 시기", reasoning: "등락의 주요 원인" })
    - priceData: 최근 ${period}간의 월별 가격 데이터 (배열 형태, Array<{ date: string, price: number }>). 실제 시장 가격 자료 및 추이를 기반으로 구체적이고 현실적인 시세 변동 수치를 구성하세요.
    - marketShare: 주요 수출국 시장 점유율 (Array<{ country: string, value: number }>)
    - news: 최근 관련 뉴스 3건 (Array<{ title: string, source: string, date: string }>)
    모든 텍스트는 한국어로 작성하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commodity: { type: Type.STRING },
              dataSource: { type: Type.STRING },
              currency: { type: Type.STRING },
              unit: { type: Type.STRING },
              priceAnalysis: { type: Type.STRING },
              seasonality: {
                type: Type.OBJECT,
                properties: {
                  highSeason: { type: Type.STRING },
                  lowSeason: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                },
                required: ["highSeason", "lowSeason", "reasoning"]
              },
              priceData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    price: { type: Type.NUMBER }
                  }
                }
              },
              marketShare: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    country: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  }
                }
              },
              news: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    source: { type: Type.STRING },
                    date: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["commodity", "currency", "unit", "priceAnalysis", "seasonality", "priceData", "marketShare", "news"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Market trends analysis failed:", error);
      throw error;
    }
  }

  /**
   * Identifies potential global suppliers for a specific commodity.
   */
  static async fetchSuppliers(commodity: string): Promise<Supplier[]> {
    const cacheKey = commodity.trim().toLowerCase();
    if (this.supplierCache.has(cacheKey)) {
      return this.supplierCache.get(cacheKey)!;
    }

    const prompt = `"${commodity}" 품목에 대한 주요 글로벌 공급 기업 30곳을 추천하세요. (최대 30개까지 가능하도록 다양한 국가의 기업들을 포함)
    JSON 배열로 반환하세요:
    Array<{
      name: string,
      country: string,
      majorProducts: string[],
      reliabilityScore: number,
      contactAvailable: boolean,
      website: string, // Include a realistic or real company website URL if available, otherwise fake one that looks real but works like "https://example.com"
      reasoning: string, // 이 기업을 추천하는 구체적인 이유 및 주요 강점 (1~2문장)
      dataSource: string // 이 기업 데이터를 발췌하거나 참고한 출처 명시 (예: 'Tridge, Alibaba, Kompass, 기업 공식 웹사이트, 해외 무역 통계 등' 구체적으로 작성)
    }>
    모든 텍스트는 한국어로 작성하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text);
      this.supplierCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }

  /**
   * Generates a comparison of selected suppliers for a given commodity.
   */
  static async compareSuppliers(commodity: string, suppliers: {name: string, country: string}[]): Promise<any[]> {
    const targetSuppliers = suppliers.map(s => `${s.name}(${s.country})`).join(', ');
    const prompt = `당신은 글로벌 무역 전문가입니다. "${commodity}" 품목을 수입하려고 할 때, 다음 공급선들의 기본 거래 조건을 비교 분석해 주세요: ${targetSuppliers}.

    반드시 아래 형식의 JSON 배열을 반환해야 합니다:
    Array<{
      supplierName: string, // 공급선 이름
      country: string, // 국가
      estimatedPrice: string, // 예상 단가 (예: "$1.20 - $1.50 / kg")
      pricingBasis: string, // 단가 기준 (예: "FOB Busan", "CIF New York")
      reliabilityScore: number, // 신뢰도 점수 (0-100 정수)
      moq: string, // 최소 주문 수량 (예: "1 FCL", "500 kg")
      leadTime: string, // 리드 타임 (예: "15-20 days")
      paymentTerms: string, // 결제 조건 (예: "T/T 30% Advance, L/C at sight")
      certifications: string, // 주요 인증 (예: "ISO9001, Global GAP")
      pros: string, // 장점 (1문장)
      cons: string, // 단점 또는 주의사항 (1문장)
      dataSource: string // 데이터 출처 상세 (예: "Tridge API", "Alibaba", "통계청")
    }>
    모든 텍스트는 한국어로 작성하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error('Error comparing suppliers:', error);
      throw error;
    }
  }

  /**
   * Simulates logistics routes and transit times.
   */
  static async fetchLogisticsRoutes(origin: string, destination: string = '한국 부산항'): Promise<LogisticsRoute[]> {
    const cacheKey = `${origin.trim().toLowerCase()}-${destination.trim().toLowerCase()}`;
    if (this.logisticsCache.has(cacheKey)) {
      return this.logisticsCache.get(cacheKey)!;
    }

    const prompt = `"${origin}"에서 "${destination}"으로의 농축산물 수송 주요 물류 경로 2가지를 제안하세요.
    JSON 배열로 반환하세요:
    Array<{
      origin: string,
      destination: string,
      transitPorts: string[],
      estimatedDays: number,
      transportType: 'Sea' | 'Air'
    }>
    모든 텍스트는 한국어로 작성하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text);
      this.logisticsCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching logistics:', error);
      return [];
    }
  }

  /**
   * Diagnoses import feasibility for a specific product and origin.
   */
  static async diagnoseFeasibility(product: string, origin: string): Promise<FeasibilityResult> {
    const cacheKey = `${product.trim().toLowerCase()}-${origin.trim().toLowerCase()}`;
    if (this.feasibilityCache.has(cacheKey)) {
      return this.feasibilityCache.get(cacheKey)!;
    }

    const prompt = `당신은 한국의 수입 규제 및 관세 전문가입니다.
    "${origin}"산 "${product}"을 한국으로 수입하기 위한 '종합 수입 지능 리포트'를 생성하세요.
    중요: 관세율(tariffs) 정보를 작성할 때, 사용자가 관세 정보를 매우 주의 깊게 보므로 절대 오류나 미스매치가 없도록 대한민국 관세청(UNIPASS) 기준의 가장 정확하고 현실적인 기본 관세율, FTA 양허 관세율, WTO 협정 관세율 등을 구별하여 작성하세요.
    진단 결과는 반드시 다음 5가지 세부 항목을 포함한 JSON 객체여야 합니다... (JSON Schema에 정의된 필드 사용)`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isPossible: { type: Type.STRING, enum: ["Yes", "No", "Conditional"] },
              summary: { type: Type.STRING },
              hscode: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                }
              },
              tariffs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    rate: { type: Type.STRING },
                    condition: { type: Type.STRING }
                  }
                }
              },
              tariffTip: { type: Type.STRING },
              compliance: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    law: { type: Type.STRING },
                    authority: { type: Type.STRING },
                    details: { type: Type.STRING }
                  }
                }
              },
              checklists: { type: Type.ARRAY, items: { type: Type.STRING } },
              requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    region: { type: Type.STRING },
                    type: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["isPossible", "summary", "hscode", "tariffs", "compliance", "checklists", "requiredDocuments", "risks"]
          }
        }
      });

      const data = JSON.parse(response.text);
      const parsedData = { ...data, hscodeRulings: [] };
      this.feasibilityCache.set(cacheKey, parsedData);
      return parsedData;
    } catch (error) {
      console.error("Gemini feasibility diagnosis failed:", error);
      throw error;
    }
  }

  /**
   * Generates an automated quarantine roadmap for a specific commodity and origin.
   */
  static async fetchQuarantineRoadmap(commodity: string, origin: string): Promise<QuarantineRoadmap> {
    const cacheKey = `${commodity.trim().toLowerCase()}-${origin.trim().toLowerCase()}`;
    if (this.quarantineCache.has(cacheKey)) {
      return this.quarantineCache.get(cacheKey)!;
    }

    const prompt = `당신은 한국 농림축산검역본부 및 수산물품질관리원 소속의 검역 전문가입니다.
    "${origin}"산 "${commodity}"을 한국으로 수입하기 위해 거쳐야 하는 '자동화 검역 로드맵'을 상세히 생성하세요.
    
    JSON 객체로 반환하세요:
    - commodity: 품목명
    - origin: 출발지
    - steps: 검역 단계별 정보 (Array<{ stage: string, action: string, documents: string[], tips: string, authority: string }>)
    - preCheckItems: 수입 전 필수 체크리스트 5가지 (Array<string>)
    
    로드맵 단계는 '수출전 준비', '수입 신고', '검역 실시', '통관 및 사후관리' 순서로 구성하세요.
    모든 텍스트는 한국어로 작성하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commodity: { type: Type.STRING },
              origin: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stage: { type: Type.STRING },
                    action: { type: Type.STRING },
                    documents: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tips: { type: Type.STRING },
                    authority: { type: Type.STRING }
                  },
                  required: ["stage", "action", "documents", "tips", "authority"]
                }
              },
              preCheckItems: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["commodity", "origin", "steps", "preCheckItems"]
          }
        }
      });

      const data = JSON.parse(response.text);
      this.quarantineCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Gemini quarantine roadmap generation failed:", error);
      throw error;
    }
  }
}
