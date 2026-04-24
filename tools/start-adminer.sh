#!/bin/bash
# ============================================
# Adminer - Database Manager for PostgreSQL
# ============================================
# Akses di browser: http://localhost:8080
#
# Login details:
#   System:   PostgreSQL
#   Server:   127.0.0.1:5432
#   Username: postgres
#   Password: 12345
#   Database: shi_dashboard_new
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8080

echo "=================================="
echo "  Adminer - Database Manager"
echo "=================================="
echo ""
echo "  URL:      http://localhost:$PORT"
echo "  System:   PostgreSQL"
echo "  Server:   127.0.0.1:5432"  
echo "  Username: postgres"
echo "  Password: 12345"
echo "  Database: shi_dashboard_new"
echo ""
echo "  Tekan Ctrl+C untuk stop"
echo "=================================="
echo ""

# Open browser automatically
(sleep 1 && open "http://localhost:$PORT") &

php -S localhost:$PORT -t "$SCRIPT_DIR" 2>&1
