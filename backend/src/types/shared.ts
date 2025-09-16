/**
 * Shared types and interfaces used across frontend and backend
 */

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId?: string;
    processingTime?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Language and Localization types
export type SupportedLanguage = 'hindi' | 'english';

export interface LocalizedContent {
  hindi: string;
  english: string;
}

export interface TranslationKey {
  key: string;
  defaultValue: string;
  namespace?: string;
}

// Form and Validation types
export interface FormField {
  name: string;
  label: LocalizedContent;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  options?: {
    value: string;
    label: LocalizedContent;
  }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
  };
  placeholder?: LocalizedContent;
  helpText?: LocalizedContent;
}

export interface FormSection {
  id: string;
  title: LocalizedContent;
  description?: LocalizedContent;
  fields: FormField[];
  order: number;
}

// Analytics and Reporting types
export interface AnalyticsData {
  totalUsers: number;
  totalRecommendations: number;
  popularCareers: {
    career: string;
    count: number;
    percentage: number;
  }[];
  demographicBreakdown: {
    byGender: Record<string, number>;
    byCategory: Record<string, number>;
    byBoard: Record<string, number>;
    byLocation: Record<string, number>;
  };
  trendsOverTime: {
    date: string;
    users: number;
    recommendations: number;
  }[];
  satisfactionMetrics?: {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Record<string, number>;
  };
}

export interface ReportFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  demographics?: {
    gender?: string[];
    category?: string[];
    board?: string[];
    location?: string[];
  };
  careers?: string[];
  includeAnonymized?: boolean;
}

// Notification and Webhook types
export interface NotificationPayload {
  studentName: string;
  selectedCareers: string[];
  timestamp: Date;
  profileId: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    parentEmail?: string;
  };
  metadata?: {
    source: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
  retryAttempts?: number;
  timeout?: number;
}

// Error handling types
export interface ErrorInfo {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'database' | 'api' | 'ai' | 'system';
  timestamp: Date;
  context?: {
    userId?: string;
    profileId?: string;
    endpoint?: string;
    userAgent?: string;
  };
  stackTrace?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  requestId?: string;
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  ai: {
    provider: 'openai' | 'custom';
    model: string;
    maxTokens: number;
    temperature: number;
  };
  features: {
    analytics: boolean;
    webhooks: boolean;
    multilingual: boolean;
    visualReports: boolean;
  };
  limits: {
    maxRecommendations: number;
    maxProfilesPerDay: number;
    rateLimitPerMinute: number;
  };
}

// Search and Filter types
export interface SearchCriteria {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets?: Record<string, { value: string; count: number }[]>;
}

// UI Component types
export interface ComponentProps {
  className?: string;
  children?: any;
  testId?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  dismissible?: boolean;
  duration?: number;
}

// Data export types
export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  includePersonalData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fields?: string[];
  language?: SupportedLanguage;
}

export interface ExportResult {
  filename: string;
  url: string;
  size: number;
  format: string;
  generatedAt: Date;
  expiresAt: Date;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Constants
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['hindi', 'english'];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const EDUCATION_BOARDS = [
  'CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'NIOS'
];

export const STUDENT_CATEGORIES = [
  'General', 'OBC', 'SC', 'ST', 'EWS'
];

export const GRADE_LEVELS = [
  '9', '10', '11', '12', 'Undergraduate', 'Postgraduate'
];

export const FAMILY_INCOME_RANGES = [
  'Below 1 Lakh', '1-3 Lakhs', '3-5 Lakhs', '5-10 Lakhs', 
  '10-20 Lakhs', '20-50 Lakhs', 'Above 50 Lakhs'
];

export const COMMON_INTERESTS = [
  'Science', 'Mathematics', 'Technology', 'Arts', 'Literature', 'History',
  'Geography', 'Economics', 'Business', 'Sports', 'Music', 'Dance',
  'Drama', 'Social Work', 'Environment', 'Politics', 'Law', 'Medicine',
  'Engineering', 'Teaching', 'Research', 'Entrepreneurship'
];

export const ECONOMIC_FACTORS = [
  'Single Income Family', 'Dual Income Family', 'Agricultural Background',
  'Business Family', 'Government Employee Family', 'Private Sector Family',
  'Self Employed Family', 'Migrant Family', 'Joint Family', 'Nuclear Family',
  'Financial Constraints', 'Educational Loans Available', 'Scholarship Eligible'
];

export const DEVICE_ACCESS_OPTIONS = [
  'Smartphone', 'Laptop', 'Desktop', 'Tablet', 'Smart TV', 'None'
];

// Type guards
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return typeof obj === 'object' && typeof obj.success === 'boolean';
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return isApiResponse(obj) && obj.success === false && obj.error;
}

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}