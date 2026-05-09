import { SetMetadata } from '@nestjs/common';

export const ALLOW_OPTIONS_BYPASS_KEY = 'allowOptionsBypass';
export const AllowOptionsBypass = () => SetMetadata(ALLOW_OPTIONS_BYPASS_KEY, true);
