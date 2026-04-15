# Team Guide - Getting Started with Sidequest

## 🎯 Goal
Get Sidequest running on your machine in 5 minutes.

## 📋 What You Need

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Git** - [Download here](https://git-scm.com/downloads)
3. **Google Cloud API Keys** - We'll set this up together

## 🚀 Step-by-Step Setup

### Step 1: Get the Code (1 minute)

```bash
# Clone the repository
git clone <repository-url>
cd sidequest
```

### Step 2: Configure Environment (2 minutes)

```bash
# Copy the example environment file
cp .env.example .env
```

Now edit `.env` file and add your API keys:

```env
# Replace these with actual values:
GOOGLE_API_KEY=your-key-here
GOOGLE_CLOUD_PROJECT=your-project-id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key-here
```

**Don't have API keys yet?** See "Getting API Keys" section below.

### Step 3: Start the Application (2 minutes)

```bash
# Build and start everything
docker-compose up --build
```

Wait for the build to complete (first time takes 2-3 minutes).

### Step 4: Verify It's Working

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000/health

You should see:
- ✅ Sidequest homepage
- ✅ City selector dropdown
- ✅ Explore experiences section

## 🔑 Getting API Keys

### Google Cloud Setup (5 minutes)

#### 1. Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "sidequest-dev" (or anything you like)
4. Click "Create"
5. Note your Project ID (you'll need this)

#### 2. Enable Billing
1. Go to [Billing](https://console.cloud.google.com/billing)
2. Link a billing account (credit card required)
3. **Don't worry**: Google gives $200 free credit/month
4. Development usage is usually free

#### 3. Enable APIs
Click these links (they'll enable the APIs):
- [Enable Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)
- [Enable Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
- [Enable Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

#### 4. Create API Keys

**For Vertex AI:**
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. Click "Edit API Key"
5. Under "API restrictions", select "Restrict key"
6. Choose "Vertex AI API"
7. Save

**For Google Maps:**
1. Click "Create Credentials" → "API Key" again
2. Copy this key (different from above)
3. Click "Edit API Key"
4. Under "Application restrictions", select "HTTP referrers"
5. Add: `http://localhost:*`
6. Under "API restrictions", select "Restrict key"
7. Choose: "Maps JavaScript API" and "Places API"
8. Save

#### 5. Update .env File

```env
GOOGLE_API_KEY=<your-vertex-ai-key>
GOOGLE_CLOUD_PROJECT=<your-project-id>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-maps-key>
```

#### 6. Restart Application

```bash
# Stop current containers
docker-compose down

# Start again
docker-compose up
```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend health check passes: http://localhost:8000/health
- [ ] Can select different cities from dropdown
- [ ] Explore section shows experiences
- [ ] Can search experiences
- [ ] Can create an itinerary
- [ ] Map loads on itinerary page (no errors)
- [ ] Map centers on selected city
- [ ] No errors in browser console (press F12)

## 🐛 Common Issues

### Issue: "Port already in use"

**Solution:**
```bash
# Stop Docker containers
docker-compose down

# Or change ports in docker-compose.yml
```

### Issue: "Google Maps not loading"

**Symptoms:**
- Gray map or error message
- Console shows `ApiProjectMapError`

**Solution:**
1. Check `.env` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Verify billing is enabled in Google Cloud
3. Verify Maps JavaScript API is enabled
4. Check API key restrictions allow `http://localhost:*`
5. Restart: `docker-compose restart`

**Still not working?** See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

### Issue: "Backend won't start"

**Solution:**
```bash
# Check logs
docker-compose logs backend

# Common fixes:
# 1. Verify GOOGLE_API_KEY in .env
# 2. Verify GOOGLE_CLOUD_PROJECT in .env
# 3. Rebuild: docker-compose up --build
```

### Issue: "Frontend shows connection error"

**Solution:**
```bash
# Check backend is running
curl http://localhost:8000/health

# If not, check backend logs
docker-compose logs backend

# Restart everything
docker-compose restart
```

## 📚 Useful Commands

### Starting/Stopping

```bash
# Start (foreground - see logs)
docker-compose up

# Start (background)
docker-compose up -d

# Stop
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### Viewing Logs

```bash
# All logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Backend only
docker-compose logs backend

# Frontend only
docker-compose logs frontend
```

### Rebuilding

```bash
# Rebuild everything
docker-compose up --build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

### Troubleshooting

```bash
# Check running containers
docker-compose ps

# Check container health
docker-compose exec backend python -c "print('Backend OK')"
docker-compose exec frontend node -v

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

## 🎓 Learning the Codebase

### Key Files to Understand

1. **Backend Entry Point**
   - `backend/main.py` - FastAPI server setup

2. **Frontend Entry Point**
   - `frontend/src/app/page.tsx` - Homepage

3. **City Configuration**
   - `backend/config/cities.py` - Add/edit cities here

4. **Experiences Data**
   - `backend/data/curated_experiences.py` - Add experiences

5. **Map Component**
   - `frontend/src/components/google-map.tsx` - Map logic

### Project Structure

```
sidequest/
├── backend/              # Python FastAPI backend
│   ├── agents/          # AI agents
│   ├── config/          # Configuration
│   ├── data/            # Curated data
│   └── main.py          # Entry point
│
├── frontend/            # Next.js frontend
│   └── src/
│       ├── app/         # Pages
│       ├── components/  # React components
│       └── lib/         # Utilities
│
├── .env                 # Your API keys (don't commit!)
├── docker-compose.yml   # Docker orchestration
└── docs/                # Documentation
```

## 🔄 Development Workflow

### Making Changes

1. **Edit code** in your IDE
2. **For backend**: Changes auto-reload (if using dev mode)
3. **For frontend**: Page auto-refreshes
4. **For .env**: Restart containers

### Testing Changes

```bash
# Backend
docker-compose exec backend pytest

# Frontend
docker-compose exec frontend npm test
```

### Adding a New City

1. Edit `backend/config/cities.py`
2. Add new city to `SUPPORTED_CITIES`
3. Restart backend: `docker-compose restart backend`
4. City appears in frontend dropdown

### Adding Experiences

1. Edit `backend/data/curated_experiences.py`
2. Add experiences for your city
3. Restart backend: `docker-compose restart backend`
4. Experiences appear in explore section

## 🚢 Deploying Your Changes

### To Staging/Production

```bash
# 1. Commit your changes
git add .
git commit -m "Your changes"
git push

# 2. GitHub Actions will automatically build Docker images

# 3. Deploy to your platform (Railway, GCP, AWS, etc.)
```

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for deployment details.

## 📖 Additional Resources

| Topic | Document |
|-------|----------|
| Quick 5-min setup | [QUICK_START.md](./QUICK_START.md) |
| Detailed setup | [GETTING_STARTED.md](./GETTING_STARTED.md) |
| Docker guide | [DOCKER_SETUP.md](./DOCKER_SETUP.md) |
| Fix Maps errors | [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) |
| Deployment | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) |

## 🆘 Getting Help

1. **Check documentation** - Most issues are covered in the guides
2. **Check logs** - `docker-compose logs -f`
3. **Search issues** - Check if someone else had the same problem
4. **Ask the team** - We're here to help!

## 💡 Tips for Success

1. **Always use Docker** - Ensures consistent environment
2. **Check logs first** - Most issues show up in logs
3. **Restart when in doubt** - `docker-compose restart`
4. **Keep .env updated** - Don't commit it to Git
5. **Read error messages** - They usually tell you what's wrong

## 🎉 You're Ready!

Once you see:
- ✅ Frontend at http://localhost:3000
- ✅ Backend at http://localhost:8000
- ✅ Map loading correctly
- ✅ No console errors

You're all set! Start exploring the codebase and building features.

## 📞 Support Contacts

- **Technical Issues**: Check documentation first
- **API Key Issues**: See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)
- **Docker Issues**: See [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Team Lead**: [Add contact]
- **DevOps**: [Add contact]

---

**Welcome to the team! 🚀**

Start with [QUICK_START.md](./QUICK_START.md) if you want the fastest path to running code.
