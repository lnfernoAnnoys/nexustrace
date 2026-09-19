#!/usr/bin/env bash
# Pull the latest code from GitHub, rebuild, and restart the site:
#
#   bash deploy/update.sh
#
# Accounts and uploaded documents (server/data/) are not touched.
set -euo pipefail

cd "$(dirname "$0")/.."
git pull --ff-only
npm ci
npm run build
sudo systemctl restart nexustrace
sleep 2
sudo systemctl --no-pager --lines=5 status nexustrace
