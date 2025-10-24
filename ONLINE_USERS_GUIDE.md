# Online Users Feature Guide

## How It Works

The online users feature tracks users who are actively connected to the chat service via Socket.IO. Here's how it works:

### 1. Socket.IO Connection
- When users visit the **Dashboard** or **Chat** page, their browser establishes a Socket.IO connection
- The frontend automatically emits a `join` event with the username
- The chat service adds the user to the `connectedUsers` map

### 2. Real-time Updates
- When users join/leave, all connected clients receive `activeUsers` events
- The dashboard shows the count and list of online users
- Users are automatically removed when they disconnect

### 3. API Endpoints
- `GET /health` - Shows total online users count
- `GET /api/users/active` - Returns list of active usernames

## Testing the Feature

### Step 1: Start the Application
```bash
./start.sh
```

### Step 2: Open Multiple Browser Windows
1. Open http://localhost:3000 in Browser 1
2. Login as User 1
3. Go to Dashboard - you'll see "0 users online" (excluding yourself)

4. Open http://localhost:3000 in Browser 2 (incognito/different browser)
5. Login as User 2
6. Go to Dashboard - you'll see "1 user online" (User 1)

7. In Browser 1, refresh the dashboard - you'll see "1 user online" (User 2)

### Step 3: Test Real-time Updates
1. Go to Chat page in both browsers
2. Both users will see each other in the online users list
3. Close one browser - the other will see the user count decrease

### Step 4: API Testing
```bash
# Check online users count
curl http://localhost:3001/health

# Get list of active users
curl http://localhost:3001/api/users/active
```

## Important Notes

1. **Users must visit Dashboard or Chat pages** - Simply being logged in is not enough
2. **Socket.IO connection required** - The connection is established when visiting these pages
3. **Real-time updates** - Changes are reflected immediately across all connected clients
4. **Automatic cleanup** - Users are removed when they close the browser or navigate away

## Troubleshooting

### "0 users online" even with multiple users
- Ensure users have visited the Dashboard or Chat pages
- Check browser console for Socket.IO connection errors
- Verify chat service is running: `curl http://localhost:3001/health`

### Users not appearing in list
- Check if Socket.IO connection is established (browser dev tools → Network → WS)
- Ensure users have different usernames
- Try refreshing the page

### Connection issues
- Check CORS settings in chat service
- Verify ports 3001 and 3000 are accessible
- Check Docker container logs: `docker logs chat-microservices-chat-service-1`
