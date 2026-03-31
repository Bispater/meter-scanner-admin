export type UserRole = 'admin' | 'operator';

export interface AppUser {
  id: string;
  username: string;
  password?: string;       // only used when creating/editing, never returned by API
  displayName: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  createdAt: string;       // ISO date

  /** IDs of apartments assigned to this operator (empty = all) */
  assignedApartmentIds: string[];
}
