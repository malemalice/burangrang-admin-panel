import { GeneralStatusEnum } from '@prisma/client';

export const DEFAULT_ZOHO_STATUS_MAP: Record<string, string> = {
    [GeneralStatusEnum.DRAFT]: 'Open',
    [GeneralStatusEnum.OPEN]: 'On Hold',
    [GeneralStatusEnum.WAITING_APPROVAL]: 'On Hold',
    [GeneralStatusEnum.DONE]: 'Closed',
    [GeneralStatusEnum.CLOSE]: 'Closed',
    [GeneralStatusEnum.REJECTED]: 'Open',
};
