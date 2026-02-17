// types/activityMessage.ts
export interface ActivityMessage {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userEmoji: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string; // ISO string
}







