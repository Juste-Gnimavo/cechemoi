# SMSING.APP Integration Guide

## Overview
SMSING.APP is the primary SMS and WhatsApp provider for OTPX. It provides three routes sms, whatsapp plus a whatsapp cloud.

---

## 📋 Environment Variables

All SMSING credentials are configured in `.env` file:

### API Base URL
```bash
SMSING_API_URL=https://panel.smsing.app/smsAPI
```

```bash
SMSING_FROM=CaveExpress
### SMS + WhatsApp Shared Business
SMSING_SMS_WHATSAPP_BUSINESS_API_KEY=kPFZo3mT8xwiZ1OPBAiACEWWGm2dKqUC
SMSING_SMS_WHATSAPP_BUSINESS_API_TOKEN=1GKu1756165537

### WhatsApp Cloud + Approved templates use different api key and token
SMSING_WHATSAPP_CLOUD_API_KEY=oRB98eaWYeGCJxzb3BzTwQlCSN8e1c6M
SMSING_WHATSAPP_CLOUD_API_TOKEN=Z0wT1763917240
###  WhatsApp Cloud send OTP code. Replace text content by folowings with dynamic code. Above 2 different templates to use to verify users account registration, login :
### text=content:official_otp_code_template|lang=en|body=01234|button=01234 (01234 represents the otp code, lang=fr or en)
### content:cave_express|lang=fr||body=01234|header=image:https://cave-express.ci/wp-content/uploads/2025/11/logo.png (01234 represents the otp code)
```



---

## 🚀 Usage Examples

### Send SMS
```bash
curl -X GET "https://panel.smsing.app/smsAPI?sendsms&apikey=Epfom4Z2vuBFx6lMYTWWUOMpaDEK7881&apitoken=c1QY1763907288&type=sms&from=CaveExpress&to=2250709757296&text=Your%20OTP%20is%20123456"
```

### Send WhatsApp Business Message with logo, image, doc, etc. (it accepts any message)
```bash
curl -X GET "https://panel.smsing.app/smsAPI?sendsms&apikey=kPFZo3mT8xwiZ1OPBAiACEWWGm2dKqUC&apitoken=1GKu1756165537&type=whatsapp&from=CaveExpress&to=2250709757296&text=Your%20OTP%20is%201289&file=https://cave-express.ci/https://cave-express.ci/api/invoices/cmihus95d0007roqnct93dn9n/pdf"
```

### Send WhatsApp Cloud Message with OTP. Replace 01234 with your dynamic otp

```bash
curl -X GET "https://panel.smsing.app/smsAPI?sendsms&apikey=oRB98eaWYeGCJxzb3BzTwQlCSN8e1c6M&apitoken=Z0wT1763917240&type=whatsapp&from=CaveExpress&to=2250151092627&text=text=content:official_otp_code_template|lang=en|body=01234|button=01234"
```

```bash
curl -X GET "https://panel.smsing.app/smsAPI?sendsms&apikey=oRB98eaWYeGCJxzb3BzTwQlCSN8e1c6M&apitoken=Z0wT1763917240&type=whatsapp&from=CaveExpress&to=2250709757296&text=content:cave_express|lang=fr||body=01234|header=image:https://cave-express.ci/wp-content/uploads/2025/11/logo.png"
```


---



## 📊 Response Formats

### Success Response
```json
{
  "request": "sendsms",
  "status": "queued",
  "group_id": "1234",
  "date": "2024-11-04 06:13:11"
}
```

### Error Response
```json
{
  "request": "sendsms",
  "status": "error",
  "message": "Sender ID not allowed"
}
```


### Check Message Status
```bash
curl -X GET "https://panel.smsing.app/smsAPI?groupstatus&apikey=&apitoken=&groupid=1234"
```

### Status Check Response
```json
{
  "request": "groupstatus",
  "status": "success",
  "group_id": "1234",
  "group_status": "sent",
  "recipients": [
    {
      "id": "21",
      "to": "231235433",
      "status": "sent"
    }
  ],
  "date": "2024-11-04 06:13:11"
}
```



---

## ⚠️ Important Notes

### Rate Limits
- Not specified by provider
- Recommended: Track and throttle at application level
- Monitor for any 429 or rate limit errors

### Phone Number Format
- Use E.164 format without + sign
- Example: 2250709757296 (not +225 07 09 75 72 96)
- Strip all spaces and special characters

---


---

**Last Updated**: 2025-11-23
**Provider**: SMSING.APP (panel.smsing.app)
**Support**: Check provider dashboard for support options
