/**
 * Settings key constants for consistent comparison.
 */
export const SETTINGS_KEYS = {
  THEME_COLOR: 'theme.color',
  THEME_MODE: 'theme.mode',
  APP_NAME: 'app.name',
  APP_LOGIN_TAGLINE: 'app.login.tagline',
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
  ZOHO_DEFAULT_AREA_ID: 'zoho.inbound.default_area_id',
  ZOHO_DEFAULT_INCIDENT_TYPE: 'zoho.inbound.default_incident_type',
  ZOHO_DEFAULT_INCIDENT_CLASSIFICATION: 'zoho.inbound.default_incident_classification',
  ZOHO_DEFAULT_RISK_CATEGORY_ID: 'zoho.inbound.default_risk_category_id',
  ZOHO_STATUS_MAP: 'zoho.outbound.status_map',
  // Incident field maps (Zoho value -> HSE value); shared by inbound/outbound flows
  ZOHO_INCIDENT_AREA_MAP: 'zoho.incident.area_map',
  ZOHO_INCIDENT_RISK_CATEGORY_MAP: 'zoho.incident.risk_category_map',
  ZOHO_INCIDENT_INCIDENT_TYPE_MAP: 'zoho.incident.incident_type_map',
  ZOHO_INCIDENT_INCIDENT_CLASSIFICATION_MAP:
    'zoho.incident.incident_classification_map',
  ZOHO_MAX_RETRIES: 'zoho.retry.max_retries',
  ZOHO_RETRY_BASE_MS: 'zoho.retry.base_ms',
  ZOHO_RETRY_MAX_MS: 'zoho.retry.max_ms',
  ZOHO_WORKER_BATCH_SIZE: 'zoho.worker.batch_size',

  // Environmental measurements (regulatory limits)
  ENV_MEAS_LIMIT_LIGHTING: 'environmental_measurements.regulatory_limit.lighting',
  ENV_MEAS_LIMIT_NOISE: 'environmental_measurements.regulatory_limit.noise',
  ENV_MEAS_LIMIT_HUMIDITY: 'environmental_measurements.regulatory_limit.humidity',
  ENV_MEAS_LIMIT_TEMPERATURE: 'environmental_measurements.regulatory_limit.temperature',

  /** When true, show work classification safety guideline editor + attachments and related work permit UI. */
  FEATURE_WORK_PERMIT_CLASSIFICATION_CONTENT: 'feature.work_permit_classification_content.enabled',
} as const;
