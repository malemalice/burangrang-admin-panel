import { Exclude, Expose } from 'class-transformer';

export class SettingDto {
  @Expose()
  id: string;

  @Expose()
  key: string;

  @Expose()
  value: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<SettingDto>) {
    Object.assign(this, partial);
  }
}
