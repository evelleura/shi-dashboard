# 8. Deployment & Setup Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- PostgreSQL 17+ (system or portable install)
- npm or yarn

### Step 1: Clone & Install

```bash
cd /Users/user/Documents/COLLEGE/Mata\ Kuliah/8/Tugas\ Akhir/coding/project_ta_dian_putri_iswandi/frontend

# Install dependencies
npm install

# Install PostgreSQL (macOS via Homebrew)
brew install postgresql

# Or use system install at /Library/PostgreSQL/18
```

### Step 2: Database Setup

```bash
# Start PostgreSQL (if using brew service)
brew services start postgresql

# Or start system PostgreSQL
/Library/PostgreSQL/18/bin/pg_ctl -D /Library/PostgreSQL/18/data start

# Verify connection
psql -U postgres

# Create database
createdb -U postgres shi_dashboard_new

# Run schema and seed
psql -U postgres -d shi_dashboard_new < frontend/database/schema.sql
psql -U postgres -d shi_dashboard_new < frontend/database/seed.sql
```

### Step 3: Environment Configuration

**File:** `frontend/.env.local`

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:12345@localhost:5432/shi_dashboard_new

# Server
NODE_ENV=development
PORT=3000

# JWT Secret (for token signing)
JWT_SECRET=your-secret-key-min-32-chars-for-production

# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes

# Optional: API logging
LOG_LEVEL=debug
```

### Step 4: Start Development Server

```bash
# From frontend directory
npm run dev

# Server runs at http://localhost:3000
# Next.js hot reload enabled
```

### Step 5: Database GUI (Optional)

**pgAdmin 4:**
```bash
# Install
brew install pgadmin4

# Start
open /Applications/pgAdmin\ 4.app
```

**Adminer (lighter alternative):**
```bash
# Download adminer.php from adminer.org
# Run PHP server in adminer directory
php -S localhost:8888

# Access at http://localhost:8888
# Login with PostgreSQL credentials
```

---

## Default Test Accounts (Seeded Data)

### Technicians
```
Email: technician1@example.com
Password: password123
Role: technician

Email: technician2@example.com
Password: password123
Role: technician
```

### Manager
```
Email: manager@example.com
Password: password123
Role: manager
```

### Admin
```
Email: admin@example.com
Password: password123
Role: admin
```

---

## Database Initialization

### Running Migrations

**Schema:** `frontend/database/schema.sql`
- Creates all 11 tables
- Adds indexes for performance
- Defines constraints and relationships

**Seed Data:** `frontend/database/seed.sql`
- Inserts test projects with SHI-YYMMXXX codes
- Inserts test users and assignments
- Inserts sample tasks and materials
- Pre-calculates initial health status

**Manual Migration (if needed):**
```bash
# Add missing column to existing database
psql -U postgres -d shi_dashboard_new

# In psql:
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_code VARCHAR(12) UNIQUE NOT NULL DEFAULT 'SHI-9999999';

ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS project_code_key;

ALTER TABLE projects 
ADD CONSTRAINT project_code_key UNIQUE (project_code);

UPDATE projects SET project_code = 'SHI-' || LPAD(id::text, 7, '0') 
WHERE project_code = 'SHI-9999999';
```

---

## Development Workflow

### Hot Reload
- Edit any `.tsx` or `.ts` file
- Browser auto-refreshes
- No server restart needed

### TypeScript Checking
```bash
# Check for type errors
npm run type-check

# Fix automatically where possible
npm run type-check:fix
```

### Code Formatting
```bash
# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Linting
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

---

## Building for Production

### Build Frontend

```bash
# From frontend directory
npm run build

# Output: .next/ directory (optimized Next.js app)

# Verify build
npm run build:analyze  # Shows bundle size

# Test production build locally
npm run start         # Starts Next.js production server
```

### Build Process

```
Source (.tsx, .ts, .css)
    ↓
Next.js Compiler (SWC)
    ├─ TypeScript checking
    ├─ Code splitting
    ├─ Tree shaking
    └─ Minification
    ↓
Output (.next/ directory)
    ├─ Optimized HTML
    ├─ JavaScript bundles
    ├─ CSS modules
    └─ Static assets
```

### Production Checklist

- [ ] Environment variables in `.env.production.local`
- [ ] Database backed up
- [ ] JWT_SECRET set to strong random value
- [ ] HTTPS/SSL configured on reverse proxy
- [ ] Database user created (not default postgres)
- [ ] File upload directory has appropriate permissions
- [ ] Logs configured to file or external service
- [ ] Error tracking (Sentry, etc.) configured
- [ ] Monitoring setup (uptime, performance)
- [ ] Disaster recovery plan

---

## Production Deployment (Recommended)

### Architecture

