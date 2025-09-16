/**
 * Global type declarations
 */

declare global {
  namespace NodeJS {
    interface Global {
      profileSubmissionTracker: Map<string, { count: number; resetTime: number }>;
      webhookRateLimitTracker: Map<string, { count: number; resetTime: number }>;
    }
  }
  
  var profileSubmissionTracker: Map<string, { count: number; resetTime: number }>;
  var webhookRateLimitTracker: Map<string, { count: number; resetTime: number }>;
}

export {};