import { GeneralStatusEnum } from '@prisma/client';

export const DEFAULT_ZOHO_INBOUND_STATUS_MAP: Record<string, GeneralStatusEnum> = {
    Open: GeneralStatusEnum.OPEN,
    Assigned: GeneralStatusEnum.OPEN,
    'In Progress': GeneralStatusEnum.WAITING_APPROVAL,
    Onhold: GeneralStatusEnum.WAITING_APPROVAL,
    Resolved: GeneralStatusEnum.DONE,
    Closed: GeneralStatusEnum.CLOSE,
    Cancelled: GeneralStatusEnum.REJECTED,
};
