import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SettingsService } from '../../settings/settings.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';

type ZohoWebhookAuthMode = 'secret' | 'jwt' | 'signature';

const ZOHO_DEFAULT_SETTINGS: Array<{ key: string; value: string }> = [
    { key: SETTINGS_KEYS.ZOHO_SYNC_ENABLED, value: 'true' },
    { key: SETTINGS_KEYS.ZOHO_WEBHOOK_ENABLED, value: 'true' },
    { key: SETTINGS_KEYS.ZOHO_WEBHOOK_AUTH_MODE, value: 'secret' },
    { key: SETTINGS_KEYS.ZOHO_WEBHOOK_SECRET, value: '' },
    { key: SETTINGS_KEYS.ZOHO_WEBHOOK_JWT, value: '' },
    { key: SETTINGS_KEYS.SDP_BASE_URL, value: 'https://servicedesk.hapfor.com' },
    { key: SETTINGS_KEYS.SDP_AUTHTOKEN, value: '' },
    { key: SETTINGS_KEYS.SDP_API_VERSION, value: 'v3' },
    { key: SETTINGS_KEYS.SDP_ALLOW_SELF_SIGNED, value: 'false' },
    { key: SETTINGS_KEYS.ZOHO_DEFAULT_DEPARTMENT_ID, value: '' },
    { key: SETTINGS_KEYS.ZOHO_INTEGRATION_USER_ID, value: '' },
    { key: SETTINGS_KEYS.ZOHO_INBOUND_DEFAULT_STATUS, value: 'OPEN' },
    {
        key: SETTINGS_KEYS.ZOHO_INBOUND_STATUS_MAP,
        value:
            '{"Open":"OPEN","Assigned":"OPEN","In Progress":"WAITING_APPROVAL","Onhold":"WAITING_APPROVAL","Resolved":"DONE","Closed":"CLOSE","Cancelled":"REJECTED"}',
    },
    {
        key: SETTINGS_KEYS.ZOHO_STATUS_MAP,
        value:
            '{"DRAFT":"Open","OPEN":"On Hold","WAITING_APPROVAL":"On Hold","DONE":"Closed","CLOSE":"Closed","REJECTED":"Open"}',
    },
    { key: SETTINGS_KEYS.ZOHO_MAX_RETRIES, value: '6' },
    { key: SETTINGS_KEYS.ZOHO_RETRY_BASE_MS, value: '2000' },
    { key: SETTINGS_KEYS.ZOHO_RETRY_MAX_MS, value: '60000' },
    { key: SETTINGS_KEYS.ZOHO_WORKER_BATCH_SIZE, value: '5' },
];

const SENSITIVE_SETTING_KEYS = new Set<string>([
    SETTINGS_KEYS.ZOHO_WEBHOOK_SECRET,
    SETTINGS_KEYS.ZOHO_WEBHOOK_JWT,
    SETTINGS_KEYS.SDP_AUTHTOKEN,
]);

@Injectable()
export class ZohoConfigService implements OnModuleInit {
    private readonly logger = new Logger(ZohoConfigService.name);

    constructor(private readonly settingsService: SettingsService) { }

    async onModuleInit(): Promise<void> {
        for (const setting of ZOHO_DEFAULT_SETTINGS) {
            const existing = await this.settingsService.findByKey(setting.key);
            if (existing) {
                continue;
            }

            await this.settingsService.create({
                key: setting.key,
                value: setting.value,
                isActive: true,
            });

            this.logger.log(
                `Created missing Zoho setting key=${setting.key} value=${this.maskIfSensitive(setting.key, setting.value)}`,
            );
        }
    }

    async getString(key: string, defaultValue = ''): Promise<string> {
        const value = await this.getRawValue(key);
        return value ?? defaultValue;
    }

    async getRequiredString(key: string, errorMessage: string): Promise<string> {
        const value = await this.getRawValue(key);
        if (!value) {
            throw new Error(errorMessage);
        }

        return value;
    }

    async getBoolean(key: string, defaultValue: boolean): Promise<boolean> {
        const value = await this.getRawValue(key);
        if (value === undefined) {
            return defaultValue;
        }

        return value.toLowerCase() === 'true' || value === '1';
    }

    async getNumber(key: string, defaultValue: number): Promise<number> {
        const value = await this.getRawValue(key);
        if (value === undefined) {
            return defaultValue;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : defaultValue;
    }

    async getJsonRecord(
        key: string,
        defaultValue: Record<string, string>,
    ): Promise<Record<string, string>> {
        const value = await this.getRawValue(key);
        if (!value) {
            return defaultValue;
        }

        try {
            const parsed = JSON.parse(value) as Record<string, unknown>;
            const normalizedEntries = Object.entries(parsed).filter(
                ([entryKey, entryValue]) =>
                    typeof entryKey === 'string' && typeof entryValue === 'string',
            ) as Array<[string, string]>;
            return Object.fromEntries(normalizedEntries);
        } catch {
            return defaultValue;
        }
    }

    async getWebhookAuthMode(): Promise<ZohoWebhookAuthMode> {
        const value = await this.getString(
            SETTINGS_KEYS.ZOHO_WEBHOOK_AUTH_MODE,
            'secret',
        );
        const normalized = value.toLowerCase();

        if (
            normalized === 'jwt' ||
            normalized === 'signature' ||
            normalized === 'secret'
        ) {
            return normalized;
        }

        return 'secret';
    }

    private async getRawValue(key: string): Promise<string | undefined> {
        const setting = await this.settingsService.findByKey(key);

        if (!setting || !setting.isActive) {
            return undefined;
        }

        const normalized = setting.value?.trim();
        if (!normalized) {
            return undefined;
        }

        return normalized;
    }

    private maskIfSensitive(key: string, value: string): string {
        if (!SENSITIVE_SETTING_KEYS.has(key)) {
            return value;
        }

        return value.length > 0 ? '[REDACTED]' : '[EMPTY]';
    }
}
