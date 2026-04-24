
export type Category = 'Agricultural' | 'Marine' | 'Livestock' | 'Processed';

export interface HSCodeRecommendation {
  hscode: string;
  description: string;
  reasoning: string;
  confidence: number;
  expectedTariff?: string;
  decisionTree?: string[];
  dataSource?: string;
  validationStatus?: string;
}

export interface MarketTrend {
  commodity: string;
  currency: string;
  unit: string;
  priceAnalysis: string;
  seasonality: {
    highSeason: string;
    lowSeason: string;
    reasoning: string;
  };
  priceData: { date: string; price: number }[];
  marketShare: { country: string; value: number }[];
  news: { title: string; source: string; date: string }[];
  dataSource?: string;
}

export interface ImportRequirement {
  stage: string;
  action: string;
  documents: string[];
  tips?: string;
  mandatory: boolean;
}

export interface RiskAlert {
  id: string;
  type: 'Disease' | 'Pest' | 'Regulation' | 'NonCompliance';
  title: string;
  region: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface Supplier {
  name: string;
  country: string;
  majorProducts: string[];
  reliabilityScore: number;
  contactAvailable: boolean;
  website?: string;
  reasoning: string;
  dataSource: string;
}

export interface SupplierComparison {
  supplierName: string;
  country: string;
  estimatedPrice: string;
  moq: string;
  leadTime: string;
  paymentTerms: string;
  certifications: string;
  pros: string;
  cons: string;
}

export interface LogisticsRoute {
  origin: string;
  destination: string;
  transitPorts: string[];
  estimatedDays: number;
  transportType: 'Sea' | 'Air';
}

export interface LandedCost {
  fob: number;
  freight: number;
  insurance: number;
  cifKrw: number;
  customsDuty: number;
  vat: number;
  quarantineFee: number;
  warehouseFee: number;
  total: number;
  exchangeRate: number;
}

export interface TariffRow {
  category: string;
  rate: string;
  condition: string;
}

export interface ComplianceInfo {
  law: string;
  authority: string;
  details: string;
}

export interface FeasibilityResult {
  isPossible: 'Yes' | 'No' | 'Conditional';
  summary: string;
  hscode?: {
    code: string;
    reasoning: string;
  };
  hscodeRulings?: any[]; // For storing past rulings from KCS API
  tariffs?: TariffRow[];
  tariffTip?: string;
  compliance?: ComplianceInfo[];
  checklists: string[];
  requiredDocuments: string[];
  risks: RiskAlert[];
}

export interface QuarantineStep {
  stage: string;
  action: string;
  documents: string[];
  tips: string;
  authority: string;
}

export interface QuarantineRoadmap {
  commodity: string;
  origin: string;
  steps: QuarantineStep[];
  preCheckItems: string[];
}
