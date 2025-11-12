#!/bin/bash

# Helper script to switch between HTTP-only and SSL-enabled nginx configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_DIR="$SCRIPT_DIR/nginx/conf.d"

show_help() {
    cat << EOF
Usage: ./switch-ssl.sh [enable|disable]

Switch between SSL-enabled and HTTP-only nginx configurations.

Commands:
  enable    Enable SSL (requires certificates to be present)
  disable   Disable SSL (use HTTP-only for initial setup)
  status    Show current SSL configuration status

Examples:
  ./switch-ssl.sh disable   # Switch to HTTP-only mode
  ./switch-ssl.sh enable    # Switch to SSL mode (after obtaining certs)
  ./switch-ssl.sh status    # Check current mode

Note: After switching, restart nginx with:
  docker compose restart nginx

EOF
}

check_ssl_enabled() {
    if grep -q "listen 443 ssl" "$CONF_DIR/backend.conf" 2>/dev/null; then
        echo "SSL is currently ENABLED"
        return 0
    else
        echo "SSL is currently DISABLED (HTTP-only)"
        return 1
    fi
}

disable_ssl() {
    echo "Disabling SSL (switching to HTTP-only)..."
    
    # Backup current configs if they have SSL
    if grep -q "listen 443 ssl" "$CONF_DIR/backend.conf" 2>/dev/null; then
        echo "Backing up SSL configs..."
        cp "$CONF_DIR/backend.conf" "$CONF_DIR/backend.conf.ssl"
        cp "$CONF_DIR/frontend.conf" "$CONF_DIR/frontend.conf.ssl"
        [ -f "$CONF_DIR/webv2.conf" ] && cp "$CONF_DIR/webv2.conf" "$CONF_DIR/webv2.conf.ssl"
    fi
    
    # Use HTTP-only configs
    if [ -f "$CONF_DIR/backend.conf.no-ssl" ]; then
        cp "$CONF_DIR/backend.conf.no-ssl" "$CONF_DIR/backend.conf"
        echo "✓ backend.conf switched to HTTP-only"
    else
        echo "✗ Error: backend.conf.no-ssl not found"
        exit 1
    fi
    
    if [ -f "$CONF_DIR/frontend.conf.no-ssl" ]; then
        cp "$CONF_DIR/frontend.conf.no-ssl" "$CONF_DIR/frontend.conf"
        echo "✓ frontend.conf switched to HTTP-only"
    else
        echo "✗ Error: frontend.conf.no-ssl not found"
        exit 1
    fi
    
    if [ -f "$CONF_DIR/webv2.conf.no-ssl" ]; then
        cp "$CONF_DIR/webv2.conf.no-ssl" "$CONF_DIR/webv2.conf"
        echo "✓ webv2.conf switched to HTTP-only"
    else
        echo "⚠ Warning: webv2.conf.no-ssl not found, skipping"
    fi
    
    echo ""
    echo "✓ SSL disabled successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Restart nginx: docker compose restart nginx"
    echo "  2. Test access: curl http://api.soulyousee.com/health"
    echo "  3. Test access: curl http://v2.soulyousee.com/health"
    echo ""
}

enable_ssl() {
    echo "Enabling SSL..."
    
    # Check if SSL certificate files exist
    if [ ! -f "./certbot/conf/live/api.soulyousee.com/fullchain.pem" ]; then
        echo "✗ Error: SSL certificates not found!"
        echo ""
        echo "Certificates required:"
        echo "  - ./certbot/conf/live/api.soulyousee.com/fullchain.pem"
        echo "  - ./certbot/conf/live/panel.soulyousee.com/fullchain.pem"
        echo "  - ./certbot/conf/live/v2.soulyousee.com/fullchain.pem"
        echo ""
        echo "Please obtain certificates first. See SSL_SETUP.md for instructions."
        echo ""
        echo "Quick start:"
        echo "  docker compose run --rm certbot certonly --webroot \\"
        echo "    --webroot-path=/var/www/certbot \\"
        echo "    --email your-email@example.com \\"
        echo "    --agree-tos --no-eff-email \\"
        echo "    -d api.soulyousee.com -d panel.soulyousee.com -d v2.soulyousee.com"
        echo ""
        exit 1
    fi
    
    # Restore SSL configs
    if [ -f "$CONF_DIR/backend.conf.ssl" ]; then
        cp "$CONF_DIR/backend.conf.ssl" "$CONF_DIR/backend.conf"
        echo "✓ backend.conf switched to SSL"
    else
        echo "⚠ Warning: backend.conf.ssl not found, keeping current config"
    fi
    
    if [ -f "$CONF_DIR/frontend.conf.ssl" ]; then
        cp "$CONF_DIR/frontend.conf.ssl" "$CONF_DIR/frontend.conf"
        echo "✓ frontend.conf switched to SSL"
    else
        echo "⚠ Warning: frontend.conf.ssl not found, keeping current config"
    fi
    
    if [ -f "$CONF_DIR/webv2.conf.ssl" ]; then
        cp "$CONF_DIR/webv2.conf.ssl" "$CONF_DIR/webv2.conf"
        echo "✓ webv2.conf switched to SSL"
    else
        echo "⚠ Warning: webv2.conf.ssl not found, keeping current config"
    fi
    
    echo ""
    echo "✓ SSL enabled successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Test nginx config: docker compose exec nginx nginx -t"
    echo "  2. Restart nginx: docker compose restart nginx"
    echo "  3. Test HTTPS: curl https://api.soulyousee.com/health"
    echo "  4. Test HTTPS: curl https://v2.soulyousee.com/health"
    echo ""
}

# Main script
cd "$SCRIPT_DIR"

case "${1:-}" in
    enable)
        enable_ssl
        ;;
    disable)
        disable_ssl
        ;;
    status)
        check_ssl_enabled
        ;;
    -h|--help|help)
        show_help
        ;;
    *)
        echo "Error: Invalid command '${1:-}'"
        echo ""
        show_help
        exit 1
        ;;
esac

