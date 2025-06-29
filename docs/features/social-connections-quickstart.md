# Social Media Connections - Quick Start

## 🚀 Getting Started

Now that you've added your OAuth credentials, here's how to connect your social media accounts:

### 1. Navigate to Social Media Hub
Go to `/social` in your app or click "Social Media" in the navigation.

### 2. Go to Accounts Tab
Click on the "Accounts" tab to see the connection interface.

### 3. Connect Your Accounts
For each platform you want to connect:
1. Click the "Connect Account" button on the platform card
2. You'll be redirected to the platform's OAuth page
3. Log in and authorize the app
4. You'll be redirected back to Inflio

### 4. Verify Connection
Once connected, you'll see:
- ✅ Green "Connected" badge
- Your profile picture and username
- "View Profile" button to check your account

## 🔧 Troubleshooting

### "Invalid client" error
- Double-check your client ID and secret in `.env.local`
- Make sure there are no extra spaces or quotes

### "Redirect URI mismatch" error
- Verify the callback URL matches exactly:
  - Development: `http://localhost:3000/api/auth/callback/[platform]`
  - Production: `https://yourdomain.com/api/auth/callback/[platform]`

### Connection fails silently
- Check browser console for errors
- Ensure NEXTAUTH_SECRET is set
- Try clearing cookies and reconnecting

## 📝 Test Your Configuration

Run the test script to verify your setup:

```bash
node scripts/test-oauth-config.js
```

This will check:
- ✅ All required environment variables
- ✅ NextAuth configuration
- ✅ Platform credentials

## 🎯 What's Next?

After connecting your accounts:

1. **Create Content**: Use the "Create Post" button to compose content
2. **Schedule Posts**: Choose when to publish across platforms
3. **Track Analytics**: Monitor engagement and performance
4. **Manage Multiple Accounts**: Connect multiple accounts per platform

## 🔐 Security Notes

- OAuth tokens are securely stored in your database
- Tokens are encrypted and never exposed to the client
- You can disconnect accounts at any time
- Refresh tokens are used for long-term access

## 📚 Additional Resources

- [Complete OAuth Setup Guide](./social-oauth-complete-guide.md)
- [Platform API Limits](../api/platform-limits.md)
- [Publishing Best Practices](./publishing-best-practices.md)

## 💡 Pro Tips

1. **Connect Multiple Accounts**: You can connect multiple accounts for the same platform (e.g., personal and business)
2. **Test with Drafts**: Create draft posts to test the flow before publishing
3. **Check Permissions**: Some platforms require app review for full publishing access
4. **Monitor Token Expiry**: The app will notify you when tokens need refreshing

---

Need help? Check the [complete setup guide](./social-oauth-complete-guide.md) or reach out to support. 