// types/business.ts

export type BusinessType =
  | "club"
  | "bar"
  | "restaurant"
  | "sport_club"
  | "cafe"
  | "event_venue"
  | "gym"
  | "other";

export type BusinessStatus = "pending" | "verified" | "rejected" | "suspended";

export interface BusinessProfile {
  id: string; // UUID
  userId: string; // Owner user ID (from auth)
  businessName: string;
  businessType: BusinessType;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  
  // Location
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Media
  logoUrl: string | null;
  coverImageUrl: string | null;
  galleryUrls: string[] | null; // Max 10 images
  
  // Business hours (JSONB)
  openingHours: BusinessHours | null;
  
  // Verification & Status
  status: BusinessStatus;
  verifiedAt: string | null;
  verifiedBy: string | null; // Admin user ID
  
  // Business details
  taxId: string | null; // For invoicing
  registrationNumber: string | null; // Handelsregister etc.
  
  // Features & Settings
  canCreateActivities: boolean;
  canPromoteActivities: boolean; // Requires payment
  promotionCredits: number; // Available promotion credits
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface BusinessHours {
  monday?: DayHours | null;
  tuesday?: DayHours | null;
  wednesday?: DayHours | null;
  thursday?: DayHours | null;
  friday?: DayHours | null;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
}

export interface DayHours {
  open: string; // HH:mm format
  close: string; // HH:mm format
  closed?: boolean; // If true, business is closed this day
}

export interface BusinessOffer {
  id: string; // UUID
  businessId: string;
  activityId: string; // Linked activity
  title: string;
  description: string | null;
  discountType: "percentage" | "fixed" | "free_item" | "other";
  discountValue: number | null; // Percentage (0-100) or fixed amount in cents
  terms: string | null; // Terms and conditions
  validFrom: string; // ISO timestamp
  validUntil: string; // ISO timestamp
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityPromotion {
  id: string; // UUID
  activityId: string;
  businessId: string;
  promotionType: "featured" | "boost" | "sponsored";
  startDate: string; // ISO timestamp
  endDate: string; // ISO timestamp
  cost: number; // Cost in cents
  status: "pending" | "active" | "expired" | "cancelled";
  createdAt: string;
}

