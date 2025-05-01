import { Exclude } from 'class-transformer';

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

  @Exclude()
  password: string;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
} 