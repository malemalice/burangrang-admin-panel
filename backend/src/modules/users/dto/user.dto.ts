import { Exclude, Expose } from 'class-transformer';

export class UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: string;
  officeId: string;
  departmentId?: string;
  jobPositionId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;

  // Include the role object
  role?: any;
  office?: any;
  department?: any;
  jobPosition?: any;

  // Add a getter to extract role name as a string
  @Expose()
  get roleName(): string {
    if (this.role && typeof this.role === 'object' && 'name' in this.role) {
      const roleName = (this.role as { name: unknown }).name;
      return typeof roleName === 'string' ? roleName : String(roleName);
    }
    return 'User';
  }

  @Exclude()
  password: string;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
