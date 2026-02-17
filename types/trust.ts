// types/trust.ts

export type TrustLevel = "unverified" | "basic" | "verified" | "trusted" | "premium";

export type VerificationStatus = "pending" | "verified" | "failed" | "not_started" | "rejected";

export interface SocialVerification {
  platform: "phone" | "google" | "facebook";
  status: VerificationStatus;
  verifiedAt: string | null;
  username?: string; // For social platforms
  phoneNumber?: string; // For phone (hashed/stored securely)
}

export interface FaceVerification {
  status: VerificationStatus;
  verifiedAt: string | null;
  verificationId?: string; // ID from face verification service
  confidence?: number; // Confidence score 0-100
  imageUrl?: string | null;
  submittedAt?: string | null;
}

export interface TrustProfile {
  userId: string;
  trustLevel: TrustLevel;
  trustScore: number; // 0-100
  socialVerifications: SocialVerification[];
  faceVerification: FaceVerification | null;
  createdAt: string;
  updatedAt: string;
}

// Trust score calculation weights
export const TRUST_WEIGHTS = {
  PHONE_VERIFIED: 20,
  GOOGLE_VERIFIED: 15,
  FACEBOOK_VERIFIED: 15,
  FACE_VERIFIED: 30,
  PROFILE_COMPLETE: 10, // Has bio, image, etc.
} as const;

// Trust level thresholds
export const TRUST_THRESHOLDS = {
  BASIC: 10,
  VERIFIED: 30,
  TRUSTED: 60,
  PREMIUM: 90,
} as const;

