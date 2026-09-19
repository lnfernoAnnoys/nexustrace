#!/usr/bin/env bash
# One-time setup of an Ubuntu 24.04 server for NexusTrace. Run it from the project folder:
#
#   sudo bash deploy/setup-server.sh yourdomain.me
#
# It installs Node 22 and Caddy (which gets a free HTTPS certificate by itself), builds the site,
# and starts it as a service that restarts on crashes and on reboot. Safe to run again.
set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: sudo bash deploy/setup-server.sh yourdomain.me"
  exit 1
fi
if [ "$(id -u)" -ne 0 ] || [ -z "${SUDO_USER:-}" ] || [ "$SUDO_USER" = "root" ]; then
  echo "Run this with sudo from your normal login (not as root):  sudo bash deploy/setup-server.sh $DOMAIN"
  exit 1
fi

APP_USER="$SUDO_USER"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export DEBIAN_FRONTEND=noninteractive

echo "==> Swap space (small servers run out of memory while building)"
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> System packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git build-essential python3 \
  debian-keyring debian-archive-keyring apt-transport-https

echo "==> Node.js 22"
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/^v//; s/\..*//' || true)"
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> Caddy (web server with automatic HTTPS)"
if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "==> Settings file /etc/nexustrace.env"
if [ ! -f /etc/nexustrace.env ]; then
  cp "$APP_DIR/deploy/nexustrace.env.example" /etc/nexustrace.env
  chmod 600 /etc/nexustrace.env
fi

echo "==> Installing dependencies and building the website (a few minutes)"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci && npm run build"

echo "==> Service"
sed -e "s|__USER__|$APP_USER|g" -e "s|__APP_DIR__|$APP_DIR|g" "$APP_DIR/deploy/nexustrace.service" > /etc/systemd/system/nexustrace.service
systemctl daemon-reload
systemctl enable nexustrace
systemctl restart nexustrace

echo "==> Caddy for $DOMAIN"
sed -e "s|__DOMAIN__|$DOMAIN|g" "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy

sleep 3
echo
systemctl --no-pager --lines=8 status nexustrace || true
echo
echo "Done. Next:"
echo "  1. Create the first administrator:"
echo "       cd $APP_DIR && npm run user -- create head.dept 'a-long-password' --name 'Head of Department' --admin --level 8"
echo "  2. Open https://$DOMAIN/  (investigators)  and  https://$DOMAIN/admin/  (admin console)."
echo "     If the page doesn't load yet, the domain may still be pointing at the wrong place: see DEPLOY.md."
