export interface SdpIdRef {
  id: string;
}

export interface SdpIdNameRef {
  id?: string;
  name?: string;
}

export interface SdpTimestampRef {
  value?: string;
  display_value?: string;
}

export interface SdpEmailRef {
  email_id: string;
}

export interface SdpRequestLinkRef {
  request: SdpIdRef;
  comments?: string;
}

export interface SdpResolution {
  content?: string;
  add_to_linked_requests?: boolean;
}

export interface SdpClosureInfo {
  closure_code?: SdpIdNameRef;
  requester_ack_resolution?: boolean;
  requester_ack_comments?: string;
  closure_comments?: string;
}

export interface SdpOnholdScheduler {
  scheduled_time?: SdpTimestampRef;
  comments?: string;
  change_to_status?: SdpIdNameRef;
}

export interface SdpUdfDateValue {
  display_value?: string;
  value?: string;
}

export type SdpUdfPrimitiveValue = string | number | boolean | null;

export type SdpUdfSingleValue =
  | SdpUdfPrimitiveValue
  | SdpIdNameRef
  | SdpUdfDateValue;

export type SdpUdfArrayValue = Array<SdpIdNameRef | SdpUdfPrimitiveValue>;

export type SdpUdfValue = SdpUdfSingleValue | SdpUdfArrayValue;

export interface SdpUdfFields {
  [key: string]: SdpUdfValue;
}

export interface SdpRequestPayload {
  subject?: string;
  description?: string;
  short_description?: string;
  request_type?: SdpIdNameRef;
  impact?: SdpIdNameRef;
  impact_details?: string;
  status?: SdpIdNameRef | string;
  mode?: SdpIdNameRef;
  level?: SdpIdNameRef;
  urgency?: SdpIdNameRef;
  priority?: SdpIdNameRef;
  service_category?: SdpIdNameRef;
  requester?: SdpIdNameRef | SdpEmailRef;
  site?: SdpIdNameRef;
  group?: SdpIdNameRef;
  technician?: SdpIdNameRef;
  category?: SdpIdNameRef;
  subcategory?: SdpIdNameRef;
  item?: SdpIdNameRef;
  on_behalf_of?: SdpIdNameRef;
  assets?: SdpIdNameRef[];
  service_approvers?: SdpIdNameRef[];
  template?: SdpIdNameRef;
  request_template_task_ids?: SdpIdRef[];
  editor?: SdpIdNameRef;
  email_ids_to_notify?: SdpEmailRef[];
  update_reason?: string;
  status_change_comments?: string;
  due_by_time?: SdpTimestampRef;
  first_response_due_by_time?: SdpTimestampRef;
  is_fcr?: boolean;
  attachments?: SdpIdRef[];
  udf_fields?: SdpUdfFields;
  resolution?: SdpResolution;
  closure_info?: SdpClosureInfo;
  onhold_scheduler?: SdpOnholdScheduler;
  linked_to_request?: SdpRequestLinkRef;
}

export type SdpWritableField = keyof SdpRequestPayload;

export const SDP_WRITABLE_FIELDS: readonly SdpWritableField[] = [
  'subject',
  'description',
  'short_description',
  'request_type',
  'impact',
  'impact_details',
  'status',
  'mode',
  'level',
  'urgency',
  'priority',
  'service_category',
  'requester',
  'site',
  'group',
  'technician',
  'category',
  'subcategory',
  'item',
  'on_behalf_of',
  'assets',
  'service_approvers',
  'template',
  'request_template_task_ids',
  'editor',
  'email_ids_to_notify',
  'update_reason',
  'status_change_comments',
  'due_by_time',
  'first_response_due_by_time',
  'is_fcr',
  'attachments',
  'udf_fields',
  'resolution',
  'closure_info',
  'onhold_scheduler',
  'linked_to_request',
] as const;
