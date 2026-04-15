# Deployment Checklist

Use this checklist when setting up or deploying Sidequest.

## Initial Setup

### Google Cloud Configuration

- [ ] Create Google Cloud project
- [ ] Enable billing on the project
- [ ] Enable Vertex AI API
- [ ] Enable Maps JavaScript API
- [ ] Enable Places API
- [ ] Create API key for Vertex AI
- [ ] Create API key for Google Maps
- [ ] Configure API key restrictions (HTTP referrers)
- [ ] Set up budget alerts ($50/month recommended)
- [ ] Test API keys with sample requests

### Local Development Setup

- [ ] Clone repository
- [ ] Copy `.env.example` to `.env`
- [ ] Add all required API keys to `.env`
- [ ] Install Docker Desktop (if using Docker)
- [ ] Install Python 3.11+ (if running locally)
- [ ] Install Node.js 18+ (if running locally)

### Docker Setup (Recommended)

- [ ] Verify Docker is installed: `docker --version`
- [ ] Verify Docker Compose is installed: `docker-compose --version`
- [ ] Build images: `docker-compose build`
- [ ] Start services: `docker-compose up -d`
- [ ] Check backend health: `curl http://localhost:8000/health`
- [ ] Check frontend: Open http://localhost:3000
- [ ] Verify no errors in logs: `docker-compose logs`

### Local Setup (Alternative)

#### Backend
- [ ] Navigate to backend: `cd backend`
- [ ] Create virtual environment: `python -m venv .venv`
- [ ] Activate virtual environment
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Start server: `python main.py`
- [ ] Verify health endpoint: http://localhost:8000/health

#### Frontend
- [ ] Navigate to frontend: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Open browser: http://localhost:3000
- [ ] Check browser console for errors

## Verification Tests

### Backend Tests

- [ ] Health check returns 200: `curl http://localhost:8000/health`
- [ ] API docs accessible: http://localhost:8000/docs
- [ ] Cities endpoint works: `curl http://localhost:8000/api/cities`
- [ ] Experiences endpoint works: `curl http://localhost:8000/api/experiences?city=bangalore`
- [ ] No errors in backend logs

### Frontend Tests

- [ ] Homepage loads without errors
- [ ] City selector shows all cities
- [ ] Can select different cities
- [ ] Explore section shows experiences
- [ ] Search functionality works
- [ ] Category filters work
- [ ] Quick filters work
- [ ] Can create itinerary
- [ ] No console errors (F12)

### Google Maps Tests

- [ ] Map loads on itinerary page
- [ ] Map centers on selected city
- [ ] Markers appear for experiences
- [ ] Can click markers to see info windows
- [ ] Place photos load in info windows
- [ ] "Get Directions" button works
- [ ] No Google Maps errors in console
- [ ] Map works for all supported cities:
  - [ ] Bangalore
  - [ ] Rishikesh
  - [ ] Kasol
  - [ ] Gokarna
  - [ ] Rameshwaram

### Multi-City Tests

- [ ] Select Bangalore - experiences load
- [ ] Select Rishikesh - experiences load
- [ ] Select Kasol - experiences load
- [ ] Select Gokarna - experiences load
- [ ] Select Rameshwaram - experiences load
- [ ] Map centers correctly for each city
- [ ] Create itinerary for each city works

## Production Deployment

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] API keys have production restrictions
- [ ] Billing alerts configured
- [ ] Monitoring set up
- [ ] Backup strategy defined
- [ ] SSL certificates ready (for custom domain)

### Docker Registry

- [ ] Build production images
- [ ] Tag images with version
- [ ] Push to container registry
- [ ] Verify images in registry
- [ ] Test pulling images

### Cloud Platform Deployment

#### Google Cloud Run
- [ ] Build and push images to GCR
- [ ] Deploy backend service
- [ ] Deploy frontend service
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Configure Cloud CDN (optional)
- [ ] Test deployed services

