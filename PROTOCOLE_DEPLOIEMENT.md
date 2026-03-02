# Protocole de Deploiement - ReseauApp

## Informations du Projet

| Composant | Technologie |
|-----------|-------------|
| **Backend** | Laravel 11 / PHP 8.2+ |
| **Frontend** | React 18 + TypeScript / Vite 5 |
| **Base de donnees** | MySQL 8.0+ |
| **Authentification** | Laravel Sanctum (tokens API) |
| **Autorisation** | Spatie Permission v6 (RBAC) |
| **PWA** | vite-plugin-pwa (Service Worker) |

---

## Pre-requis Communs

### Backend (reseau_api)
- PHP >= 8.2 avec extensions : `mbstring`, `xml`, `curl`, `mysql`, `zip`, `bcmath`, `gd`, `fileinfo`, `openssl`, `tokenizer`
- Composer >= 2.x
- MySQL >= 8.0 ou MariaDB >= 10.6
- Acces en ecriture sur `storage/` et `bootstrap/cache/`

### Frontend (reseau_front)
- Node.js >= 18.x
- npm >= 9.x

### Reseau
- Nom de domaine configure (DNS A records)
- Certificat SSL (Let's Encrypt ou autre)
- Ports 80/443 ouverts

---

## 1. Deploiement sur VPS (Ubuntu 22.04 / Debian 12)

### 1.1 Preparation du Serveur

```bash
# Mise a jour du systeme
sudo apt update && sudo apt upgrade -y

# Installation des dependances systeme
sudo apt install -y software-properties-common curl git unzip

# Installation de PHP 8.2
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-mysql php8.2-xml \
  php8.2-mbstring php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd \
  php8.2-fileinfo php8.2-tokenizer php8.2-intl

# Installation de Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Installation de MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Installation de Nginx
sudo apt install -y nginx

# Installation de Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 1.2 Configuration de la Base de Donnees

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE reseau_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'reseau_user'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise';
GRANT ALL PRIVILEGES ON reseau_app.* TO 'reseau_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.3 Deploiement du Backend (API Laravel)

```bash
# Creer le repertoire
sudo mkdir -p /var/www/reseau-api
sudo chown -R $USER:$USER /var/www/reseau-api

# Cloner le projet
cd /var/www/reseau-api
git clone <URL_DU_REPO> .
cd reseau_api

# Installer les dependances PHP (production)
composer install --no-dev --optimize-autoloader

# Configurer l'environnement
cp .env.example .env
```

**Editer `/var/www/reseau-api/reseau_api/.env` :**

```env
APP_NAME="ReseauApp"
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Africa/Douala
APP_URL=https://reseau-api.votre-domaine.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reseau_app
DB_USERNAME=reseau_user
DB_PASSWORD=VotreMotDePasseSecurise

SANCTUM_STATEFUL_DOMAINS=reseau.votre-domaine.com
SESSION_DOMAIN=.votre-domaine.com

FRONTEND_URL=https://reseau.votre-domaine.com

MAIL_MAILER=smtp
MAIL_HOST=smtp.votre-fournisseur.com
MAIL_PORT=465
MAIL_USERNAME=noreply@votre-domaine.com
MAIL_PASSWORD=MotDePasseEmail
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@votre-domaine.com
MAIL_FROM_NAME="ReseauApp"
```

```bash
# Generer la cle d'application
php artisan key:generate

# Executer les migrations
php artisan migrate --force

# Executer les seeders (premiere installation uniquement)
php artisan db:seed --force

# Optimiser pour la production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Creer le lien symbolique pour le stockage
php artisan storage:link

# Permissions des fichiers
sudo chown -R www-data:www-data /var/www/reseau-api/reseau_api/storage
sudo chown -R www-data:www-data /var/www/reseau-api/reseau_api/bootstrap/cache
sudo chmod -R 775 /var/www/reseau-api/reseau_api/storage
sudo chmod -R 775 /var/www/reseau-api/reseau_api/bootstrap/cache
```

### 1.4 Deploiement du Frontend (React/Vite)

```bash
cd /var/www/reseau-api/reseau_front

# Configurer l'environnement de production
echo "VITE_API_URL=https://reseau-api.votre-domaine.com/api" > .env.production

# Installer les dependances et construire
npm ci
npm run build

# Le build genere un dossier dist/ contenant les fichiers statiques
sudo mkdir -p /var/www/reseau-front
sudo cp -r dist/* /var/www/reseau-front/
sudo chown -R www-data:www-data /var/www/reseau-front
```

### 1.5 Configuration Nginx

**API Backend** - `/etc/nginx/sites-available/reseau-api` :

```nginx
server {
    listen 80;
    server_name reseau-api.votre-domaine.com;
    root /var/www/reseau-api/reseau_api/public;

    index index.php;

    charset utf-8;
    client_max_body_size 50M;

    # Securite
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**Frontend** - `/etc/nginx/sites-available/reseau-front` :

```nginx
server {
    listen 80;
    server_name reseau.votre-domaine.com;
    root /var/www/reseau-front;

    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    # Cache des assets statiques
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (ne pas cacher)
    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Manifest PWA
    location /manifest.webmanifest {
        expires 1d;
        add_header Cache-Control "public";
    }

    # SPA - rediriger toutes les routes vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Securite
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

```bash
# Activer les sites
sudo ln -s /etc/nginx/sites-available/reseau-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/reseau-front /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Installer le certificat SSL
sudo certbot --nginx -d reseau-api.votre-domaine.com -d reseau.votre-domaine.com
```

### 1.6 Configuration PHP-FPM (Optimisation)

Editer `/etc/php/8.2/fpm/pool.d/www.conf` :

```ini
pm = dynamic
pm.max_children = 20
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500

; Limites de memoire et upload
php_admin_value[memory_limit] = 256M
php_admin_value[upload_max_filesize] = 50M
php_admin_value[post_max_size] = 50M
php_admin_value[max_execution_time] = 300
```

```bash
sudo systemctl restart php8.2-fpm
```

---

## 2. Deploiement avec Docker / Docker Compose

### 2.1 Dockerfile Backend

Creer `reseau_api/Dockerfile` :

```dockerfile
FROM php:8.2-fpm-alpine

# Extensions PHP
RUN apk add --no-cache \
    libpng-dev libjpeg-turbo-dev freetype-dev \
    libzip-dev icu-dev oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring xml zip bcmath gd intl opcache

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependances d'abord (cache Docker)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Code source
COPY . .
RUN composer dump-autoload --optimize

# Permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Configuration PHP production
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/php.ini "$PHP_INI_DIR/conf.d/custom.ini"

EXPOSE 9000
CMD ["php-fpm"]
```

### 2.2 Dockerfile Frontend

Creer `reseau_front/Dockerfile` :

```dockerfile
# Etape 1 : Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etape 2 : Serveur Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Docker Compose

Creer `docker-compose.yml` a la racine :

```yaml
version: "3.8"

services:
  # --- Base de donnees ---
  mysql:
    image: mysql:8.0
    container_name: reseau-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: reseau_app
      MYSQL_USER: reseau_user
      MYSQL_PASSWORD: ${DB_PASSWORD:-securepassword}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - reseau-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # --- Backend API ---
  api:
    build:
      context: ./reseau_api
      dockerfile: Dockerfile
    container_name: reseau-api
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: reseau_app
      DB_USERNAME: reseau_user
      DB_PASSWORD: ${DB_PASSWORD:-securepassword}
    volumes:
      - api_storage:/var/www/html/storage/app/public
    networks:
      - reseau-network

  # --- Nginx pour l'API ---
  api-nginx:
    image: nginx:alpine
    container_name: reseau-api-nginx
    restart: unless-stopped
    depends_on:
      - api
    volumes:
      - ./reseau_api/public:/var/www/html/public:ro
      - ./docker/api-nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8001:80"
    networks:
      - reseau-network

  # --- Frontend ---
  frontend:
    build:
      context: ./reseau_front
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-https://reseau-api.votre-domaine.com/api}
    container_name: reseau-front
    restart: unless-stopped
    ports:
      - "8080:80"
    networks:
      - reseau-network

volumes:
  mysql_data:
  api_storage:

networks:
  reseau-network:
    driver: bridge
```

### 2.4 Fichier d'environnement Docker

Creer `.env.docker` a la racine :

```env
# Base de donnees
DB_ROOT_PASSWORD=MotDePasseRootSecurise2024
DB_PASSWORD=MotDePasseAppSecurise2024

# Frontend
VITE_API_URL=https://reseau-api.votre-domaine.com/api
```

### 2.5 Lancement Docker

```bash
# Copier l'env
cp .env.docker .env

# Construire et lancer
docker compose up -d --build

# Premiere installation : migrations et seeders
docker compose exec api php artisan key:generate
docker compose exec api php artisan migrate --force
docker compose exec api php artisan db:seed --force
docker compose exec api php artisan storage:link

# Optimisation cache Laravel
docker compose exec api php artisan config:cache
docker compose exec api php artisan route:cache
docker compose exec api php artisan view:cache
```

---

## 3. Deploiement sur Hebergement Mutualise (cPanel / Hostinger)

### 3.1 Pre-requis Hebergement

- PHP 8.2+ avec acces SSH
- MySQL 8.0+
- Support SSL (Let's Encrypt inclus)
- Acces a Composer via SSH ou pre-installe
- Gestionnaire de fichiers ou acces FTP/SFTP

### 3.2 Structure des Sous-Domaines

| Sous-domaine | Cible | Repertoire |
|---|---|---|
| `reseau.votre-domaine.com` | Frontend | `public_html/reseau_front/` |
| `reseau-api.votre-domaine.com` | API Backend | `public_html/reseau_api/public/` |

### 3.3 Deploiement du Backend

```bash
# Se connecter en SSH
ssh utilisateur@votre-serveur.com

# Naviguer vers le repertoire
cd ~/public_html

# Cloner le projet (ou uploader via FTP)
git clone <URL_DU_REPO> temp_repo
mv temp_repo/reseau_api ./reseau_api
rm -rf temp_repo

cd reseau_api

# Installer les dependances
composer install --no-dev --optimize-autoloader

# Configurer l'environnement
cp .env.example .env
nano .env  # Editer avec les informations du serveur
```

**Configuration `.env` pour hebergement mutualise :**

```env
APP_NAME="ReseauApp"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://reseau-api.votre-domaine.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=votre_base_cpanel
DB_USERNAME=votre_user_cpanel
DB_PASSWORD=votre_mdp_cpanel

FRONTEND_URL=https://reseau.votre-domaine.com
```

```bash
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Important sur cPanel :** Le sous-domaine doit pointer vers `reseau_api/public/` comme Document Root.

### 3.4 Deploiement du Frontend

Le frontend est un build statique. Il faut construire localement puis uploader :

```bash
# Sur votre machine locale
cd reseau_front

# Creer le fichier d'env production
echo "VITE_API_URL=https://reseau-api.votre-domaine.com/api" > .env.production

# Construire
npm ci
npm run build

# Uploader le contenu du dossier dist/ vers le serveur
# Via SCP :
scp -r dist/* utilisateur@serveur:~/public_html/reseau_front/

# Ou via rsync :
rsync -avz dist/ utilisateur@serveur:~/public_html/reseau_front/
```

### 3.5 Configuration .htaccess (Apache)

Si l'hebergement utilise Apache, creer un `.htaccess` dans le dossier du frontend :

**`public_html/reseau_front/.htaccess` :**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Redirection HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # SPA routing - rediriger vers index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>

# Cache des assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Compression Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>
```

**`reseau_api/public/.htaccess`** est deja fourni par Laravel.

---

## 4. Deploiement sur Cloud AWS

### 4.1 Architecture Recommandee

```
Internet
   |
   v
[Route 53 - DNS]
   |
   +-- reseau.domaine.com ----> [CloudFront CDN] ----> [S3 Bucket - Frontend]
   |
   +-- reseau-api.domaine.com -> [ALB] ----> [EC2 / ECS - API Laravel]
                                                  |
                                              [RDS MySQL]
```

### 4.2 Option A : EC2 (Similaire VPS)

Suivre le protocole VPS (Section 1) sur une instance EC2 :

```
Instance recommandee : t3.small (2 vCPU, 2 Go RAM) minimum
AMI : Ubuntu 22.04 LTS
Stockage : 30 Go gp3
Security Group :
  - Port 22 (SSH) - votre IP uniquement
  - Port 80 (HTTP) - 0.0.0.0/0
  - Port 443 (HTTPS) - 0.0.0.0/0
```

### 4.3 Option B : Frontend sur S3 + CloudFront

```bash
# Construire le frontend
cd reseau_front
npm ci && npm run build

# Creer le bucket S3
aws s3 mb s3://reseau-front-prod

# Configurer pour hebergement statique
aws s3 website s3://reseau-front-prod \
  --index-document index.html \
  --error-document index.html

# Uploader le build
aws s3 sync dist/ s3://reseau-front-prod/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "sw.js" \
  --exclude "manifest.webmanifest"

# index.html et service worker sans cache
aws s3 cp dist/index.html s3://reseau-front-prod/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

aws s3 cp dist/sw.js s3://reseau-front-prod/sw.js \
  --cache-control "no-cache, no-store, must-revalidate"
```

Creer une distribution CloudFront pointant vers le bucket S3 avec :
- Certificate ACM pour le domaine
- Default root object : `index.html`
- Custom error response : 403/404 -> `/index.html` (SPA routing)
- Compression activee

### 4.4 Option C : Backend sur RDS + ECS

```bash
# Creer la base de donnees RDS
aws rds create-db-instance \
  --db-instance-identifier reseau-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0 \
  --master-username reseau_admin \
  --master-user-password VotreMotDePasse \
  --allocated-storage 20

# Deployer via ECS avec le Dockerfile de la section 2
# Utiliser ECR pour stocker l'image Docker
aws ecr create-repository --repository-name reseau-api
docker tag reseau-api:latest <account>.dkr.ecr.<region>.amazonaws.com/reseau-api:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/reseau-api:latest
```

---

## 5. Deploiement sur DigitalOcean

### 5.1 Option A : Droplet (Similaire VPS)

```
Droplet recommande : Basic - 2 vCPU, 2 Go RAM, 50 Go SSD
Region : Frankfurt (EU) ou selon localisation
Image : Ubuntu 22.04 LTS
```

Suivre le protocole VPS de la Section 1.

### 5.2 Option B : App Platform (PaaS)

Creer un fichier `.do/app.yaml` :

```yaml
name: reseau-app
region: fra

services:
  # Backend API
  - name: reseau-api
    github:
      repo: votre-org/reseau-app
      branch: main
      deploy_on_push: true
    source_dir: reseau_api
    dockerfile_path: reseau_api/Dockerfile
    http_port: 9000
    instance_count: 1
    instance_size_slug: basic-s
    routes:
      - path: /api
    envs:
      - key: APP_ENV
        value: production
      - key: APP_DEBUG
        value: "false"
      - key: DB_CONNECTION
        value: mysql
      - key: DB_HOST
        value: ${db.HOSTNAME}
      - key: DB_PORT
        value: ${db.PORT}
      - key: DB_DATABASE
        value: ${db.DATABASE}
      - key: DB_USERNAME
        value: ${db.USERNAME}
      - key: DB_PASSWORD
        value: ${db.PASSWORD}

  # Frontend
  - name: reseau-front
    github:
      repo: votre-org/reseau-app
      branch: main
      deploy_on_push: true
    source_dir: reseau_front
    build_command: npm ci && npm run build
    environment_slug: node-js
    routes:
      - path: /

databases:
  - name: db
    engine: MYSQL
    version: "8"
    size: db-s-1vcpu-1gb
    num_nodes: 1
```

---

## 6. Deploiement sur Serveur Dedie (Bare Metal)

### 6.1 Configuration Systeme

```bash
# CentOS / Rocky Linux / AlmaLinux
sudo dnf install -y epel-release
sudo dnf install -y https://rpms.remirepo.net/enterprise/remi-release-9.rpm
sudo dnf module enable php:remi-8.2 -y
sudo dnf install -y php php-fpm php-mysqlnd php-mbstring php-xml php-curl \
  php-zip php-bcmath php-gd php-intl php-opcache

# Nginx
sudo dnf install -y nginx

# MySQL
sudo dnf install -y mysql-server
sudo systemctl enable --now mysqld

# Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# SELinux (si actif)
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_can_network_connect_db 1
```

Ensuite, suivre les etapes de configuration Nginx, Laravel et React de la Section 1.

### 6.2 Optimisation PHP OPcache

Editer `/etc/php/8.2/fpm/conf.d/10-opcache.ini` :

```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.save_comments=1
opcache.fast_shutdown=1
```

---

## 7. Configuration CORS (Toutes Plateformes)

Dans `reseau_api/config/cors.php`, verifier :

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:8080'),
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## 8. Securisation (Toutes Plateformes)

### 8.1 Checklist de Securite

```
[ ] APP_DEBUG=false en production
[ ] APP_ENV=production
[ ] Cle APP_KEY unique generee
[ ] HTTPS force sur les deux domaines
[ ] CORS configure avec les domaines exacts
[ ] Fichier .env non accessible publiquement
[ ] Dossier storage/ non accessible publiquement
[ ] Firewall configure (ports 80, 443 uniquement)
[ ] Mots de passe MySQL forts
[ ] Utilisateur MySQL dedie (pas root)
[ ] Mises a jour de securite regulieres
[ ] Sauvegardes automatisees
[ ] Logs monitores
```

### 8.2 Headers de Securite Nginx

Ajouter dans chaque bloc `server` :

```nginx
# Headers de securite
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

---

## 9. Sauvegardes Automatisees

### 9.1 Script de Sauvegarde

Creer `/opt/scripts/backup-reseau.sh` :

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/reseau"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Sauvegarde base de donnees
mysqldump -u reseau_user -p'VotreMotDePasse' reseau_app \
  --single-transaction --routines --triggers \
  | gzip > "$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"

# Sauvegarde fichiers uploades
tar -czf "$BACKUP_DIR/storage_${TIMESTAMP}.tar.gz" \
  /var/www/reseau-api/reseau_api/storage/app/public/

# Sauvegarde .env
cp /var/www/reseau-api/reseau_api/.env "$BACKUP_DIR/env_${TIMESTAMP}.bak"

# Rotation : supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Sauvegarde terminee : $TIMESTAMP"
```

### 9.2 Cron de Sauvegarde

```bash
sudo chmod +x /opt/scripts/backup-reseau.sh

# Ajouter au cron (tous les jours a 2h du matin)
sudo crontab -e
# Ajouter :
0 2 * * * /opt/scripts/backup-reseau.sh >> /var/log/reseau-backup.log 2>&1
```

---

## 10. Mise a Jour (CI/CD Manuel)

### 10.1 Script de Deploiement

Creer `/opt/scripts/deploy-reseau.sh` :

```bash
#!/bin/bash
set -e

echo "=== Deploiement ReseauApp ==="
echo "Date : $(date)"

# Variables
API_DIR="/var/www/reseau-api"
FRONT_DIR="/var/www/reseau-front"
REPO_DIR="/var/www/reseau-api"
BRANCH="main"

cd $REPO_DIR

# Recuperer les derniers changements
echo "[1/7] Pull des modifications..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Backend
echo "[2/7] Mise a jour des dependances PHP..."
cd $REPO_DIR/reseau_api
composer install --no-dev --optimize-autoloader --no-interaction

echo "[3/7] Migrations..."
php artisan migrate --force

echo "[4/7] Optimisation cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Frontend
echo "[5/7] Build du frontend..."
cd $REPO_DIR/reseau_front
npm ci
npm run build

echo "[6/7] Deploiement du frontend..."
rm -rf $FRONT_DIR/*
cp -r dist/* $FRONT_DIR/

# Redemarrage des services
echo "[7/7] Redemarrage des services..."
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx

echo "=== Deploiement termine avec succes ==="
```

```bash
sudo chmod +x /opt/scripts/deploy-reseau.sh
```

---

## 11. Monitoring et Logs

### 11.1 Verification de Sante

```bash
# Verifier le statut de l'API
curl -s https://reseau-api.votre-domaine.com/api/ | jq .

# Verifier les logs Laravel
tail -f /var/www/reseau-api/reseau_api/storage/logs/laravel.log

# Verifier les logs Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Verifier les services
systemctl status php8.2-fpm
systemctl status nginx
systemctl status mysql
```

### 11.2 Supervision avec un Cron de Healthcheck

```bash
# Ajouter au cron (toutes les 5 minutes)
*/5 * * * * curl -sf https://reseau-api.votre-domaine.com/api/ > /dev/null || echo "API DOWN" | mail -s "Alerte ReseauApp" admin@votre-domaine.com
```

---

## Resume Comparatif

| Critere | VPS | Docker | Mutualise | AWS | DigitalOcean |
|---------|-----|--------|-----------|-----|--------------|
| **Cout mensuel** | 5-20 EUR | 5-20 EUR | 3-10 EUR | 15-50 USD | 10-30 USD |
| **Difficulte** | Moyenne | Moyenne | Facile | Elevee | Facile-Moyenne |
| **Scalabilite** | Limitee | Bonne | Tres limitee | Excellente | Bonne |
| **Maintenance** | Manuelle | Simplifiee | Minimale | Variable | Variable |
| **Performance** | Bonne | Bonne | Variable | Excellente | Bonne |
| **SSL** | Certbot | Certbot/Traefik | Inclus | ACM (gratuit) | Inclus |
| **Sauvegardes** | Manuelles | Manuelles | Souvent incluses | Automatisees | Snapshots |
| **Recommande pour** | PME | DevOps | Prototype/MVP | Entreprise | Startups/PME |
