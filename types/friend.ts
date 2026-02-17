export type FriendStatus = "pending" | "accepted" | "blocked";

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendWithProfile extends Friend {
  friendDisplayName: string | null;
  friendProfileImageUrl: string | null;
  userDisplayName: string | null;
  userProfileImageUrl: string | null;
}

