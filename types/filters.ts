
import { ActivityCategory, ActivityVisibility } from './activity';

export type ActivityFilterCategory = "all" | ActivityCategory;
export type ActivityFilterJoined = "all" | "joined" | "not_joined";
export type ActivityFilterVisibility = "all" | ActivityVisibility;
export type OwnershipFilter = "all" | "mine" | "others";
export type SortOption = "distance" | "time" | "participants" | "popularity" | "newest";
export type HistoryFilter = "all" | "active" | "past";
export type BusinessFilter = "all" | "business" | "user";
