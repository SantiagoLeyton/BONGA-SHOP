/** Prepared for future auth integration */
export interface UserModel {
  id: string;
  email: string;
  displayName?: string;
  role?: 'customer' | 'admin';
}
