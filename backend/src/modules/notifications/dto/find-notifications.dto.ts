import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { FindAllQueryDto } from '../../../shared/types/pagination-params';

export class FindNotificationsDto extends FindAllQueryDto {
  @ApiProperty({
    description: 'Filter by read status (true = read, false = unread)',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(
    ({
      value,
      key,
      obj,
    }: {
      value: unknown;
      key: string;
      obj: Record<string, unknown>;
    }) => {
      // Get raw value from query object before any conversion
      const rawValue = obj[key];

      // Handle string values from query parameters
      if (typeof rawValue === 'string') {
        if (rawValue.toLowerCase() === 'true') return true;
        if (rawValue.toLowerCase() === 'false') return false;
      }

      // Handle boolean values (already converted)
      if (typeof rawValue === 'boolean') {
        return rawValue;
      }

      // Handle string value parameter
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return false;

      return value;
    },
  )
  @IsBoolean()
  declare isRead?: boolean;
}
