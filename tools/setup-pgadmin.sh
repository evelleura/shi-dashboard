#!/bin/bash
# ============================================
# pgAdmin 4 - Auto Import Server Config
# ============================================
# Run this ONCE to add the SHI database to pgAdmin
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create server config
cat > /tmp/pgadmin_servers.json << 'JSON'
{
  "Servers": {
    "1": {
      "Name": "SHI Dashboard (Local)",
      "Group": "Servers",
      "Host": "127.0.0.1",
      "Port": 5432,
      "MaintenanceDB": "shi_dashboard_new",
      "Username": "postgres",
      "SSLMode": "prefer",
      "Comment": "PT Smart Home Inovasi - Dashboard Database"
    }
  }
}
JSON

echo "=================================="
echo "  pgAdmin 4 Server Setup"
echo "=================================="
echo ""
echo "Server config saved to /tmp/pgadmin_servers.json"
echo ""
echo "CARA IMPORT DI pgAdmin:"
echo "  1. Buka pgAdmin 4 (sudah terbuka)"
echo "  2. Klik menu: Tools > Import/Export Servers"
echo "  3. Pilih file: /tmp/pgadmin_servers.json"
echo "  4. Klik Next > Finish"
echo "  5. Server 'SHI Dashboard (Local)' akan muncul"
echo ""
echo "ATAU MANUAL:"
echo "  1. Klik kanan 'Servers' > Register > Server"
echo "  2. Tab General:"
echo "     Name: SHI Dashboard"
echo "  3. Tab Connection:"
echo "     Host:     127.0.0.1"
echo "     Port:     5432"
echo "     Database: shi_dashboard_new"
echo "     Username: postgres"
echo "     Password: 12345"
echo "  4. Klik Save"
echo ""
echo "=================================="
