# Deployment Guide

This directory contains configuration and scripts for deploying the Contractor Platform to production.

## Deployment Options

### 1. Vercel + Supabase (Recommended for Web App)
- **Web App**: Deploy to Vercel for automatic scaling and CDN
- **Database**: Use Supabase Cloud for managed PostgreSQL
- **File Storage**: Use Supabase Storage or AWS S3
- **Authentication**: Deploy Ory Kratos separately or use Supabase Auth

```bash
# Deploy web app to Vercel
cd web
npm run build
vercel --prod
```

### 2. Self-Hosted (Full Control)
- **All Services**: Deploy using Docker Compose on your own servers
- **SSL**: Automatic Let's Encrypt certificates via Traefik
- **Monitoring**: Built-in Prometheus + Grafana
- **Backups**: Automated database backups

```bash
# Production deployment
cd deployment
cp .env.production.example .env.production
# Edit .env.production with your values
chmod +x deploy.sh
./deploy.sh
```

## Production Services

### Core Services
- **Web App**: Next.js application
- **Database**: PostgreSQL 15 with automated backups
- **Authentication**: Ory Kratos identity management
- **Chat**: Rocket.Chat for team communication
- **File Uploads**: tusd resumable upload server
- **Cache**: Redis for session storage and caching

### Infrastructure Services  
- **Reverse Proxy**: Traefik with automatic SSL
- **Monitoring**: Prometheus metrics collection
- **Dashboards**: Grafana for system monitoring
- **Backups**: Automated daily database backups

## Domain Setup

Configure these subdomains to point to your server:

- `yourdomain.com` - Main web application
- `auth.yourdomain.com` - Authentication service
- `chat.yourdomain.com` - Rocket.Chat instance
- `uploads.yourdomain.com` - File upload service
- `dashboard.yourdomain.com` - Monitoring dashboard
- `metrics.yourdomain.com` - Prometheus metrics

## Environment Variables

Copy `.env.production.example` to `.env.production` and update:

### Required Variables
- `DOMAIN` - Your main domain name
- `DB_PASSWORD` - Secure database password
- `SUPABASE_*` - Supabase project credentials
- `*_API_KEY` - External service API keys

### Optional Variables
- `BACKUP_RETENTION_DAYS` - How long to keep backups (default: 30)
- `LOG_LEVEL` - Application logging level (default: info)
- `API_RATE_LIMIT` - API requests per minute (default: 100)

## Security Considerations

### SSL/TLS
- Automatic Let's Encrypt certificates
- HSTS headers enabled
- Modern TLS cipher suites only

### Database Security
- Encrypted connections required
- Regular automated backups
- Row-level security (RLS) enabled
- Principle of least privilege for users

### API Security
- Rate limiting on all endpoints
- CORS properly configured
- API key authentication for external services
- Request validation and sanitization

### File Upload Security
- Virus scanning (integrate with ClamAV)
- File type validation
- Size limits enforced
- Secure storage with signed URLs

## Monitoring & Maintenance

### Health Checks
- Database connectivity
- Service responsiveness  
- SSL certificate expiry
- Disk space monitoring
- Memory and CPU usage

### Automated Backups
- Daily database backups
- File storage snapshots
- Configuration backups
- 30-day retention policy

### Log Management
- Centralized logging with structured format
- Log rotation and archival
- Error tracking and alerting
- Performance metrics collection

## Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Database read replicas
- Redis clustering
- CDN integration

### Performance Optimization
- Database query optimization
- Image optimization and CDN
- Caching strategies
- Background job processing

## Maintenance Tasks

### Weekly
- Review system health dashboards
- Check backup integrity
- Update security patches
- Monitor error logs

### Monthly  
- Update dependencies
- Review access logs
- Optimize database performance
- Clean up old files and logs

### Quarterly
- Security audit
- Performance review
- Capacity planning
- Disaster recovery testing

## Rollback Procedure

If deployment fails or issues are discovered:

1. **Stop new deployment**:
   ```bash
   docker-compose -f docker-compose.prod.yml stop
   ```

2. **Restore from backup**:
   ```bash
   # Restore database from latest backup
   ./scripts/restore-backup.sh latest
   ```

3. **Deploy previous version**:
   ```bash
   git checkout previous-release-tag
   ./deploy.sh
   ```

4. **Verify system health**:
   ```bash
   ./scripts/health-check.sh
   ```

## Support

For deployment issues:
1. Check service logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables are set correctly
3. Ensure all required ports are open (80, 443)
4. Check DNS configuration for subdomains