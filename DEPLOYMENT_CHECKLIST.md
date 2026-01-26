# Deployment Checklist

## Pre-Deployment Steps

### 1. Database Setup
- [ ] Ensure PostgreSQL database is provisioned
- [ ] Set DATABASE_URL environment variable
- [ ] Run Prisma migrations:
  ```bash
  cd eposo-test-api
  npm run prisma:migrate
  ```
- [ ] Verify database connection

### 2. Environment Variables

#### Backend (eposo-test-api)
Set these environment variables in your deployment platform:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_ACCESS_SECRET="your-secure-random-access-token-secret"
JWT_REFRESH_SECRET="your-secure-random-refresh-token-secret"
NODE_ENV="production"
```

**⚠️ IMPORTANT:** 
- Generate strong, unique secrets for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
- Never commit actual secrets to version control
- Use different secrets for staging and production
- Suggested secret generation:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

#### Frontend (eposo-test-web)
No environment variables required for basic setup. If using custom API URL:
```env
VITE_API_URL="https://your-api-domain.com"
```

### 3. Dependency Installation

#### Backend
```bash
cd eposo-test-api
npm install
npm run prisma:generate
```

#### Frontend
```bash
cd eposo-test-web
npm install
```

### 4. Build Verification

#### Backend
```bash
cd eposo-test-api
npm run build
```
Verify `dist/` folder is created without errors.

#### Frontend
```bash
cd eposo-test-web
npm run build
```
Verify `dist/` folder is created without errors.

## Deployment Steps (Vercel)

### Backend Deployment
1. Connect repository to Vercel
2. Set root directory to `eposo-test-api`
3. Set environment variables (see section 2)
4. Deploy
5. Note the deployment URL

### Frontend Deployment
1. Connect repository to Vercel (or use same project with different service)
2. Set root directory to `eposo-test-web`
3. Update API proxy configuration if needed
4. Deploy
5. Note the deployment URL

### Alternative: Monorepo Deployment
If deploying as monorepo, configure `vercel.json` appropriately.

## Post-Deployment Verification

### Backend Health Checks
- [ ] API is accessible at deployment URL
- [ ] POST /auth/signup endpoint responds
- [ ] POST /auth/login endpoint responds
- [ ] POST /auth/logout endpoint responds
- [ ] Database connection is working
- [ ] Prisma migrations are applied
- [ ] Cookies are being set correctly (check browser DevTools)

### Frontend Health Checks
- [ ] Web app loads successfully
- [ ] Login page displays correctly
- [ ] Sign up page displays correctly
- [ ] Forms are functional
- [ ] API calls reach backend
- [ ] CORS is configured correctly
- [ ] Cookies are being sent with requests

### End-to-End Testing
- [ ] Create new account via sign up form
- [ ] Verify redirection to login page
- [ ] Login with correct credentials
- [ ] Verify access token is stored
- [ ] Verify header shows with logout button
- [ ] Test API call with Bearer token
- [ ] Test logout functionality
- [ ] Verify session data is cleared
- [ ] Verify redirection to login page

### Security Testing
- [ ] Test login with non-existent email (should show specific error)
- [ ] Test login with wrong password (should show attempts remaining)
- [ ] Make 5 failed login attempts (should lock account)
- [ ] Try login during lock period (should show countdown)
- [ ] Wait for lock to expire (10 minutes)
- [ ] Login successfully after lock expires
- [ ] Verify cookies are HttpOnly (check browser DevTools)
- [ ] Verify cookies are Secure in production
- [ ] Verify SameSite attribute is set
- [ ] Test CORS with different origins

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Rollback Plan

If issues occur:
1. Revert to previous deployment via Vercel dashboard
2. Check error logs in Vercel deployment logs
3. Verify environment variables are set correctly
4. Check database connectivity
5. Review CORS configuration

## Monitoring Setup

### Logs to Monitor
- [ ] Backend API errors
- [ ] Authentication failures
- [ ] Database connection issues
- [ ] Cookie setting failures
- [ ] CORS errors

### Metrics to Track
- [ ] Login success rate
- [ ] Failed login attempts
- [ ] Account lock frequency
- [ ] Token expiration issues
- [ ] API response times

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** 
- Verify CORS origin includes frontend domain
- Check credentials: true is set
- Verify frontend sends withCredentials: true

### Issue: Cookie Not Being Set
**Solution:**
- Check secure flag matches protocol (HTTP/HTTPS)
- Verify SameSite attribute is compatible
- Check browser cookie settings

### Issue: Token Not Attached to Requests
**Solution:**
- Verify localStorage has accessToken
- Check axios interceptor is configured
- Verify Authorization header format

### Issue: Database Connection Failed
**Solution:**
- Verify DATABASE_URL format
- Check database is running
- Verify network/firewall rules
- Run prisma generate

### Issue: Prisma Client Error
**Solution:**
```bash
cd eposo-test-api
npm run prisma:generate
npm run build
```

## Production Best Practices

### Security
- [ ] Use HTTPS only (Vercel provides this)
- [ ] Rotate JWT secrets periodically
- [ ] Monitor for suspicious login activity
- [ ] Implement rate limiting (future enhancement)
- [ ] Set up security headers

### Performance
- [ ] Enable caching where appropriate
- [ ] Monitor database query performance
- [ ] Use CDN for static assets (Vercel provides this)
- [ ] Implement connection pooling for database

### Reliability
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring
- [ ] Document incident response procedures

## Support & Troubleshooting

### Log Access
- **Vercel:** View logs in project dashboard
- **Database:** Access via provider dashboard

### Debug Mode
To enable debug logs, set:
```env
DEBUG=*
```

### Quick Commands
```bash
# View recent logs (if SSH access available)
tail -f logs/error.log

# Test API endpoint
curl -X POST https://your-api.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test with cookies
curl -X POST https://your-api.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt -b cookies.txt
```

## Success Criteria

Deployment is successful when:
- ✅ All endpoints respond correctly
- ✅ Authentication flow works end-to-end
- ✅ No console errors in browser
- ✅ Cookies are set and transmitted correctly
- ✅ Security features (account locking) work
- ✅ Error messages are displayed correctly
- ✅ Logout clears session properly

## Contact & Resources

- **Project Repository:** juhy0987/eposo-test-web
- **Documentation:** See README.md and API_DOCS.md
- **Implementation Details:** See IMPLEMENTATION_SUMMARY.md
