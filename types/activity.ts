export type ActivityVisibility = "public" | "friends" | "private";

export type ActivityCategory =
  | "Chill"
  | "Sport"
  | "Party"
  | "Study"
  | "Gaming"
  | "Other";

export interface Activity {
  id: string; // Supabase row id (uuid)
  title: string;
  description: string;
  time: string; // z.B. "Today · 18:30" (deprecated, use startTime/endTime)
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  category: ActivityCategory;
  visibility: ActivityVisibility;
  hostName: string; // Anzeigename des Hosts
  hostId: string; // Interne User-ID des Hosts (deprecated, use hostUserId)
  hostUserId: string | null; // Interne User-ID des Hosts (primär)
  joinedUserIds: string[]; // Liste der User-IDs, die gejoined sind
  createdAt: string; // ISO-String aus Supabase
  startTime?: string | null; // ISO string (timestamptz in Supabase)
  endTime?: string | null; // ISO string (timestamptz in Supabase)
  isClosed?: boolean | null; // Activity wurde vom Host beendet
  // Business fields
  businessId?: string | null; // Business profile ID if this is a business activity
  isBusinessActivity?: boolean | null; // Whether this is created by a business
  promotionLevel?: "none" | "featured" | "boost" | "sponsored" | null; // Promotion level
  // Access control
  password?: string | null; // Optional password for joining the activity
  maxParticipants?: number | null; // Maximum number of participants (null = no limit)
}

