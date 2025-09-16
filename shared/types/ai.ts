// AI processing types for DRDO system - Bidirectional evaluation and analysis

import { BaseEntity } from './common';

export enum AIModelType {
  QUESTION_EVALUATOR = 'question_evaluator',
  ANSWER_EVALUATOR = 'answer_evaluator',
  BIAS_DETECTOR = 'bias_detector',
  EMOTION_ANALYZER = 'emotion_analyzer',
  QUESTION_GENERATOR = 'question_generator',
  TRANSLATOR = 'translator',
  SPEECH_PROCESSOR = 'speech_processor'
}

export enum EvaluationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Question Evaluation Types
export interface QuestionEvaluation extends BaseEntity {
  interviewId: string;
  questionText: string;
  relevanceScore: number; // 0-1
  difficultyScore: number; // 0-1
  clarityScore: number; // 0-1
  biasScore: number; // 0-1
  overallScore: number; // 0-1
  feedback: string;
  suggestions: string[];
  evaluatedAt: Date;
  modelVersion: string;
  confidence: number;
  processingTime: number; // milliseconds
}

export interface QuestionEvaluationRequest {
  question: string;
  candidateProfile: CandidateProfile;
  jobRequirements: JobRequirements;
  context: InterviewContext;
  evaluationCriteria?: QuestionCriteria;
}

export interface QuestionCriteria {
  domainAlignment: number; // weight 0-1
  difficultyAppropriateness: number; // weight 0-1
  questionClarity: number; // weight 0-1
  progressiveFlowLogic: number; // weight 0-1
  biasDetection: number; // weight 0-1
}

// Answer Evaluation Types
export interface AnswerEvaluation extends BaseEntity {
  interviewId: string;
  questionId: string;
  answerText: string;
  semanticRelevance: number; // 0-1
  technicalAccuracy: number; // 0-1
  communicationQuality: number; // 0-1
  depthOfUnderstanding: number; // 0-1
  overallScore: number; // 0-1
  strengths: string[];
  improvementAreas: string[];
  factualErrors: FactualError[];
  evaluatedAt: Date;
  modelVersion: string;
  confidence: number;
  processingTime: number;
}

export interface AnswerEvaluationRequest {
  question: string;
  answer: string;
  expectedResponse?: string;
  context: InterviewContext;
  evaluationCriteria?: AnswerCriteria;
}

export interface AnswerCriteria {
  semanticRelevance: number; // weight 0-1
  technicalAccuracy: number; // weight 0-1
  communicationQuality: number; // weight 0-1
  depthOfUnderstanding: number; // weight 0-1
}

export interface FactualError {
  type: 'technical' | 'conceptual' | 'numerical' | 'logical';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  suggestion: string;
  confidence: number;
}

// Bias Detection Types
export interface BiasAnalysis extends BaseEntity {
  interviewId: string;
  biasType: BiasType;
  severityScore: number; // 0-1
  description: string;
  affectedDemographics: string[];
  recommendations: string[];
  detectedAt: Date;
  confidence: number;
  evidencePoints: BiasEvidence[];
}

export enum BiasType {
  GENDER = 'gender',
  AGE = 'age',
  ETHNICITY = 'ethnicity',
  EDUCATIONAL_BACKGROUND = 'educational_background',
  SOCIOECONOMIC = 'socioeconomic',
  LINGUISTIC = 'linguistic',
  CULTURAL = 'cultural',
  APPEARANCE = 'appearance',
  DISABILITY = 'disability',
  UNCONSCIOUS = 'unconscious'
}

export interface BiasEvidence {
  type: 'question_phrasing' | 'evaluation_inconsistency' | 'demographic_correlation' | 'linguistic_pattern';
  description: string;
  severity: number;
  timestamp: Date;
  context: string;
}

export interface BiasDetectionRequest {
  interviewData: InterviewData;
  demographicData: DemographicData;
  historicalData?: HistoricalBiasData;
}

// Emotion Analysis Types
export interface EmotionAnalysis extends BaseEntity {
  interviewId: string;
  userId: string;
  timestamp: Date;
  confidence: number; // 0-1
  stressLevel: number; // 0-1
  engagement: number; // 0-1
  dominantEmotion: Emotion;
  facialExpressions: FacialExpression[];
  voiceIndicators: VoiceIndicator[];
  bodyLanguage?: BodyLanguageIndicator[];
  analysisMethod: 'facial' | 'voice' | 'multimodal';
}

