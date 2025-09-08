import { Exclude, Expose } from 'class-transformer';

export class SettingDto {
  id: string;
  key: string;
  value: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<SettingDto>) {
    Object.assign(this, partial);
  }
}
