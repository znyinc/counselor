/**
 * Frontend TypeScript interfaces and types
 * These mirror the backend types for consistency
 */

// Re-export shared types that are used in frontend
export type SupportedLanguage = 'hindi' | 'english';

// Student Profile types (frontend version)
export interface SocioeconomicData {
  location: string;
  familyBackground: string;
  economicFactors: string[];
  parentOccupation?: {
    father?: string;
    mother?: string;
  };
  householdSize?: number;
  ruralUrban: 'rural' | 'urban' | 'semi-urban';
  transportMode?: string;
  internetAccess: boolean;
  deviceAccess: string[];
}

export interface AcademicData {
  interests: string[];
  subjects: string[];
  performance: string;
  favoriteSubjects: string[];
  difficultSubjects: string[];
  extracurricularActivities: string[];
  achievements?: string[];
}

export interface PersonalInfo {
  name: string;
  grade: string;
  board: string;
  languagePreference: SupportedLanguage;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  category?: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  physicallyDisabled?: boolean;
}

export interface StudentProfile {
  id: string;
  timestamp: Date;
  personalInfo: PersonalInfo;
  academicData: AcademicData;
  socioeconomicData: SocioeconomicData;
  familyIncome: string;
  aspirations?: {
    preferredCareers: string[];
    preferredLocations: string[];
    salaryExpectations?: string;
    workLifeBalance?: 'high' | 'medium' | 'low';
  };
  constraints?: {
    financialConstraints: boolean;
    locationConstraints: string[];
    familyExpectations: string[];
    timeConstraints?: string;
  };
}

// Career Recommendation types (frontend version)
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface PathData {
  steps: {
    title: string;
    description: string;
    duration: string;
    requirements: string[];
  }[];
  totalDuration: string;
  alternativePaths?: {
    title: string;
    description: string;
    steps: string[];
  }[];
}

export interface RequirementData {
  education: {
    level: string;
    subjects: string[];
    minimumMarks: string;
    preferredBoards: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
    certifications: string[];
  };
  experience: {
    internships: string[];
    projects: string[];
    competitions: string[];
  };
}

export interface VisualizationData {
  salaryTrends: ChartData;
  educationPath: PathData;
  requirements: RequirementData;
  jobMarketTrends?: ChartData;
  skillsRadar?: ChartData;
  geographicDistribution?: ChartData;
}

export interface College {
  id: string;
  name: string;
  location: string;
  type: 'government' | 'private' | 'deemed';
  courses: string[];
  entranceExams: string[];
  fees: {
    annual: number;
    currency: string;
  };
  rankings: {
    nirf: number;
    category: string;
  };
  website?: string;
  established?: number;
}

export interface Scholarship {
  id: string;
  name: string;
  description: string;
  provider: string;
  eligibility: {
    categories?: string[];
    classes?: string[];
    courses?: string[];
    subjects?: string[];
    incomeLimit?: number;
    academicCriteria?: string;
    gender?: string;
    ageLimit?: number;
    qualification?: string[];
    disabilityPercentage?: number;
  };
  amount: {
    [key: string]: number | string;
    currency: string;
  };
  applicationPeriod: string;
  website?: string;
  renewable: boolean;
  type: 'Merit-based' | 'Need-based' | 'Merit-cum-Means';
}

export interface CareerRecommendation {
  id: string;
  title: string;
  description: string;
  nepAlignment: string;
  matchScore: number;
  requirements: {
    education: string[];
    skills: string[];
    entranceExams: string[];
    certifications?: string[];
    experience?: string[];
    personalityTraits?: string[];
  };
  prospects: {
    averageSalary: {
      entry: number;
      mid: number;
      senior: number;
      currency: string;
    };
    growthRate: string;
    jobMarket: string;
    demandLevel: 'high' | 'medium' | 'low';
    futureOutlook: string;
    workLifeBalance: 'excellent' | 'good' | 'average' | 'challenging';
  };
  recommendedColleges: College[];
  scholarships: Scholarship[];
  visualData: VisualizationData;
  pros: string[];
  cons: string[];
  dayInLife?: string;
  careerPath?: string[];
  relatedCareers?: string[];
  industryInsights?: {
    topCompanies: string[];
    emergingTrends: string[];
    challenges: string[];
    opportunities: string[];
  };
}

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

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  options?: {
    value: string;
    label: string;
  }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  placeholder?: string;
  helpText?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

export interface FormErrors {
  [fieldName: string]: string[];
}

export interface FormState {
  values: Record<string, any>;
  errors: FormErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// UI Component types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
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

// Language and Context types
export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultValue?: string) => string;
}

export interface AppContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  studentProfile?: StudentProfile;
  setStudentProfile: (profile: StudentProfile) => void;
  recommendations?: CareerRecommendation[];
  setRecommendations: (recommendations: CareerRecommendation[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  alerts: AlertMessage[];
  addAlert: (alert: AlertMessage) => void;
  removeAlert: (index: number) => void;
}

// Route types
export interface RouteParams {
  [key: string]: string | undefined;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  requiresAuth?: boolean;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customProperties?: Record<string, any>;
}

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

// Utility functions
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatSalaryRange(entry: number, senior: number, currency: string = 'INR'): string {
  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  const symbol = currency === 'INR' ? '₹' : currency + ' ';
  return `${symbol}${formatAmount(entry)} - ${symbol}${formatAmount(senior)}`;
}

export function calculateProfileCompleteness(profile: Partial<StudentProfile>): number {
  if (!profile) return 0;
  
  let totalFields = 0;
  let completedFields = 0;

  // Check personal info
  if (profile.personalInfo) {
    const personalFields = ['name', 'grade', 'board', 'languagePreference'];
    totalFields += personalFields.length;
    completedFields += personalFields.filter(field => 
      profile.personalInfo![field as keyof PersonalInfo]
    ).length;
  }

  // Check academic data
  if (profile.academicData) {
    const academicFields = ['interests', 'subjects', 'performance'];
    totalFields += academicFields.length;
    completedFields += academicFields.filter(field => {
      const value = profile.academicData![field as keyof AcademicData];
      return Array.isArray(value) ? value.length > 0 : !!value;
    }).length;
  }

  // Check socioeconomic data
  if (profile.socioeconomicData) {
    const socioFields = ['location', 'familyBackground', 'economicFactors', 'ruralUrban', 'internetAccess'];
    totalFields += socioFields.length;
    completedFields += socioFields.filter(field => {
      const value = profile.socioeconomicData![field as keyof SocioeconomicData];
      return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
    }).length;
  }

  // Check family income
  totalFields += 1;
  if (profile.familyIncome) completedFields += 1;

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

// Type guards
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return typeof obj === 'object' && typeof obj.success === 'boolean';
}

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}