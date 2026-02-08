export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string | null;
  userTypeId?: number | null;
  mustChangePassword?: boolean;
}
