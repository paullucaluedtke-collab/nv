export type ActivityVisibility = "public" | "friends" | "private";

export type ActivityCategory =
  | "chill"
  | "sport"
  | "party"
  | "study"
  | "gaming"
  | "other";

export interface Activity {
  id: string;
  title: string;
  description?: string;
  time: string;
  locationName: string;
  latitude: number;
  longitude: number;
  category: ActivityCategory;
  visibility: ActivityVisibility;
  maxParticipants: number;
  participantsCount: number;
  joined?: boolean;
  hostName?: string;
}

