# Email Configuration for Password Reset

The Snippet application supports sending password reset emails via SMTP. If email is not configured, password reset links will be logged to the console instead.

## Setup Instructions

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
3. **Update your `.env` file**:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM_NAME=Snippet
EMAIL_FROM=noreply@snippet.app
```

### Option 2: Other SMTP Providers

#### SendGrid
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM_NAME=Snippet
EMAIL_FROM=verified-sender@yourdomain.com
```

#### Mailgun
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASS=your-mailgun-password
EMAIL_FROM_NAME=Snippet
EMAIL_FROM=noreply@your-domain.com
```

#### AWS SES
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
EMAIL_FROM_NAME=Snippet
EMAIL_FROM=verified@yourdomain.com
```

## Configuration Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EMAIL_HOST` | SMTP server hostname | Yes (for email) |
| `EMAIL_PORT` | SMTP server port (usually 587 or 465) | Yes (for email) |
| `EMAIL_SECURE` | Use SSL/TLS (`true` for 465, `false` for 587) | Yes (for email) |
| `EMAIL_USER` | SMTP authentication username | Yes (for email) |
| `EMAIL_PASS` | SMTP authentication password | Yes (for email) |
| `EMAIL_FROM_NAME` | Display name for sender | No (defaults to "Snippet") |
| `EMAIL_FROM` | Email address shown as sender | No (defaults to EMAIL_USER) |
| `FRONTEND_URL` | Base URL of your frontend app | Yes |

## Testing

After configuration, test the email functionality:

1. Start the backend server
2. Navigate to the login page
3. Click "Forgot Password?"
4. Enter a valid email address
5. Check your email inbox for the password reset link

## Troubleshooting

### Emails not sending
- Check that all required environment variables are set
- Verify SMTP credentials are correct
- Check if your email provider requires app-specific passwords
- Look for error messages in the server console

### Emails going to spam
- Configure SPF/DKIM records for your domain
- Use a verified sender email address
- Consider using a dedicated email service (SendGrid, Mailgun, etc.)

### No email configuration
- Password reset links will be logged to the backend console
- Check the terminal where your backend server is running
- Copy the reset link and paste it into your browser

## Production Recommendations

For production environments:

1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES)
2. **Set up SPF and DKIM** records for your domain
3. **Use environment-specific configuration** (different settings for dev/staging/prod)
4. **Monitor email delivery** and bounce rates
5. **Set up email templates** with your branding
6. **Configure rate limiting** to prevent abuse

## Security Notes

- Never commit your `.env` file to version control
- Use app-specific passwords instead of your main account password
- Rotate email credentials regularly
- Monitor for unusual sending patterns
- Consider implementing rate limiting for password reset requests