#### AWS ECS/Fargate
- [ ] Push images to ECR
- [ ] Create task definitions
- [ ] Create ECS service
- [ ] Configure load balancer
- [ ] Set up auto-scaling
- [ ] Configure environment variables
- [ ] Test deployed services

#### Railway/Render
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy services
- [ ] Verify deployment
- [ ] Test deployed services

### Post-Deployment

- [ ] Verify production URLs work
- [ ] Test all major features
- [ ] Check error logs
- [ ] Monitor API usage
- [ ] Verify SSL/HTTPS working
- [ ] Test from different devices
- [ ] Test from different locations
- [ ] Set up uptime monitoring
- [ ] Document deployment process

## Security Checklist

- [ ] `.env` file not committed to Git
- [ ] API keys have proper restrictions
- [ ] Production API keys separate from dev keys
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] Docker images scanned for vulnerabilities

## Monitoring Setup

- [ ] Google Cloud Monitoring enabled
- [ ] API usage dashboard configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up
- [ ] Alert rules configured
- [ ] Budget alerts active
- [ ] Performance monitoring enabled

## Documentation

- [ ] README.md updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide updated
- [ ] Architecture diagrams current
- [ ] Team onboarding guide ready

## Team Onboarding

- [ ] Share repository access
- [ ] Share API keys (securely)
- [ ] Share documentation links
- [ ] Provide QUICK_START.md
- [ ] Provide GETTING_STARTED.md
- [ ] Schedule onboarding session
- [ ] Add to communication channels
- [ ] Grant necessary permissions

## Maintenance

### Weekly
- [ ] Check error logs
- [ ] Review API usage
- [ ] Check disk space (if applicable)
- [ ] Review performance metrics

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize costs
- [ ] Check security advisories
- [ ] Review and update documentation
- [ ] Backup data
- [ ] Test disaster recovery

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost optimization review
- [ ] Update architecture docs
- [ ] Team training/updates

## Troubleshooting Reference

### Issue: Google Maps not loading
**Check**: 
- [ ] API key in `.env`
- [ ] Billing enabled
- [ ] APIs enabled in console
- [ ] Referrer restrictions
- [ ] Browser console errors

**Fix**: See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

### Issue: Backend won't start
**Check**:
- [ ] Python version (3.11+)
- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Port 8000 available

**Fix**: See [GETTING_STARTED.md](./GETTING_STARTED.md)

### Issue: Frontend build fails
**Check**:
- [ ] Node version (18+)
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Port 3000 available
- [ ] No syntax errors

**Fix**: See [GETTING_STARTED.md](./GETTING_STARTED.md)

### Issue: Docker containers won't start
**Check**:
- [ ] Docker running
- [ ] `.env` file exists
- [ ] Ports available
- [ ] Disk space available
- [ ] Images built successfully

**Fix**: See [DOCKER_SETUP.md](./DOCKER_SETUP.md)

## Emergency Contacts

- **Google Cloud Support**: https://cloud.google.com/support
- **Docker Support**: https://docs.docker.com/support/
- **Project Lead**: [Add contact]
- **DevOps Team**: [Add contact]
- **On-Call**: [Add rotation schedule]

## Rollback Procedure

If deployment fails:

1. [ ] Stop new deployment
2. [ ] Check error logs
3. [ ] Identify issue
4. [ ] Decide: fix forward or rollback
5. [ ] If rollback:
   - [ ] Deploy previous version
   - [ ] Verify services working
   - [ ] Notify team
   - [ ] Document issue
6. [ ] If fix forward:
   - [ ] Apply fix
   - [ ] Test thoroughly
   - [ ] Deploy fix
   - [ ] Verify services working

## Success Criteria

Deployment is successful when:

- [ ] All services running without errors
- [ ] All tests passing
- [ ] Maps loading correctly for all cities
- [ ] API responding within acceptable time
- [ ] No critical errors in logs
- [ ] Monitoring showing healthy metrics
- [ ] Team can access and use the application
- [ ] Documentation is up to date

---

**Last Updated**: [Date]
**Reviewed By**: [Name]
**Next Review**: [Date]
