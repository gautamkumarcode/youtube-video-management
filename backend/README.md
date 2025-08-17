# YouTube Video Management Dashboard

A comprehensive dashboard for managing YouTube videos with features for updating video details, managing comments, and organizing improvement notes.

## Features

- 🎥 Fetch and display YouTube video details
- ✏️ Update video title and description
- 💬 Add, reply to, and delete comments
- 📝 Create and manage improvement notes
- 📊 Event logging and analytics
- 🔄 Real-time data synchronization

## Prerequisites

1. **YouTube API Setup**:
   - Create a project in Google Cloud Console
   - Enable YouTube Data API v3
   - Generate API key and OAuth2 credentials
   - Set up OAuth2 consent screen

2. **YouTube OAuth2 Setup**:
   - You'll need to authorize your application to manage your YouTube channel
   - The OAuth2 flow requires `access_token` and `refresh_token`

## Installation

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/youtube-video-management
YOUTUBE_API_KEY=your_youtube_api_key_here
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:5000/auth/youtube/callback
YOUTUBE_ACCESS_TOKEN=your_access_token_here
YOUTUBE_REFRESH_TOKEN=your_refresh_token_here
NODE_ENV=development
PORT=5000
```

Start the backend server:
```bash
npm run dev
```

### Frontend Setup

```bash
cd test
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

## API Endpoints

### Videos

#### GET `/api/videos/:videoId`
Fetch video details from YouTube and store/update in database.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "youtubeId": "string",
    "title": "string",
    "description": "string",
    "thumbnail": "string",
    "duration": "string",
    "publishedAt": "Date",
    "statistics": {
      "viewCount": "string",
      "likeCount": "string",
      "commentCount": "string"
    },
    "status": {
      "uploadStatus": "string",
      "privacyStatus": "string"
    },
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

#### PUT `/api/videos/:videoId`
Update video title and description on YouTube and in database.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)"
}
```

#### GET `/api/videos/:videoId/comments`
Fetch comments for the video from YouTube.

#### POST `/api/videos/:videoId/comments`
Add a new comment to the video.

**Request Body:**
```json
{
  "text": "string (required)"
}
```

#### POST `/api/videos/:videoId/comments/:commentId/reply`
Reply to a specific comment.

**Request Body:**
```json
{
  "text": "string (required)"
}
```

#### DELETE `/api/videos/:videoId/comments/:commentId`
Delete a comment.

### Notes

#### GET `/api/notes/video/:videoId`
Get all notes for a specific video.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "videoId": "string",
      "title": "string",
      "content": "string",
      "category": "improvement|ideas|feedback|general",
      "priority": "low|medium|high",
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ]
}
```

#### POST `/api/notes`
Create a new note.

**Request Body:**
```json
{
  "videoId": "string (required)",
  "title": "string (required)",
  "content": "string (required)",
  "category": "improvement|ideas|feedback|general (optional, default: general)",
  "priority": "low|medium|high (optional, default: medium)"
}
```

#### PUT `/api/notes/:noteId`
Update an existing note.

#### DELETE `/api/notes/:noteId`
Delete a note.

#### GET `/api/notes/:noteId`
Get a specific note by ID.

### Event Logs

#### GET `/api/event-logs`
Get event logs with pagination and filtering.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `eventType`
- `videoId`
- `success` (true/false)
- `startDate`
- `endDate`

#### GET `/api/event-logs/stats`
Get event statistics.

**Query Parameters:**
- `videoId` (optional)
- `days` (default: 7)

#### GET `/api/event-logs/recent/:videoId`
Get recent activity for a specific video.

## Database Schema

### Video Model
```javascript
{
  youtubeId: String (required, unique),
  title: String (required),
  description: String (default: ''),
  thumbnail: String (default: ''),
  duration: String (default: ''),
  publishedAt: Date (default: Date.now),
  statistics: {
    viewCount: String (default: '0'),
    likeCount: String (default: '0'),
    commentCount: String (default: '0')
  },
  status: {
    uploadStatus: String (default: 'processed'),
    privacyStatus: String (default: 'unlisted')
  },
  timestamps: true
}
```

### Note Model
```javascript
{
  videoId: String (required),
  title: String (required),
  content: String (required),
  category: {
    type: String,
    enum: ['improvement', 'ideas', 'feedback', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  timestamps: true
}
```

### EventLog Model
```javascript
{
  eventType: {
    type: String,
    required: true,
    enum: [
      'video_fetched', 'video_updated', 'comment_added',
      'comment_replied', 'comment_deleted', 'note_created',
      'note_updated', 'note_deleted', 'api_error', 'user_action'
    ]
  },
  videoId: String (optional),
  commentId: String (optional),
  noteId: ObjectId (optional, ref: 'Note'),
  details: Mixed (default: {}),
  userAgent: String (default: ''),
  ipAddress: String (default: ''),
  success: Boolean (default: true),
  errorMessage: String (optional),
  timestamps: true
}
```

## Usage Instructions

1. **Upload a Video**: Upload an unlisted video to your YouTube channel first
2. **Load Video**: Enter the video ID or URL in the dashboard
3. **Manage Content**: 
   - Edit video title and description
   - Add comments and replies
   - Create improvement notes
4. **Track Activity**: View event logs and statistics

## Event Logging

All user actions and API calls are automatically logged:
- Video fetches and updates
- Comment operations
- Note operations
- API errors
- User interactions

## Deployment

### Backend Deployment
- Set environment variables in your hosting platform
- Ensure MongoDB connection is configured
- Configure YouTube API credentials

### Frontend Deployment
- Build the React app: `npm run build`
- Deploy to static hosting (Vercel, Netlify, etc.)
- Update `VITE_API_URL` to point to deployed backend

## Security Notes

- Keep your YouTube API credentials secure
- Use OAuth2 for production deployments
- Implement proper authentication for multi-user scenarios
- Validate all user inputs
- Rate limit API calls

## Troubleshooting

1. **YouTube API Errors**: Check your API key and quotas
2. **OAuth Issues**: Verify redirect URI and token validity
3. **Database Connection**: Ensure MongoDB is running
4. **CORS Issues**: Configure CORS for your frontend domain

## License

MIT License