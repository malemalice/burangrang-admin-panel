import { PrismaClient } from '@prisma/client';

/**
 * Email HTML uses inline hex aligned with BurangrangDesign (`frontend/src/core/lib/theme/colors.ts`).
 * Primary: indigo-500 #6366f1, indigo-600 #4f46e5 | Text: slate-800 #1e293b, slate-600 #475569, slate-500 #64748b
 * Border: slate-200 #e2e8f0 | Background: white #ffffff, slate-50 #f8fafc
 * Success: green-600 #16a34a | Info: blue-600 #2563eb | Warning: yellow-100 #fef9c3, yellow-800 #854d0e, header yellow-700 #a16207
 * Error: red-600 #dc2626
 */

const defaultMailTemplates = [
  {
    code: 'verification',
    name: 'Email Verification',
    subjectTemplate: 'Verify your email, {{default name ""}}',
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your email</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #16a34a;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #16a34a;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to HSSE System</h1>
  </div>
  <div class="content">
    <p>Hi {{default (lookup . "name") "there"}},</p>
    <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
    <p><a href="{{default (lookup . "verificationLink") ""}}" class="button">Verify Email Address</a></p>
    <p>If you did not create an account, no further action is required.</p>
    <p>If you're having trouble clicking the button, copy and paste the following link into your browser:</p>
    <p style="color: #475569; font-size: 14px; word-break: break-all;">{{default (lookup . "verificationLink") ""}}</p>
  </div>
  <div class="footer">
    <p>This email was sent from HSSE System. If you didn't expect this email, you can safely ignore it.</p>
  </div>
</body>
</html>`,
  },
  {
    code: 'password-reset',
    name: 'Password Reset',
    subjectTemplate: 'Password Reset Instructions',
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #6366f1;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reset Your Password</h1>
  </div>
  <div class="content">
    <p>Hello {{name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
    <p>If you didn't request this password reset, you can safely ignore this email. The link will expire in 1 hour for security.</p>
  </div>
  <div class="footer">
    <p>This is an automated email from HSSE System. Please do not reply.</p>
  </div>
</body>
</html>`,
  },
  {
    code: 'team-invitation',
    name: 'Team Invitation',
    subjectTemplate: "You're invited to join {{default teamName \"our team\"}}",
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Team Invitation</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      margin: 10px 8px 10px 0;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
    .btn-primary {
      background-color: #6366f1;
    }
    .btn-danger {
      background-color: #dc2626;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Team Invitation</h1>
  </div>
  <div class="content">
    <p>Hello,</p>
    <p>You have been invited to join the team by {{ inviterName }}.</p>
    {{#if isExistingUser}}
    <p>Please click the button below to accept or reject the invitation:</p>
    <p>
      <a href="{{ acceptUrl }}" class="btn btn-primary">Accept Invitation</a>
      <a href="{{ rejectUrl }}" class="btn btn-danger">Reject Invitation</a>
    </p>
    {{else}}
    <p>To join the team, you'll need to create an account first. Click the button below to sign up:</p>
    <p>
      <a href="{{ signupUrl }}" class="btn btn-primary">Sign Up &amp; Join Team</a>
    </p>
    {{/if}}
    <p style="color: #475569; font-size: 14px; margin-top: 24px;">This invitation will expire in 30 days.</p>
    <p style="color: #475569; font-size: 14px;">Best regards,<br />HSSE System Team</p>
  </div>
  <div class="footer">
    <p>This is an automated message from HSSE System.</p>
  </div>
</body>
</html>`,
  },
  {
    code: 'password-change',
    name: 'Password Change Notification',
    subjectTemplate: 'Your password was changed',
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Change Notification</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #6366f1;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Change Notification</h1>
  </div>
  <div class="content">
    <p>Hello {{name}},</p>
    <p>This email is to confirm that your password was successfully changed on {{date}}.</p>
    <p>If you did not make this change, please contact our support team immediately or reset your password using the link below:</p>
    <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
    <p style="color: #475569; font-size: 14px;">For security purposes, this change was made from IP: {{ipAddress}}</p>
    <p style="color: #475569; font-size: 14px; margin-top: 24px;">If you did make this change, you can safely ignore this email.</p>
  </div>
  <div class="footer">
    <p>This is an automated email from HSSE System. Please do not reply.</p>
  </div>
</body>
</html>`,
  },
  {
    code: 'notification',
    name: 'Notification',
    subjectTemplate: '{{title}}',
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{title}}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #f8fafc;
      padding: 24px;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .message {
      white-space: pre-wrap;
      margin: 20px 0;
      color: #1e293b;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{title}}</h1>
  </div>
  <div class="content">
    <div class="message">{{message}}</div>
    {{#if context}}
    <p style="color: #475569; font-size: 14px; margin-top: 20px;">
      <strong>Context:</strong> {{context}}
    </p>
    {{/if}}
    {{#if contextId}}
    <p style="color: #475569; font-size: 14px;">
      <strong>Reference ID:</strong> {{contextId}}
    </p>
    {{/if}}
  </div>
  <div class="footer">
    <p>This is an automated notification from HSSE Dashboard. Please do not reply to this email.</p>
  </div>
</body>
</html>
`,
  },
  {
    code: 'course-assignment',
    name: 'Course Assignment',
    subjectTemplate: 'New Course Assignment: {{courseTitle}}',
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Course Assignment Notification</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }
    .course-info {
      background-color: #ffffff;
      padding: 16px;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #2563eb;
    }
    .detail-row {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-label {
      font-weight: 600;
      color: #475569;
      display: inline-block;
      width: 120px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      margin: 20px 0;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Course Assignment</h1>
  </div>
  <div class="content">
    <p>Hello {{userName}},</p>
    <p>You have been assigned to a new training course:</p>
    <div class="course-info">
      <h2 style="margin-top: 0; color: #2563eb; font-size: 20px; font-weight: 600;">{{courseTitle}}</h2>
      {{#if dueDate}}
      <div class="detail-row">
        <span class="detail-label">Due Date:</span>
        <span>{{dueDate}}</span>
      </div>
      {{/if}}
      {{#if isRequired}}
      <div class="detail-row">
        <span class="detail-label">Required:</span>
        <span style="color: #dc2626; font-weight: 600;">{{isRequired}}</span>
      </div>
      {{/if}}
      {{#if notes}}
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
        <span class="detail-label">Notes:</span>
        <p style="margin: 5px 0; white-space: pre-wrap; color: #1e293b;">{{notes}}</p>
      </div>
      {{/if}}
    </div>
    <p>Please log in to the HSSE Dashboard to access your course and begin your training.</p>
    <p style="text-align: center;">
      <a href="{{default appUrl "http://localhost:8080"}}/enrollments/{{enrollmentId}}" class="button">View Course Details</a>
    </p>
  </div>
  <div class="footer">
    <p>This is an automated notification from HSSE Dashboard. Please do not reply to this email.</p>
    <p>If you have any questions, please contact your administrator.</p>
  </div>
</body>
</html>`,
  },
  {
    code: 'user-created',
    name: 'User account created',
    subjectTemplate: 'Your HSSE system account has been created',
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your account has been created</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #6366f1;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your HSSE System account has been created</h1>
  </div>
  <div class="content">
    <p>Hello {{name}},</p>
    <p>An HSSE System user account has been created for you. You can log in using your email and the password that was set for you.</p>
    <p><a href="{{loginUrl}}" class="button">Log in</a></p>
    <p style="color: #475569; font-size: 14px;">Best regards,<br />HSSE System Team</p>
  </div>
  <div class="footer">
    <p>This is an automated message from HSSE System.</p>
  </div>
</body>
</html>`,
  },
  {
    code: 'certificate-expiry-department',
    name: 'Certificate Expiry Department Notification',
    subjectTemplate: 'Certificate Expiry Notice: {{certificateName}}',
    bodyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate Expiry Notice</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #a16207;
      color: #ffffff;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .info-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-table td:first-child {
      font-weight: 600;
      color: #475569;
      width: 40%;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background-color: #fef9c3;
      color: #854d0e;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Certificate Expiry Notice</h2>
  </div>
  <div class="content">
    <p>Dear <strong>{{departmentName}}</strong> Department,</p>
    <p>
      This is an automated notification to inform you that the following certificate
      is approaching its expiry date. Please take the necessary action to ensure
      compliance and continuity.
    </p>
    <table class="info-table">
      <tr>
        <td>Certificate Name</td>
        <td><strong>{{certificateName}}</strong></td>
      </tr>
      <tr>
        <td>Category</td>
        <td>{{categoryName}}</td>
      </tr>
      <tr>
        <td>Expiry Date</td>
        <td><strong>{{expiryDate}}</strong></td>
      </tr>
      <tr>
        <td>Reminder Type</td>
        <td><span class="badge">{{reminderType}}</span></td>
      </tr>
    </table>
    <p>
      Please log in to the HSSE Dashboard to review and initiate the renewal process
      if required.
    </p>
    <p>Best regards,<br />HSSE System</p>
  </div>
  <div class="footer">
    This is an automated message. Please do not reply directly to this email.
  </div>
</body>
</html>`,
  },
];

export async function seedMailTemplates(prisma: PrismaClient): Promise<void> {
  const client = prisma as unknown as {
    emailTemplate: {
      upsert: (args: any) => Promise<any>;
    };
  };

  for (const tpl of defaultMailTemplates) {
    await client.emailTemplate.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        subjectTemplate: tpl.subjectTemplate,
        bodyTemplate: tpl.bodyTemplate,
        isActive: true,
      },
      create: {
        code: tpl.code,
        name: tpl.name,
        subjectTemplate: tpl.subjectTemplate,
        bodyTemplate: tpl.bodyTemplate,
        isActive: true,
      },
    });
  }
}
