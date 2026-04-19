import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  roleId: string;

  @ApiProperty()
  @Expose()
  officeId: string;

  @ApiProperty({ required: false })
  @Expose()
  departmentId?: string;

  @ApiProperty({ required: false })
  @Expose()
  jobPositionId?: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  companyId?: string | null;

  @ApiProperty({ required: false })
  @Expose()
  company?: { id: string; name: string; code: string };

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  lastLoginAt?: Date | null;

  // Include the role object
  @ApiProperty({ required: false })
  @Expose()
  role?: any;

  @ApiProperty({ required: false })
  @Expose()
  office?: any;

  @ApiProperty({ required: false })
  @Expose()
  department?: any;

  @ApiProperty({ required: false })
  @Expose()
  jobPosition?: any;

  @ApiProperty({ required: false, type: [String], description: 'Permission names from role (e.g. for current user)' })
  @Expose()
  permissions?: string[];

  // Add a getter to extract role name as a string
  @ApiProperty({ description: 'Role name extracted from role object' })
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
