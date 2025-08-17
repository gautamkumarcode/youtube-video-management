import { google } from 'googleapis';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? 'Found' : 'Not found');
console.log('CLIENT_SECRET:', process.env.YOUTUBE_CLIENT_SECRET ? 'Found' : 'Not found');
console.log('API_KEY:', process.env.YOUTUBE_API_KEY ? 'Found' : 'Not found');
console.log('Current working directory:', process.cwd());
console.log('');

const app = express();

// You need to replace these with your actual credentials from Google Cloud Console
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || 'your_client_id_here';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || 'your_client_secret_here';
const REDIRECT_URI = 'http://localhost:5000/auth/youtube/callback';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Required scopes for YouTube management
const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl'
];

// Step 1: Start the authorization process
app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // This ensures we get a refresh token
        scope: scopes,
        prompt: 'consent' // This forces showing consent screen to get refresh token
    });

    console.log('\n=== AUTHORIZATION STEP ===');
    console.log('Visit this URL to authorize the application:');
    console.log(authUrl);
    console.log('\n');

    res.send(`
    <h2>YouTube API Authorization</h2>
    <p>Click the link below to authorize this application:</p>
    <a href="${authUrl}" target="_blank" style="
      display: inline-block;
      padding: 10px 20px;
      background: #ff0000;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    ">Authorize YouTube Access</a>
    <p>After authorization, you'll be redirected back to get your tokens.</p>
  `);
});

// Step 2: Handle the callback and exchange code for tokens
app.get('/auth/youtube/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.send('<h2>Error: No authorization code received</h2>');
    }

    try {
        const { tokens } = await oauth2Client.getAccessToken(code);

        console.log('\n=== SUCCESS! COPY THESE TOKENS TO YOUR .env FILE ===');
        console.log(`YOUTUBE_ACCESS_TOKEN=${tokens.access_token}`);
        if (tokens.refresh_token) {
            console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
            console.log('YOUTUBE_REFRESH_TOKEN=<not provided - you may need to revoke and re-authorize>');
        }
        console.log('=================================================\n');

        // Test the tokens by making a simple API call
        oauth2Client.setCredentials(tokens);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        try {
            const channelResponse = await youtube.channels.list({
                part: ['snippet'],
                mine: true
            });

            const channelName = channelResponse.data.items?.[0]?.snippet?.title || 'Unknown';

            res.send(`
        <h2>✅ Authorization Successful!</h2>
        <p><strong>Channel:</strong> ${channelName}</p>
        <h3>Add these to your .env file:</h3>
        <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
YOUTUBE_ACCESS_TOKEN=${tokens.access_token}
YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token || 'not_provided'}
        </pre>
        <p><strong>Access Token:</strong> Used for API calls (expires in 1 hour)</p>
        <p><strong>Refresh Token:</strong> Used to get new access tokens (doesn't expire)</p>
        ${!tokens.refresh_token ? '<p style="color: red;"><strong>Note:</strong> No refresh token received. You may need to revoke access and try again.</p>' : ''}
        <p>Check your terminal for the same information.</p>
        <p>You can now close this window and stop the server (Ctrl+C).</p>
      `);
        } catch (apiError) {
            console.error('API test failed:', apiError.message);
            res.send(`
        <h2>⚠️ Tokens received but API test failed</h2>
        <p>You got the tokens, but there was an issue testing them:</p>
        <p><strong>Error:</strong> ${apiError.message}</p>
        <h3>Your tokens:</h3>
        <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
YOUTUBE_ACCESS_TOKEN=${tokens.access_token}
YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token || 'not_provided'}
        </pre>
      `);
        }

    } catch (error) {
        console.error('Error getting tokens:', error);
        res.send(`
      <h2>❌ Error getting tokens</h2>
      <p><strong>Error:</strong> ${error.message}</p>
      <p>Please try the authorization process again.</p>
    `);
    }
});

// Instructions page
app.get('/', (req, res) => {
    res.send(`
    <h1>YouTube API Token Generator</h1>
    <h2>Prerequisites:</h2>
    <ol>
      <li>Create a project in Google Cloud Console</li>
      <li>Enable YouTube Data API v3</li>
      <li>Create OAuth 2.0 credentials</li>
      <li>Add http://localhost:5000/auth/youtube/callback to authorized redirect URIs</li>
      <li>Update your .env file with CLIENT_ID and CLIENT_SECRET</li>
      <li><strong>Add your email as a test user in OAuth consent screen</strong></li>
    </ol>
    
    <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border: 1px solid #ffeaa7; border-radius: 5px;">
      <h3>🚨 Getting "Access blocked" error?</h3>
      <p><strong>Your app needs to be configured for testing. Choose your setup:</strong></p>
      
      <h4>Option 1: Google Workspace Account (Recommended)</h4>
      <ol>
        <li>Go to Google Cloud Console → APIs & Services → OAuth consent screen</li>
        <li>Select "Internal" as User Type</li>
        <li>Fill out app name: "YouTube Shorts Manager"</li>
        <li>Add your email as support and developer contact</li>
        <li>Save and Continue through all steps</li>
      </ol>
      
      <h4>Option 2: Personal Gmail Account</h4>
      <ol>
        <li>Go to Google Cloud Console → APIs & Services → OAuth consent screen</li>
        <li>Select "External" as User Type</li>
        <li>Fill out required fields (app name, emails)</li>
        <li>Continue through steps until you reach "Test users"</li>
        <li>Add your Gmail address as a test user</li>
        <li>Save and publish app to testing</li>
      </ol>
      
      <h4>Option 3: Can't Find Test Users?</h4>
      <ol>
        <li>Go to APIs & Services → Credentials</li>
        <li>Create new OAuth 2.0 Client ID</li>
        <li>Application type: Web application</li>
        <li>Add redirect URI: http://localhost:5000/auth/youtube/callback</li>
        <li>Update your .env with new CLIENT_ID and CLIENT_SECRET</li>
      </ol>
    </div>
    
    <h2>Current Configuration:</h2>
    <p><strong>Client ID:</strong> ${CLIENT_ID === 'your_client_id_here' ? '❌ Not configured' : '✅ Configured'}</p>
    <p><strong>Client Secret:</strong> ${CLIENT_SECRET === 'your_client_secret_here' ? '❌ Not configured' : '✅ Configured'}</p>
    
    ${CLIENT_ID === 'your_client_id_here' || CLIENT_SECRET === 'your_client_secret_here' ?
            '<p style="color: red;"><strong>Please update your .env file with your YouTube credentials first!</strong></p>' :
            '<a href="/auth" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Authorization Process</a>'
        }
  `);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('\n🚀 YouTube Token Generator started!');
    console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
    console.log('\n📋 Make sure you have added these to your .env file:');
    console.log('   YOUTUBE_CLIENT_ID=your_actual_client_id');
    console.log('   YOUTUBE_CLIENT_SECRET=your_actual_client_secret');
    console.log('\n🔗 And add this to your OAuth redirect URIs in Google Cloud Console:');
    console.log(`   http://localhost:${PORT}/auth/youtube/callback`);
    console.log('\n');
});
