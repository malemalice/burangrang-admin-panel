export interface User {
  id: string;
  name?: string;
  email?: string;
  roleId?: string;
  officeId?: string;
  departmentId: string | null;
  jobPositionId: string | null;
  role?: string;
  position?: string;
  department?: {
    id: string;
    name: string;
  };
  jobPosition?: {
    id: string;
    name: string;
  };
  status?: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  lastLoginAt?: Date;
} 