import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  CreateWaterQualityParameterDto,
  WaterQualityParameterCategoryEnum,
} from './create-water-quality-parameter.dto';

const createValidPayload = () => ({
  name: 'pH',
  code: 'PH',
  category: WaterQualityParameterCategoryEnum.CHEMISTRY,
  unit: 'pH',
  dateSampleTaken: '2026-04-03T00:00:00.000Z',
});

describe('CreateWaterQualityParameterDto', () => {
  it('accepts a valid ISO date string for dateSampleTaken', async () => {
    const dto = plainToInstance(
      CreateWaterQualityParameterDto,
      createValidPayload(),
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO date string for dateSampleTaken', async () => {
    const dto = plainToInstance(CreateWaterQualityParameterDto, {
      ...createValidPayload(),
      dateSampleTaken: '04/03/2026',
    });

    const errors = await validate(dto);
    const dateSampleTakenError = errors.find(
      (error) => error.property === 'dateSampleTaken',
    );

    expect(dateSampleTakenError?.constraints?.isDateString).toBeDefined();
  });
});
