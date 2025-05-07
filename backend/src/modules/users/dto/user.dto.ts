import { Exclude, Expose } from 'class-transformer';

export class UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: string;
  officeId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
  
  // Include the role object
  role?: any;
  office?: any;
  
  // Add a getter to extract role name as a string
  @Expose()
  get roleName(): string {
    return this.role?.name || 'User';
  }

  @Exclude()
  password: string;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
} 