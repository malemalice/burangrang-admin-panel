/**
 * Settings key constants for consistent comparison.
 */
export const SETTINGS_KEYS = {
  THEME_COLOR: 'theme.color',
  THEME_MODE: 'theme.mode',
  APP_NAME: 'app.name',
  ZOHO_SYNC_ENABLED: 'zoho.sync.enabled',
  ZOHO_WEBHOOK_ENABLED: 'zoho.webhook.enabled',
  ZOHO_WEBHOOK_AUTH_MODE: 'zoho.webhook.auth_mode',
  ZOHO_WEBHOOK_SECRET: 'zoho.webhook.secret',
  ZOHO_WEBHOOK_JWT: 'zoho.webhook.jwt',
  SDP_BASE_URL: 'zoho.sdp.base_url',
  SDP_AUTHTOKEN: 'zoho.sdp.authtoken',
  SDP_API_VERSION: 'zoho.sdp.api_version',
  SDP_ALLOW_SELF_SIGNED: 'zoho.sdp.allow_self_signed',
  ZOHO_DEFAULT_DEPARTMENT_ID: 'zoho.inbound.default_department_id',
  ZOHO_INTEGRATION_USER_ID: 'zoho.inbound.integration_user_id',
  ZOHO_INBOUND_DEFAULT_STATUS: 'zoho.inbound.default_status',
  ZOHO_INBOUND_STATUS_MAP: 'zoho.inbound.status_map',
  ZOHO_STATUS_MAP: 'zoho.outbound.status_map',
  ZOHO_MAX_RETRIES: 'zoho.retry.max_retries',
  ZOHO_RETRY_BASE_MS: 'zoho.retry.base_ms',
  ZOHO_RETRY_MAX_MS: 'zoho.retry.max_ms',
  ZOHO_WORKER_BATCH_SIZE: 'zoho.worker.batch_size',

  // Environmental measurements (regulatory limits)
  ENV_MEAS_LIMIT_LIGHTING: 'environmental_measurements.regulatory_limit.lighting',
  ENV_MEAS_LIMIT_NOISE: 'environmental_measurements.regulatory_limit.noise',
  ENV_MEAS_LIMIT_HUMIDITY: 'environmental_measurements.regulatory_limit.humidity',
  ENV_MEAS_LIMIT_TEMPERATURE: 'environmental_measurements.regulatory_limit.temperature',
} as const;