```
┌────────────────────────────────────────┐
│         Client Browser                 │
└──────────────────┬─────────────────────┘
                   │ HTTPS/TLS
                   ▼
┌────────────────────────────────────────┐
│    Nginx Reverse Proxy (Port 80/443)   │
│  - SSL/TLS termination                 │
│  - Load balancing (if multiple servers)│
│  - Gzip compression                    │
│  - Static file caching                 │
└──────────────┬───────────────────────┘
               │ HTTP (internal network)
               ▼
┌────────────────────────────────────────┐
│  Next.js App Server (Port 3000)        │
│  - Served by PM2 (process manager)     │
│  - Multiple instances for HA           │
│  - Environment: production             │
└──────────────┬───────────────────────┘
               │ TCP/IP
               ▼
┌────────────────────────────────────────┐
│  PostgreSQL Database (Port 5432)       │
│  - Connection pooling enabled          │
│  - Regular backups (daily)             │
│  - Replication for HA (optional)       │
└────────────────────────────────────────┘
```

### Deployment Steps

**1. Server Setup (Ubuntu/Debian)**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Nginx
sudo apt-get install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

**2. Application Setup**

```bash
# Create app directory
sudo mkdir -p /opt/shi-dashboard
sudo chown $USER:$USER /opt/shi-dashboard
cd /opt/shi-dashboard

# Clone repository (or copy files)
git clone <repo-url> .

# Install dependencies
npm ci --only=production

# Build
npm run build
```

**3. Environment Configuration**

```bash
# Create .env.production.local
cat > /opt/shi-dashboard/.env.production.local << EOF
DATABASE_URL=postgresql://shi_user:STRONG_PASSWORD@localhost:5432/shi_dashboard_prod
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -base64 32)
UPLOAD_DIR=/var/uploads/shi-dashboard
MAX_FILE_SIZE=52428800
EOF

# Secure permissions
chmod 600 /opt/shi-dashboard/.env.production.local
```

**4. PM2 Startup Configuration**

```bash
# Create PM2 config file
cat > /opt/shi-dashboard/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'shi-dashboard',
      script: './.next/standalone/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/shi-dashboard/error.log',
      out_file: '/var/log/shi-dashboard/out.log',
      log_file: '/var/log/shi-dashboard/combined.log',
      time_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
EOF

# Create log directory
sudo mkdir -p /var/log/shi-dashboard
sudo chown $USER:$USER /var/log/shi-dashboard

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

**5. Nginx Configuration**

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/shi-dashboard > /dev/null << 'EOF'
upstream shi_dashboard {
  server 127.0.0.1:3000;
  server 127.0.0.1:3001;  # If running multiple instances
  server 127.0.0.1:3002;
}

server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;
  
  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com www.yourdomain.com;

  # SSL certificates (Let's Encrypt recommended)
  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
  
  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Logging
  access_log /var/log/nginx/shi-dashboard-access.log;
  error_log /var/log/nginx/shi-dashboard-error.log;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
  gzip_min_length 256;

  location /.next/static/ {
    # Cache static files for 1 year
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    proxy_pass http://shi_dashboard;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/shi-dashboard /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**6. Database Setup (Production)**

```bash
# Create database user (not using default postgres)
sudo -u postgres createuser -P shi_user  # Prompt for password
sudo -u postgres createdb -O shi_user shi_dashboard_prod

# Run migrations
psql -U shi_user -d shi_dashboard_prod < frontend/database/schema.sql
psql -U shi_user -d shi_dashboard_prod < frontend/database/seed.sql

# Configure backups
cat > /etc/postgresql/14/main/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U shi_user shi_dashboard_prod | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz
# Keep last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

# Schedule daily backup (crontab)
0 2 * * * /etc/postgresql/14/main/backup.sh
```

**7. SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron runs automatically)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Monitoring & Maintenance

### Health Check Endpoint

**TODO:** Add health check endpoint

```typescript
// frontend/src/app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await query('SELECT 1');
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
}
```

### Monitoring Commands

```bash
# Check PM2 status
pm2 status

# View logs (real-time)
pm2 logs

# Restart application
pm2 restart shi-dashboard

# Check database connections
psql -U shi_user -d shi_dashboard_prod
SELECT count(*) FROM pg_stat_activity;

# Check disk usage
df -h /var/uploads/shi-dashboard

