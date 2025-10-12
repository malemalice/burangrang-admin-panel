# Example qris endpoint
curl --location 'https://api.xendit.co/qr_codes' \
--header 'api-version: 2022-07-31' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic eG5kX2RldmVsb3BtZW50X05rdkhpVmRWc1dSc2NKWWxDZ1JLTGx1SHBFMHlUWWxRcU5Mc2I1QlE0ejhRTW9TOFNQbEZHZjZXM2VzZDRqOg==' \
--data '{
   "reference_id": "order-id-1760269720",
   "type": "DYNAMIC",
   "currency": "IDR",
   "amount": 10000,
   "expires_at": "2025-10-23T09:56:43.60445Z"
}
'
this was sample response:

{
    "reference_id": "order-id-1760269597",
    "type": "DYNAMIC",
    "currency": "IDR",
    "channel_code": "ID_XENDIT",
    "amount": 10000,
    "expires_at": "2025-10-23T09:56:43.60445Z",
    "metadata": null,
    "business_id": "670484e3e91755a865dfad36",
    "id": "qr_f3ddb912-cb6f-4a9b-b556-653889eaceaa",
    "created": "2025-10-12T11:46:37.917899Z",
    "updated": "2025-10-12T11:46:37.917899Z",
    "qr_string": "some-random-qr-string",
    "status": "ACTIVE"
}

then this was example of getting qrcodes

curl --location 'https://api.xendit.co/qr_codes/qr_efa7b052-a22c-4094-be3e-56ecf0d609f3' \
--header 'api-version: 2022-07-31' \
--header 'Authorization: Basic eG5kX2RldmVsb3BtZW50X05rdkhpVmRWc1dSc2NKWWxDZ1JLTGx1SHBFMHlUWWxRcU5Mc2I1QlE0ejhRTW9TOFNQbEZHZjZXM2VzZDRqOg==' \
--data ''


## simulate qris payment
https://api.xendit.co/qr_codes/order-id-1666420204/payments/simulate

{"id": "qr_2af87464-7e69-404c-b309-7368f1fcfecd", "type": "DYNAMIC", "amount": 300, "status": "ACTIVE", "created": "2025-10-12T13:10:07.580619Z", "updated": "2025-10-12T13:10:07.580619Z", "currency": "IDR", "metadata": {"orderId": "0c16006f-9b58-4037-9e8f-363c2125e143"}, "qr_string": "some-random-qr-string", "expires_at": "2025-10-13T13:10:07.158Z", "business_id": "670484e3e91755a865dfad36", "channel_code": "ID_XENDIT", "reference_id": "ORD-1760274607146-KP2C1CRWN"}

## webhook request
https://webhook.site/cb8c10d0-9f08-4bd0-9901-1ef85a19521d
HMAC SHA256 signature for webhook verification


header
host	webhook.site
accept-encoding	gzip, compress, deflate, br
content-length	808
user-agent	axios/1.10.0
api-version	2022-07-31
x-callback-token	vfK3DCEw8xLaimbplAaq5Wx7x7tKghuYR93AeaY8jmlDwYvI
webhook-id	2b627071-4d72-43c9-9ebb-5ebc34e4f830
content-type	application/json
accept	application/json, text/plain, */*


{"event":"qr.payment","created":"2020-01-08T18:18:18.857Z","business_id":"59e0daf7049b567510c63f67","data":{"id":"qrpy_8182837te-87st-49ing-8696-1239bd4d759c","business_id":"62dd802cc1a7bb74407bfce9","currency":"IDR","amount":1500,"status":"SUCCEEDED","created":"2020-01-08T18:18:18.857Z","qr_id":"qr_8182837te-87st-49ing-8696-1239bd4d759c","qr_string":"0002010102##########CO.XENDIT.WWW011893600#######14220002152#####414220010303TTT####015CO.XENDIT.WWW02180000000000000000000TTT52045######ID5911XenditQRIS6007Jakarta6105121606##########3k1mOnF73h11111111#3k1mOnF73h6v53033605401163040BDB","reference_id":"testing_id_123","type":"DYNAMIC","channel_code":"ID_DANA","expires_at":"2020-01-08T18:48:18.857Z","metadata":{"branch_code":"senayan_372"},"payment_detail":{"receipt_id":"000111666","source":"GOPAY"}}}