/**
 * Xendit Payment Integration Types
 * Based on Xendit API v2024-09-30
 */

export interface XenditInvoiceRequest {
  external_id: string; // Order number
  amount: number;
  payer_email: string;
  description: string;
  invoice_duration?: number; // In seconds, default 24 hours
  currency?: string; // IDR, PHP, THB, VND, MYR
  payment_methods?: string[]; // Specific payment methods to enable
  success_redirect_url?: string;
  failure_redirect_url?: string;
  customer?: {
    given_names?: string;
    surname?: string;
    email?: string;
    mobile_number?: string;
    addresses?: Array<{
      city?: string;
      country?: string;
      postal_code?: string;
      state?: string;
      street_line1?: string;
      street_line2?: string;
    }>;
  };
  customer_notification_preference?: {
    invoice_created?: string[];
    invoice_reminder?: string[];
    invoice_paid?: string[];
    invoice_expired?: string[];
  };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
    url?: string;
  }>;
  fees?: Array<{
    type: string;
    value: number;
  }>;
  metadata?: Record<string, any>;
}

export interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  user_id: string;
  status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED';
  merchant_name: string;
  merchant_profile_picture_url: string;
  amount: number;
  payer_email: string;
  description: string;
  expiry_date: string;
  invoice_url: string;
  available_banks: Array<{
    bank_code: string;
    collection_type: string;
    transfer_amount: number;
    bank_branch: string;
    account_holder_name: string;
    identity_amount: number;
  }>;
  available_retail_outlets: Array<{
    retail_outlet_name: string;
    payment_code: string;
    transfer_amount: number;
  }>;
  available_ewallets: Array<{
    ewallet_type: string;
  }>;
  available_qr_codes: Array<{
    qr_code_type: string;
  }>;
  available_direct_debits: Array<{
    direct_debit_type: string;
  }>;
  available_paylaters: Array<{
    paylater_type: string;
  }>;
  should_exclude_credit_card: boolean;
  should_send_email: boolean;
  created: string;
  updated: string;
  currency: string;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
  payment_destination?: string;
  metadata?: Record<string, any>;
}

export interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id: string;
  status: 'PAID' | 'EXPIRED' | 'PENDING';
  paid_amount?: number;
  paid_at?: string;
  payment_channel?: string;
  payment_method?: string;
  payment_id?: string;
  amount: number;
  created: string;
  updated: string;
  currency: string;
  metadata?: Record<string, any>;
}

export interface XenditPaymentChannel {
  code: string;
  name: string;
  type: 'CREDIT_CARD' | 'E_WALLET' | 'VIRTUAL_ACCOUNT' | 'RETAIL_OUTLET' | 'QR_CODE';
  isPopular?: boolean;
  fee?: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface XenditError {
  error_code: string;
  message: string;
}

/**
 * QRIS QR Code API Types
 * Xendit QR Codes API - https://developers.xendit.co/api-reference/#qr-codes
 */
export interface XenditQRCodeRequest {
  reference_id: string; // Order number or unique reference
  type: 'DYNAMIC' | 'STATIC';
  currency: string; // IDR
  amount: number;
  expires_at?: string; // ISO 8601 format
  metadata?: Record<string, any>;
}

export interface XenditQRCodeResponse {
  id: string; // e.g., "qr_f3ddb912-cb6f-4a9b-b556-653889eaceaa"
  reference_id: string;
  type: 'DYNAMIC' | 'STATIC';
  currency: string;
  channel_code: string; // e.g., "ID_XENDIT"
  amount: number;
  expires_at: string;
  metadata: Record<string, any> | null;
  business_id: string;
  created: string;
  updated: string;
  qr_string: string; // The QR code string to generate QR image
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}

/**
 * QRIS QR Code Webhook Payload
 * Webhook sent when QR code is paid
 * Based on actual Xendit webhook structure (2022-07-31 API version)
 */
export interface XenditQRCodeWebhookPayload {
  created: string;
  business_id: string;
  event: 'qr.payment';
  data: {
    id: string; // Payment ID (qrpy_xxx)
    type: 'DYNAMIC' | 'STATIC';
    qr_id: string; // QR code ID (qr_xxx)
    amount: number;
    status: 'SUCCEEDED' | 'FAILED';
    created: string;
    currency: string;
    metadata?: Record<string, any>;
    qr_string: string;
    expires_at: string;
    business_id: string;
    channel_code: string;
    reference_id: string; // Order number
    payment_detail: {
      name: string | null;
      source: string; // e.g., "DANA", "GOPAY", "OVO"
      receipt_id: string | null;
      customer_pan: string | null;
      merchant_pan: string | null;
      account_details: any | null;
    };
  };
  api_version: string;
}

export const XENDIT_PAYMENT_CHANNELS: XenditPaymentChannel[] = [
  { code: 'CREDIT_CARD', name: 'Credit Card', type: 'CREDIT_CARD', isPopular: true },
  { code: 'OVO', name: 'OVO', type: 'E_WALLET', isPopular: true },
  { code: 'DANA', name: 'DANA', type: 'E_WALLET', isPopular: true },
  { code: 'LINKAJA', name: 'LinkAja', type: 'E_WALLET' },
  { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'E_WALLET', isPopular: true },
  { code: 'BCA', name: 'BCA Virtual Account', type: 'VIRTUAL_ACCOUNT', isPopular: true, fee: 4000 },
  { code: 'BNI', name: 'BNI Virtual Account', type: 'VIRTUAL_ACCOUNT', fee: 4000 },
  { code: 'BRI', name: 'BRI Virtual Account', type: 'VIRTUAL_ACCOUNT', fee: 4000 },
  { code: 'MANDIRI', name: 'Mandiri Virtual Account', type: 'VIRTUAL_ACCOUNT', fee: 4000 },
  { code: 'PERMATA', name: 'Permata Virtual Account', type: 'VIRTUAL_ACCOUNT', fee: 4000 },
  { code: 'QRIS', name: 'QRIS', type: 'QR_CODE', isPopular: true },
  { code: 'ALFAMART', name: 'Alfamart', type: 'RETAIL_OUTLET', fee: 5000 },
  { code: 'INDOMARET', name: 'Indomaret', type: 'RETAIL_OUTLET', fee: 5000 },
];

