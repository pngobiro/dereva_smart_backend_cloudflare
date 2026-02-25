export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  AI: any;
  JWT_SECRET: string;
  MPESA_CONSUMER_KEY: string;
  MPESA_CONSUMER_SECRET: string;
  MPESA_SHORTCODE: string;
  MPESA_PASSKEY: string;
  GEMINI_API_KEY: string;
  AFRICASTALKING_API_KEY: string;
  AFRICASTALKING_USERNAME: string;
  AFRICASTALKING_SENDER_ID: string;
  ENVIRONMENT: string;
}
