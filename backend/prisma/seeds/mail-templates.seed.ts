import { PrismaClient } from '@prisma/client';

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
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h2>Welcome to HSE System!</h2>
  <p>Hi {{default (lookup . "name") "there"}},</p>
  <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
  
  <a href="{{default (lookup . "verificationLink") ""}}" class="button">Verify Email Address</a>
  
  <p>If you did not create an account, no further action is required.</p>
  
  <p>If you're having trouble clicking the button, copy and paste the following link into your browser:</p>
  <p>{{default (lookup . "verificationLink") ""}}</p>
  
  <div class="footer">
    <p>This email was sent from HSE System. If you didn't expect this email, you can safely ignore it.</p>
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
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h2>Reset Your Password</h2>
  <p>Hello {{name}},</p>
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  
  <a href="{{resetUrl}}" class="button">Reset Password</a>
  
  <p>If you didn't request this password reset, you can safely ignore this email. The link will expire in 1 hour for security.</p>
  
  <div class="footer">
    <p>This is an automated email, please do not reply.</p>
  </div>
</body>
</html>`,
  },
  {
    code: 'team-invitation',
    name: 'Team Invitation',
    subjectTemplate: "You're invited to join {{default teamName \"our team\"}}",
    bodyTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Team Invitation</h2>
  
  <p>Hello,</p>
  
  <p>You have been invited to join the team by {{ inviterName }}.</p>
  
  {{#if isExistingUser}}
  <p>Please click the button below to accept or reject the invitation:</p>
  
  <p style="margin: 20px 0;">
    <a href="{{ acceptUrl }}" style="display: inline-block; padding: 10px 20px; margin: 10px 5px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
    <a href="{{ rejectUrl }}" style="display: inline-block; padding: 10px 20px; margin: 10px 5px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">Reject Invitation</a>
  </p>
  {{else}}
  <p>To join the team, you'll need to create an account first. Click the button below to sign up:</p>
  
  <p style="margin: 20px 0;">
    <a href="{{ signupUrl }}" style="display: inline-block; padding: 10px 20px; margin: 10px 5px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Sign Up & Join Team</a>
  </p>
  {{/if}}
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">This invitation will expire in 30 days.</p>
  
  <p style="color: #666; font-size: 14px;">Best regards,<br>HSE System Team</p>
</div>`,
  },
  {
    code: 'password-change',
    name: 'Password Change Notification',
    subjectTemplate: 'Your password was changed',
    bodyTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Password Change Notification</h2>
  
  <p>Hello {{name}},</p>
  
  <p>This email is to confirm that your password was successfully changed on {{date}}.</p>
  
  <p>If you did not make this change, please contact our support team immediately or reset your password using the link below:</p>
  
  <p style="margin: 20px 0;">
    <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Reset Password
    </a>
  </p>
  
  <p style="color: #666; font-size: 14px;">
    For security purposes, this change was made from IP: {{ipAddress}}
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    If you did make this change, you can safely ignore this email.
  </p>
</div>`,
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
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4CAF50;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .message {
      white-space: pre-wrap;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">{{title}}</h1>
  </div>
  <div class="content">
    <div class="message">{{message}}</div>
    {{#if context}}
    <p style="color: #666; font-size: 14px; margin-top: 20px;">
      <strong>Context:</strong> {{context}}
    </p>
    {{/if}}
    {{#if contextId}}
    <p style="color: #666; font-size: 14px;">
      <strong>Reference ID:</strong> {{contextId}}
    </p>
    {{/if}}
  </div>
  <div class="footer">
    <p>This is an automated notification from HSE Dashboard. Please do not reply to this email.</p>
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
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background-color: #2196F3;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }

        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }

        .course-info {
            background-color: white;
            padding: 15px;
            border-left: 4px solid #2196F3;
            margin: 20px 0;
        }

        .detail-row {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }

        .detail-label {
            font-weight: bold;
            color: #666;
            display: inline-block;
            width: 120px;
        }

        .button {
            display: inline-block;
            padding: 12px 24px;
            margin: 20px 0;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }

        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1 style="margin: 0;">Course Assignment</h1>
    </div>
    <div class="content">
        <p>Hello {{userName}},</p>

        <p>You have been assigned to a new training course:</p>

        <div class="course-info">
            <h2 style="margin-top: 0; color: #2196F3;">{{courseTitle}}</h2>

            {{#if dueDate}}
            <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span>{{dueDate}}</span>
            </div>
            {{/if}}

            {{#if isRequired}}
            <div class="detail-row">
                <span class="detail-label">Required:</span>
                <span style="color: #f44336; font-weight: bold;">{{isRequired}}</span>
            </div>
            {{/if}}

            {{#if notes}}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <span class="detail-label">Notes:</span>
                <p style="margin: 5px 0; white-space: pre-wrap;">{{notes}}</p>
            </div>
            {{/if}}
        </div>

        <p>Please log in to the HSE Dashboard to access your course and begin your training.</p>

        <p style="text-align: center;">
            <a href="{{default appUrl " http://localhost:8080"}}/enrollments/{{enrollmentId}}" class="button">
                View Course Details
            </a>
        </p>
    </div>
    <div class="footer">
        <p>This is an automated notification from HSE Dashboard. Please do not reply to this email.</p>
        <p>If you have any questions, please contact your administrator.</p>
    </div>
</body>

</html>`,
  },
  {
    code: 'user-created',
    name: 'User account created',
    subjectTemplate: 'Your HSE system account has been created',
    bodyTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Your HSE System account has been created</h2>

  <p>Hello {{name}},</p>

  <p>An HSE system user account has been created for you. You can log in using your email and the password that was set for you.</p>

  <p style="margin: 20px 0;">
    <a href="{{loginUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Log in</a>
  </p>

  <p style="color: #666; font-size: 14px;">Best regards,<br>HSE System Team</p>
</div>`,
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
