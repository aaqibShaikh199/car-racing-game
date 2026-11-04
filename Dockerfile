# =================================================================
# F1 Racing Car – container image
#
# Base image: the official *unprivileged* Nginx image on Alpine Linux.
#   - Small (Alpine is a tiny Linux distribution)
#   - Runs as a non-root user (uid 101) out of the box
#   - Listens on port 8080 (ports below 1024 need root)
#
# Pin a specific version for repeatable builds. Check Docker Hub
# (nginxinc/nginx-unprivileged) for the current stable tag.
# =================================================================
FROM nginxinc/nginx-unprivileged:1.28-alpine

LABEL org.opencontainers.image.title="f1-racing-car" \
      org.opencontainers.image.description="Animated F1 car built with HTML, CSS and JavaScript" \
      org.opencontainers.image.version="1.0.0"

# Copy only the website files. They stay owned by root and are
# read-only (0644), so the web server can serve them but never change them.
COPY --chmod=0644 index.html style.css script.js /usr/share/nginx/html/

# Document the port the container listens on
EXPOSE 8080

# Run as the unprivileged nginx user (numeric id lets Kubernetes
# verify that the container is not running as root)
USER 101

# Docker checks that the site still answers (Kubernetes uses its own
# probes from deployment.yaml instead)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

# The base image already starts Nginx in the foreground; no CMD needed.