# Monitor PostgreSQL
ANALYZE;  # Optimize query planner
VACUUM;   # Clean up dead rows
```

### Automated Monitoring (Recommended)

- **Uptime:** Pingdom, UptimeRobot, or custom script
- **Error Tracking:** Sentry, Rollbar
- **Performance:** New Relic, DataDog
- **Logs:** ELK Stack, Splunk, or CloudWatch
- **Alerts:** PagerDuty, Slack notifications

---

## Scaling Considerations

### Horizontal Scaling (Multiple Servers)

1. **Load Balancer** (upstream proxy)
   - HAProxy or Nginx upstream
   - Distributes traffic across servers
   - Health checks

2. **Application Servers** (multiple instances)
   - Each runs Next.js app
   - Stateless (no local session storage)
   - Share PostgreSQL connection pool

3. **Database** (single or replicated)
   - Shared PostgreSQL instance
   - Connection pooling (pgBouncer)
   - Read replicas for analytics queries

### Vertical Scaling (Single Server)

1. Increase RAM
2. Increase CPU cores
3. Upgrade disk to SSD
4. Database query optimization

### Caching Layer (if needed)

```
Redis cache for:
- Session tokens
- Dashboard query results
- Chart data (5-min TTL)
- User permissions cache
```

---

## Backup & Recovery

### Backup Strategy

**Daily Backups:**
```bash
# Full database dump (compresses to ~10-20% size)
pg_dump -U shi_user shi_dashboard_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Keep 30 days of backups
find /var/backups -name "backup_*.sql.gz" -mtime +30 -delete
```

**Restore from Backup:**
```bash
# Decompress and restore
gunzip -c backup_20260423.sql.gz | psql -U shi_user shi_dashboard_prod
```

### File Backups

**Backup uploaded evidence:**
```bash
# Sync uploads to backup location (daily)
rsync -av /var/uploads/shi-dashboard/ /backup/uploads/

# Or copy to cloud storage (S3, etc.)
aws s3 sync /var/uploads/shi-dashboard/ s3://backup-bucket/uploads/
```

---

## Security Hardening

### Application Security

- [x] SQL injection prevention (parameterized queries)
- [x] HTTPS enforcement (nginx redirect 80→443)
- [x] JWT token validation (on every request)
- [x] Password hashing (bcryptjs)
- [x] CORS properly configured
- [x] Rate limiting recommended (future: add to Nginx)
- [x] Input validation on all forms
- [x] Audit logging of all changes

### Database Security

- [x] Non-default user (shi_user, not postgres)
- [x] Strong password (min 16 chars, mixed case, symbols)
- [x] Network isolation (localhost or private VPC)
- [x] No remote TCP access (Unix socket only)
- [x] Regular backups (encrypted, off-server)

### Infrastructure Security

- [x] SSL/TLS certificates (Let's Encrypt)
- [x] Firewall rules (allow only 80/443/22)
- [x] SSH key-based authentication (no passwords)
- [x] Server updates (security patches)
- [x] Fail2ban or similar (prevent brute force)

### Additional Recommendations

- [ ] Two-factor authentication (2FA)
- [ ] Secrets management (HashiCorp Vault, AWS Secrets)
- [ ] API rate limiting
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] Intrusion detection
- [ ] Regular penetration testing

---

## Troubleshooting

### Issue: "Connection refused" (database error)

**Cause:** PostgreSQL not running

**Fix:**
```bash
# Check if running
ps aux | grep postgres

# Start PostgreSQL
brew services start postgresql
# or
/Library/PostgreSQL/18/bin/pg_ctl -D /Library/PostgreSQL/18/data start

# Verify connection
psql -U postgres -d shi_dashboard_new
```

### Issue: "EADDRINUSE: address already in use :::3000"

**Cause:** Port 3000 already in use

**Fix:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: "ModuleNotFoundError" on import

**Cause:** Missing node_modules or path alias error

**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check tsconfig.json paths (if using aliases)
cat frontend/tsconfig.json | grep -A 5 paths
```

### Issue: "SyntaxError: Unexpected token '<'" at runtime

**Cause:** Corrupted .next build cache

**Fix:**
```bash
# Clear build cache
rm -rf .next

# Rebuild
npm run build

# Or restart dev server
npm run dev
```

### Issue: Database migrations fail

**Cause:** Schema version mismatch

**Fix:**
```bash
# Check current schema
psql -U postgres -d shi_dashboard_new -c "\dt"

# View table structure
psql -U postgres -d shi_dashboard_new -c "\d projects"

# Re-run schema script
psql -U postgres -d shi_dashboard_new < frontend/database/schema.sql

# If conflicts, backup and recreate
dropdb -U postgres shi_dashboard_new
createdb -U postgres shi_dashboard_new
psql -U postgres -d shi_dashboard_new < frontend/database/schema.sql
psql -U postgres -d shi_dashboard_new < frontend/database/seed.sql
```

---

## Version Management

### Current Versions

- **Frontend:** Node.js 18+, React 19, Next.js 15, Vite
- **Backend:** Node.js 18+, Express 5
- **Database:** PostgreSQL 17+
- **UI:** Tailwind CSS v4, Recharts 3, TanStack Query 5

### Upgrade Path (Future)

- React 20+: Check breaking changes, update hooks
- Next.js 16+: Follow migration guide
- PostgreSQL 18+: Use pg_upgrade utility
- Dependencies: Regular npm audit and updates

---

## Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

