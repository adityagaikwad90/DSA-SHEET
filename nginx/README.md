# Nginx Host Reverse Proxy Setup for solvespace.online

This configuration is for the **Host Nginx** on your AWS EC2 instance (Amazon Linux 2023) acting as a reverse proxy in front of your Docker container.

## Architecture

- **Domain**: `solvespace.online` / `www.solvespace.online`
- **Host Nginx**: Listens on port `80` (HTTP)
- **Docker Container**: `dsa-sheet-app` mapped to `127.0.0.1:3000 -> 80`

---

## Deployment on EC2

### 1. Copy Configuration to Nginx
```bash
sudo cp nginx/solvespace.conf /etc/nginx/conf.d/solvespace.conf
```
*(Alternatively, create a symlink: `sudo ln -s $(pwd)/nginx/solvespace.conf /etc/nginx/conf.d/solvespace.conf`)*

### 2. Test Configuration
```bash
sudo nginx -t
```

### 3. Reload Nginx
```bash
sudo systemctl reload nginx
```

### 4. Verify Traffic
```bash
# Test internal Docker container
curl -I http://127.0.0.1:3000

# Test host Nginx reverse proxy routing
curl -I -H "Host: solvespace.online" http://127.0.0.1

# Test public domain
curl -I http://solvespace.online
```
