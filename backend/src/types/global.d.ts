declare module 'isomorphic-dompurify';
declare module 'validator';
declare module 'bcrypt';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }

  var profileSubmissionTracker: any;
  var webhookRateLimitTracker: any;
}

export {};
