export class PermissionDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PermissionDto>) {
    Object.assign(this, partial);
  }
} 