export enum Emotion {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  FEARFUL = 'fearful',
  SURPRISED = 'surprised',
  DISGUSTED = 'disgusted',
  NEUTRAL = 'neutral',
  CONFIDENT = 'confident',
  NERVOUS = 'nervous',
  EXCITED = 'excited',
  CONFUSED = 'confused',
  FOCUSED = 'focused'
}

export interface FacialExpression {
  emotion: Emotion;
  intensity: number; // 0-1
  confidence: number; // 0-1
  landmarks: FacialLandmark[];
  microExpressions: MicroExpression[];
}

export interface FacialLandmark {
  point: string;
  x: number;
  y: number;
  confidence: number;
}

export interface MicroExpression {
  type: string;
  duration: number; // milliseconds
  intensity: number;
  significance: number;
}

export interface VoiceIndicator {
  feature: 'pitch' | 'tone' | 'pace' | 'volume' | 'tremor' | 'pause_frequency';
  value: number;
  normalizedValue: number; // 0-1
  interpretation: string;
  confidence: number;
}

export interface BodyLanguageIndicator {
  gesture: string;
  confidence: number;
  interpretation: string;
  timestamp: Date;
}

// Question Generation Types
export interface GeneratedQuestion {
  id: string;
  text: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  expectedAnswerTime: number; // seconds
  followUpQuestions: string[];
  evaluationCriteria: string[];
  tags: string[];
  confidence: number;
  generatedAt: Date;
  modelVersion: string;
}

export interface QuestionGenerationRequest {
  previousQuestions: QuestionAnswer[];
  candidateProfile: CandidateProfile;
  remainingTime: number;
  focusAreas: string[];
  difficulty: 'adaptive' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  questionType: 'technical' | 'behavioral' | 'situational' | 'problem_solving';
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  score: number;
  timestamp: Date;
  duration: number;
}

// Translation Types
export interface TranslationResult {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  processingTime: number;
  method: 'neural' | 'statistical' | 'hybrid';
  domainSpecific: boolean;
  translatedAt: Date;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  domain: 'technical' | 'general' | 'military' | 'aerospace' | 'electronics';
  preserveFormatting: boolean;
  realTime: boolean;
}

// Supporting Types
export interface CandidateProfile {
  id: string;
  education: string[];
  experience: string[];
  skills: string[];
  expertise: string[];
  preferredLanguage: string;
  backgroundSummary: string;
}

export interface JobRequirements {
  position: string;
  department: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  educationRequirements: string[];
  securityClearance: string;
}

export interface InterviewContext {
  interviewId: string;
  interviewType: string;
  currentPhase: 'introduction' | 'technical' | 'behavioral' | 'conclusion';
  timeElapsed: number;
  timeRemaining: number;
  questionsAsked: number;
  participantCount: number;
  language: string;
}

export interface InterviewData {
  questions: string[];
  answers: string[];
  evaluations: any[];
  participantData: any[];
  timeline: any[];
}

export interface DemographicData {
  age?: number;
  gender?: string;
  ethnicity?: string;
  education?: string;
  experience?: number;
  location?: string;
  // Note: This data is anonymized and used only for bias detection
}

export interface HistoricalBiasData {
  patterns: BiasPattern[];
  trends: BiasTrend[];
  benchmarks: BiasBenchmark[];
}

export interface BiasPattern {
  type: BiasType;
  frequency: number;
  severity: number;
  context: string[];
  timeframe: string;
}

export interface BiasTrend {
  type: BiasType;
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number;
  timeframe: string;
}

export interface BiasBenchmark {
  metric: string;
  value: number;
  target: number;
  industry: string;
  lastUpdated: Date;
}

// AI Model Management
export interface AIModel {
  id: string;
  name: string;
  type: AIModelType;
  version: string;
  description: string;
  accuracy: number;
  performance: ModelPerformance;
  isActive: boolean;
  trainingData: string;
  lastTrained: Date;
  deployedAt: Date;
  configuration: Record<string, any>;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number; // milliseconds
  throughput: number; // requests per second
  errorRate: number;
  lastEvaluated: Date;
}

export interface AIProcessingJob {
  id: string;
  type: AIModelType;
  status: EvaluationStatus;
  inputData: any;
  outputData?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  processingTime?: number;
  modelVersion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}