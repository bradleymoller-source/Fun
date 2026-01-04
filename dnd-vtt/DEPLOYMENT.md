# Railway Deployment Guide

## Prerequisites
- GitHub account
- Railway account (free at [railway.app](https://railway.app))

## Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository.

## Step 2: Deploy the Server

1. Go to [railway.app](https://railway.app) and click "Start a New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Click "Add variables" and set:
   - `PORT` = `3001` (Railway will override this automatically)
5. In the service settings:
   - Set **Root Directory** to `dnd-vtt/server`
   - Railway will auto-detect Node.js
6. Click Deploy
7. Once deployed, go to Settings → Networking → Generate Domain
8. Copy the URL (e.g., `https://dnd-vtt-server-production.up.railway.app`)

## Step 3: Deploy the Client

1. In the same Railway project, click "New Service" → "GitHub Repo"
2. Choose the same repository
3. Click "Add variables" and set:
   - `VITE_SERVER_URL` = `https://your-server-url.up.railway.app` (the URL from step 2)
4. In the service settings:
   - Set **Root Directory** to `dnd-vtt/client`
5. Click Deploy
6. Once deployed, go to Settings → Networking → Generate Domain
7. Copy the client URL - this is your game URL!

## Step 4: Update Server CORS (if needed)

If you get CORS errors, update the server's environment variables:
- `CLIENT_URL` = `https://your-client-url.up.railway.app`

## Usage

1. Share the client URL with your players
2. DM clicks "Create Game" to start a session
3. Players click "Join Game" and enter the room code
4. Have fun!

## Costs

Railway's free tier includes:
- $5 of usage credits per month
- Enough for hobby projects and small games
- No credit card required to start

## Troubleshooting

### "Can't connect to server"
- Check that VITE_SERVER_URL is set correctly in client variables
- Make sure the server has a public domain generated

### "CORS error"
- Update the server's CORS settings or add CLIENT_URL variable

### Server crashes
- Check the deployment logs in Railway dashboard
- Ensure all dependencies are in package.json
