// Analytics and reporting types for DRDO system

import { BaseEntity } from './common';
import { UserRole, SecurityLevel } from './auth';
import { InterviewStatus, InterviewType } from './interview';
import { BiasType, Emotion } from './ai';

export enum ReportType {
  INTERVIEW_SUMMARY = 'interview_summary',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  BIAS_REPORT = 'bias_report',
  SYSTEM_METRICS = 'system_metrics',
  USER_ACTIVITY = 'user_activity',
  COMPARATIVE_ANALYSIS = 'comparative_analysis',
  TREND_ANALYSIS = 'trend_analysis',
  COMPLIANCE_REPORT = 'compliance_report'
}

export enum MetricType {
  COUNT = 'count',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  RATIO = 'ratio',
  TREND = 'trend',
  DISTRIBUTION = 'distribution'
}

export enum TimeFrame {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

// Core Analytics Types
export interface AnalyticsReport extends BaseEntity {
  title: string;
  type: ReportType;
  description: string;
  timeFrame: TimeFrame;
  startDate: Date;
  endDate: Date;
  filters: ReportFilters;
  data: ReportData;
  visualizations: Visualization[];
  insights: Insight[];
  recommendations: string[];
  generatedBy: string;
  isPublic: boolean;
  tags: string[];
  exportFormats: string[];
  scheduledGeneration?: ScheduledGeneration;
}

export interface ReportFilters {
  departments?: string[];
  roles?: UserRole[];
  interviewTypes?: InterviewType[];
  securityClearances?: SecurityLevel[];
  dateRange?: DateRange;
  userIds?: string[];
  interviewIds?: string[];
  customFilters?: Record<string, any>;
}

export interface DateRange {
  start: Date;
  end: Date;
  timezone: string;
}

export interface ReportData {
  summary: SummaryMetrics;
  detailed: DetailedMetrics;
  comparisons: ComparisonMetrics;
  trends: TrendMetrics;
  distributions: DistributionMetrics;
  correlations: CorrelationMetrics;
}

// Metrics Types
export interface SummaryMetrics {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  averageDuration: number;
  participantCount: number;
  successRate: number;
  biasIncidents: number;
  technicalIssues: number;
  userSatisfaction: number;
  systemUptime: number;
}

export interface DetailedMetrics {
  interviewMetrics: InterviewMetrics[];
  userMetrics: UserMetrics[];
  performanceMetrics: PerformanceMetrics[];
  qualityMetrics: QualityMetrics[];
  engagementMetrics: EngagementMetrics[];
}

export interface InterviewMetrics {
  interviewId: string;
  title: string;
  type: InterviewType;
  status: InterviewStatus;
  duration: number;
  participantCount: number;
  overallScore: number;
  questionQuality: number;
  answerQuality: number;
  biasScore: number;
  technicalIssues: number;
  userSatisfaction: number;
  completionRate: number;
  date: Date;
}

export interface UserMetrics {
  userId: string;
  userName: string;
  role: UserRole;
  department: string;
  totalInterviews: number;
  averageScore: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  improvementAreas: string[];
  lastActivity: Date;
  engagementScore: number;
}

export interface PerformanceMetrics {
  metric: string;
  value: number;
  target: number;
  variance: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  category: 'system' | 'user' | 'interview' | 'ai';
  unit: string;
  description: string;
}

export interface QualityMetrics {
  dimension: string;
  score: number;
  benchmark: number;
  percentile: number;
  samples: number;
  confidence: number;
  factors: QualityFactor[];
}

export interface QualityFactor {
  name: string;
  impact: number;
  description: string;
  recommendation: string;
}

export interface EngagementMetrics {
  userId: string;
  sessionDuration: number;
  interactionCount: number;
  featureUsage: Record<string, number>;
  satisfactionScore: number;
  completionRate: number;
  returnRate: number;
  lastEngagement: Date;
}

// Comparison and Trend Analysis
export interface ComparisonMetrics {
  currentPeriod: PeriodMetrics;
  previousPeriod: PeriodMetrics;
  change: ChangeMetrics;
  benchmarks: BenchmarkMetrics[];
  peerComparisons: PeerComparison[];
}

export interface PeriodMetrics {
  period: string;
  startDate: Date;
  endDate: Date;
  metrics: Record<string, number>;
  highlights: string[];
  concerns: string[];
}

export interface ChangeMetrics {
  absolute: Record<string, number>;
  percentage: Record<string, number>;
  significance: Record<string, 'significant' | 'moderate' | 'minimal'>;
  direction: Record<string, 'positive' | 'negative' | 'neutral'>;
}

export interface BenchmarkMetrics {
  name: string;
  category: string;
  value: number;
  target: number;
  industry: number;
  percentile: number;
  status: 'above' | 'at' | 'below';
}

export interface PeerComparison {
  metric: string;
  userValue: number;
  peerAverage: number;
  peerMedian: number;
  ranking: number;
  totalPeers: number;
  percentile: number;
}

export interface TrendMetrics {
  timeSeries: TimeSeriesData[];
  seasonality: SeasonalityData;
  forecasts: ForecastData[];
  anomalies: AnomalyData[];
  patterns: PatternData[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metric: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface SeasonalityData {
  pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  strength: number;
  peaks: Date[];
  troughs: Date[];
  description: string;
}

export interface ForecastData {
  timestamp: Date;
  predicted: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
  method: string;
}

export interface AnomalyData {
  timestamp: Date;
  value: number;
  expected: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'trend_change' | 'outlier';
  description: string;
  investigated: boolean;
}

export interface PatternData {
  name: string;
  description: string;
  frequency: number;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendations: string[];
}

// Distribution Analysis
export interface DistributionMetrics {
  categorical: CategoricalDistribution[];
  numerical: NumericalDistribution[];
  correlations: CorrelationMatrix;
  clusters: ClusterAnalysis[];
}

export interface CategoricalDistribution {
  category: string;
  values: CategoryValue[];
  entropy: number;
  dominantCategory: string;
  diversity: number;
}

export interface CategoryValue {
  label: string;
  count: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface NumericalDistribution {
  metric: string;
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
  percentiles: Record<string, number>;
  outliers: number[];
}

export interface CorrelationMatrix {
  variables: string[];
  matrix: number[][];
  significantCorrelations: CorrelationPair[];
}

export interface CorrelationPair {
  variable1: string;
  variable2: string;
  correlation: number;
  pValue: number;
  significance: 'strong' | 'moderate' | 'weak';
  interpretation: string;
}

export interface CorrelationMetrics {
  strongCorrelations: CorrelationPair[];
  unexpectedCorrelations: CorrelationPair[];
  missingCorrelations: string[];
  insights: string[];
}

export interface ClusterAnalysis {
  method: string;
  clusters: Cluster[];
  silhouetteScore: number;
  optimalClusters: number;
  insights: string[];
}

export interface Cluster {
  id: string;
  name: string;
  size: number;
  centroid: Record<string, number>;
  characteristics: string[];
  members: string[];
  cohesion: number;
}

// Visualization Types
export interface Visualization {
  id: string;
  type: 'chart' | 'table' | 'map' | 'heatmap' | 'network' | 'dashboard';
  title: string;
  description: string;
  config: VisualizationConfig;
  data: any;
  interactivity: InteractivityOptions;
  exportOptions: ExportOptions;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'histogram' | 'box';
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colors?: string[];
  theme?: 'light' | 'dark';
  responsive?: boolean;
  animations?: boolean;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}

export interface AxisConfig {
  label: string;
  type: 'linear' | 'logarithmic' | 'time' | 'category';
  min?: number;
  max?: number;
  format?: string;
  gridLines?: boolean;
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
}

export interface TooltipConfig {
  show: boolean;
  format: string;
  multiline: boolean;
}

export interface InteractivityOptions {
  zoom: boolean;
  pan: boolean;
  select: boolean;
  filter: boolean;
  drill: boolean;
  crossFilter: boolean;
}

export interface ExportOptions {
  formats: ('png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json')[];
  resolution?: number;
  includeData?: boolean;
}

// Insights and Recommendations
export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'pattern' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'soon' | 'later';
  category: string;
  evidence: Evidence[];
  recommendations: Recommendation[];
  relatedInsights: string[];
}

export interface Evidence {
  type: 'statistical' | 'observational' | 'comparative' | 'historical';
  description: string;
  value: number;
  significance: number;
  source: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
  resources: string[];
  risks: string[];
  success_metrics: string[];
}

// Scheduled Reporting
export interface ScheduledGeneration {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'html' | 'csv' | 'json';
  autoSend: boolean;
  lastGenerated?: Date;
  nextGeneration: Date;
}

// Dashboard Types
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  permissions: DashboardPermissions;
  isPublic: boolean;
  createdBy: string;
  lastModified: Date;
  viewCount: number;
  favoriteCount: number;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  responsive: boolean;
  theme: 'light' | 'dark';
  spacing: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'image';
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: any;
  dataSource: string;
  refreshInterval: number; // seconds
  lastUpdated: Date;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number';
  options?: string[];
  defaultValue?: any;
  required: boolean;
  global: boolean;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  share: string[];
  delete: string[];
}

// Real-time Analytics
export interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  activeInterviews: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'performance' | 'security' | 'business' | 'technical';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}