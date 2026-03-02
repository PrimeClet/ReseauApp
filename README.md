# ReseauApp - Application de Gestion d'Infrastructure Réseau

Application web de gestion d'infrastructure réseau permettant de cartographier, suivre et maintenir les équipements réseau d'une organisation.

---

## Fonctionnalités

### 1. Gestion des Infrastructures

#### Sites et Zones
- Création et gestion des sites géographiques
- Organisation en zones au sein de chaque site

#### Bâtiments et Salles
- Gestion des bâtiments par zone
- Organisation des salles techniques par bâtiment

#### Baies / Coffrets (Armoires)
- Inventaire des baies de brassage
- Localisation précise (bâtiment, salle)
- Capacité et état de remplissage

### 2. Gestion des Équipements

#### Types d'équipements supportés
- Switches
- Routeurs
- Serveurs
- Onduleurs (UPS)
- Climatisations
- Autres équipements réseau

#### Informations par équipement
- Nom et code unique
- Type et modèle
- Fabricant et numéro de série
- Adresse IP
- Baie d'appartenance
- État (actif, maintenance, hors service)

### 3. Gestion des Ports

- Inventaire des ports par équipement
- État des ports (actif, inactif, réservé)
- Configuration VLAN
- Connexions et liaisons entre ports
- Support PoE (Power over Ethernet)

### 4. Cartographie Réseau

- Visualisation de l'infrastructure
- Navigation hiérarchique (Site → Zone → Bâtiment → Salle → Baie)
- Export des cartographies

### 5. Système de Maintenance

#### Création de maintenances
- Sélection de l'équipement concerné
- Actions disponibles selon le type d'équipement :
  - **Switch** : Vérification des ports, Mise à jour firmware, Nettoyage, Configuration
  - **Routeur** : Vérification des connexions, Mise à jour firmware, Diagnostic
  - **Serveur** : Vérification des disques, Mise à jour OS, Sauvegarde
  - **Onduleur** : Test de batterie, Remplacement batterie
  - **Climatisation** : Nettoyage des filtres, Vérification du gaz

#### Workflow de maintenance
1. L'administrateur crée une maintenance
2. Assignation à un technicien
3. Planification (date, heure, durée estimée)
4. Définition de la priorité (basse, moyenne, haute, critique)
5. Le technicien exécute et rapporte

#### Suivi des maintenances
- Statuts : Planifiée, En cours, Terminée, Annulée
- Historique complet des interventions

### 6. Système de Demandes de Modification

#### Soumission de modifications
- Le technicien scanne le QR code de l'équipement
- Soumet une demande de modification avec :
  - Type de modification
  - Description de l'intervention
  - Photos avant/après
  - Raison de la modification

#### Workflow de validation
1. Le technicien soumet la demande
2. L'administrateur reçoit la demande
3. Options de l'administrateur :
   - **Approuver** : La modification est validée
   - **Rejeter** : Avec motif obligatoire
   - **Demander plus d'infos** : Mise en révision

#### Types de modifications
- Ajout d'un port
- Ajout d'un équipement
- Modification d'une connexion
- Suppression d'un port
- Suppression d'un équipement
- Changement de statut d'un port

### 7. Tableau de Bord

- Vue d'ensemble de l'infrastructure
- Statistiques clés
- Alertes et notifications
- Maintenances en cours
- Modifications en attente

### 8. Gestion des Utilisateurs

#### Rôles disponibles

| Rôle | Accès |
|------|-------|
| **Super Admin** | Accès total, configuration système |
| **Administrateur** | Gestion complète, validation des modifications |
| **Technicien** | Exécution des maintenances, soumission des modifications |
| **Observateur** | Consultation uniquement (lecture seule) |

#### Permissions par module
- Utilisateurs : voir, créer, modifier, supprimer
- Équipements : voir, créer, modifier, supprimer, importer
- Ports : voir, créer, modifier, supprimer, restaurer
- Maintenance : voir, créer, assigner, exécuter, rapporter
- Modifications : voir, créer, valider, historique
- Cartographie : voir, exporter
- Dashboard : voir, statistiques

### 9. Import/Export de Données

- Import CSV pour les équipements
- Export des données en CSV
- Modèles d'import téléchargeables

---

## Architecture Technique

### Backend
- **Framework** : Laravel 11
- **Base de données** : MySQL
- **Authentification** : Laravel Sanctum
- **Gestion des rôles** : Spatie Permission
- **API** : RESTful JSON

### Frontend
- **Framework** : React 18 avec TypeScript
- **UI** : Tailwind CSS + shadcn/ui
- **State Management** : Redux Toolkit + Redux Persist
- **Requêtes API** : TanStack Query (React Query)
- **Routing** : React Router v6
- **Build** : Vite

---

## Installation

### Prérequis
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+

### Backend

```bash
cd reseau_api

# Installer les dépendances
composer install

# Configurer l'environnement
cp .env.example .env
php artisan key:generate

# Configurer la base de données dans .env
# DB_DATABASE=reseau_db
# DB_USERNAME=root
# DB_PASSWORD=

# Exécuter les migrations et seeders
php artisan migrate --seed

# Lancer le serveur
php artisan serve
```

### Frontend

```bash
cd reseau_front

# Installer les dépendances
npm install

# Configurer l'API URL dans .env
# VITE_API_URL=http://localhost:8000/api

# Lancer le serveur de développement
npm run dev
```

---

## Utilisateurs par Défaut

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| superadmin@reseau.local | SuperAdmin@2024 | Super Admin |
| jean.directeur@reseau.local | Admin@2024 | Administrateur |
| paul.technicien@reseau.local | Tech@2024 | Technicien |
| alice.observatrice@reseau.local | Obs@2024 | Observateur |

---

## Structure du Projet

```
ReseauApp/
├── reseau_api/                 # Backend Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # Contrôleurs API
│   │   │   └── Middleware/     # Middlewares (auth, rôles)
│   │   └── Models/             # Modèles Eloquent
│   ├── database/
│   │   ├── migrations/         # Migrations BDD
│   │   └── seeders/            # Données de test
│   └── routes/
│       └── api.php             # Routes API
│
└── reseau_front/               # Frontend React
    ├── src/
    │   ├── components/         # Composants réutilisables
    │   │   ├── layout/         # AppShell, Sidebar, Header
    │   │   ├── ui/             # Composants shadcn/ui
    │   │   └── forms/          # Formulaires
    │   ├── contexts/           # Contextes React (Auth, Data)
    │   ├── pages/              # Pages de l'application
    │   ├── services/           # Services API
    │   └── store/              # Redux store
    └── public/                 # Assets statiques
```

---

## API Endpoints Principaux

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Ressources
- `GET/POST /api/equipements` - Liste/Création équipements
- `GET/POST /api/ports` - Liste/Création ports
- `GET/POST /api/coffrets` - Liste/Création baies
- `GET/POST /api/batiments` - Liste/Création bâtiments

### Maintenances
- `GET/POST /api/maintenances` - Liste/Création maintenances
- `PUT /api/maintenances/{id}` - Mise à jour
- `DELETE /api/maintenances/{id}` - Suppression

### Modifications
- `GET /api/modifications` - Liste des modifications
- `GET /api/modifications/pending` - Modifications en attente
- `POST /api/modifications/{id}/approve` - Approuver
- `POST /api/modifications/{id}/reject` - Rejeter

---

## Licence

Projet propriétaire - Tous droits réservés
