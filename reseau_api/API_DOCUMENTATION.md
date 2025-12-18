# Documentation API - Réseau Inventaire App

**Version:** 1.0.0
**Base URL:** `https://reseau-api.jobs-conseil.host/api`
**Authentification:** Laravel Sanctum (Bearer Token)

---

## Table des matières

1. [Authentification](#1-authentification)
2. [Statistiques](#2-statistiques)
3. [Coffrets (Armoires)](#3-coffrets-armoires)
4. [Équipements](#4-équipements)
5. [Ports](#5-ports)
6. [Liaisons](#6-liaisons)
7. [LANs](#7-lans)
8. [Bâtiments](#8-bâtiments)
9. [Salles](#9-salles)
10. [Systèmes](#10-systèmes)
11. [Métriques](#11-métriques)
12. [Maintenances](#12-maintenances)
13. [Cartographie](#13-cartographie)
14. [Import CSV](#14-import-csv)
15. [Codes d'erreur](#15-codes-derreur)

---

## Permissions et Rôles

### Rôles disponibles
- `administrator` : Accès complet
- `directeur` : Accès en lecture et écriture selon permissions

### Permissions
| Permission | Description |
|------------|-------------|
| `view_stats` | Consultation des statistiques |
| `view_inventory` | Consultation de l'inventaire |
| `manage_inventory` | Gestion de l'inventaire (CRUD) |
| `view_cartography` | Consultation de la cartographie |

---

## 1. Authentification

### POST /auth/login
Connexion utilisateur et génération du token.

**Accès:** Public

**Corps de la requête:**
```json
{
  "login": "string (email ou username)",
  "password": "string"
}
```

**Réponse succès (200):**
```json
{
  "message": "Connexion réussie.",
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "administrator"
  }
}
```

**Réponse erreur (401):**
```json
{
  "message": "Identifiants invalides."
}
```

---

### POST /auth/logout
Déconnexion et révocation du token.

**Accès:** Authentifié

**Headers:**
```
Authorization: Bearer {token}
```

**Réponse succès (200):**
```json
{
  "message": "Déconnexion réussie."
}
```

---

### GET /auth/me
Récupération du profil utilisateur connecté.

**Accès:** Authentifié

**Headers:**
```
Authorization: Bearer {token}
```

**Réponse succès (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "administrator",
    "permissions": ["view_stats", "view_inventory", "manage_inventory", "view_cartography"]
  }
}
```

---

## 2. Statistiques

**Permission requise:** `view_stats`

### GET /stats/global
Statistiques globales de l'inventaire.

**Réponse succès (200):**
```json
{
  "coffrets": { "total": 10, "active": 8, "inactive": 2 },
  "equipements": { "total": 50, "active": 45, "inactive": 5 },
  "ports": { "total": 200, "active": 180, "inactive": 20 },
  "systems": { "total": 15, "active": 14, "inactive": 1 },
  "liaisons": { "total": 30, "active": 28, "inactive": 2 },
  "batiments": { "total": 5 },
  "salles": { "total": 20 },
  "lans": { "total": 8 },
  "maintenances": { "total": 12, "planifiees": 3, "en_cours": 2, "terminees": 7 }
}
```

---

### GET /stats/systems-by-type
Systèmes groupés par type.

**Réponse succès (200):**
```json
{
  "data": [
    { "type": "server", "count": 5 },
    { "type": "firewall", "count": 3 },
    { "type": "router", "count": 7 }
  ]
}
```

---

### GET /stats/equipements-by-coffret
Équipements par coffret.

**Réponse succès (200):**
```json
{
  "data": [
    { "coffret_id": 1, "coffret_nom": "Coffret A", "count": 10 },
    { "coffret_id": 2, "coffret_nom": "Coffret B", "count": 8 }
  ]
}
```

---

### GET /stats/ports-by-vlan
Ports groupés par VLAN.

**Réponse succès (200):**
```json
{
  "data": [
    { "vlan": "100", "count": 24 },
    { "vlan": "200", "count": 16 }
  ]
}
```

---

## 3. Coffrets (Armoires)

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /coffrets
Liste des coffrets avec pagination.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom ou pièce |
| `status` | string | Filtrer par statut (active, inactive, maintenance) |
| `per_page` | integer | Nombre d'éléments par page (1-100, défaut: 15) |
| `page` | integer | Numéro de page |

**Réponse succès (200):**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "code": "CF-001",
      "nom": "Coffret Principal",
      "piece": "Salle Serveur",
      "long": 2.345,
      "lat": 48.856,
      "batiment_id": 1,
      "salle_id": 1,
      "status": "active",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "last_page": 5,
  "per_page": 15,
  "total": 75
}
```

---

### GET /coffrets/{id}
Détails d'un coffret avec relations.

**Réponse succès (200):**
```json
{
  "data": {
    "id": 1,
    "code": "CF-001",
    "nom": "Coffret Principal",
    "piece": "Salle Serveur",
    "long": 2.345,
    "lat": 48.856,
    "batiment_id": 1,
    "salle_id": 1,
    "status": "active",
    "equipements": [...],
    "metrics": [...],
    "batiment": {...},
    "salle": {...}
  }
}
```

---

### POST /coffrets
Créer un nouveau coffret.

**Corps de la requête:**
```json
{
  "nom": "string (requis, max 255)",
  "piece": "string (requis)",
  "long": "numeric (optionnel)",
  "lat": "numeric (optionnel)",
  "batiment_id": "integer (optionnel, doit exister)",
  "salle_id": "integer (optionnel, doit exister)",
  "status": "string (optionnel: active|inactive|maintenance, défaut: active)"
}
```

**Note:** Le code est auto-généré au format `CF-XXX`.

**Réponse succès (201):**
```json
{
  "message": "Coffret créé avec succès.",
  "data": {...}
}
```

---

### PUT /coffrets/{id}
Mettre à jour un coffret.

**Corps de la requête:**
```json
{
  "nom": "string (optionnel)",
  "piece": "string (optionnel)",
  "long": "numeric (optionnel)",
  "lat": "numeric (optionnel)",
  "batiment_id": "integer (optionnel)",
  "salle_id": "integer (optionnel)",
  "status": "string (optionnel)"
}
```

**Réponse succès (200):**
```json
{
  "message": "Coffret mis à jour avec succès.",
  "data": {...}
}
```

---

### DELETE /coffrets/{id}
Supprimer un coffret.

**Réponse succès (200):**
```json
{
  "message": "Coffret supprimé avec succès."
}
```

---

## 4. Équipements

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /equipements
Liste des équipements avec pagination.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom, code ou IP |
| `type` | string | Filtrer par type |
| `status` | string | Filtrer par statut |
| `coffret_id` | integer | Filtrer par coffret |
| `batiment_id` | integer | Filtrer par bâtiment |
| `salle_id` | integer | Filtrer par salle |
| `per_page` | integer | Nombre par page (défaut: 15) |

**Réponse succès (200):**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "equipement_code": "EQ-001",
      "name": "Switch Principal",
      "type": "switch",
      "description": "Switch 24 ports PoE",
      "direction_in_out": "in",
      "vlan": "100",
      "ip_address": "192.168.1.1",
      "coffret_id": 1,
      "batiment_id": 1,
      "salle_id": 1,
      "status": "active",
      "coffret": {...},
      "batiment": {...},
      "salle": {...}
    }
  ],
  "total": 50
}
```

---

### GET /equipements/{id}
Détails d'un équipement avec relations.

---

### POST /equipements
Créer un nouvel équipement.

**Corps de la requête:**
```json
{
  "name": "string (requis, max 255)",
  "type": "string (requis)",
  "description": "string (optionnel)",
  "direction_in_out": "string (optionnel)",
  "vlan": "string (optionnel)",
  "ip_address": "string (optionnel, format IP valide)",
  "coffret_id": "integer (optionnel, doit exister)",
  "batiment_id": "integer (optionnel, doit exister)",
  "salle_id": "integer (optionnel, doit exister)",
  "status": "string (optionnel: active|inactive|maintenance)"
}
```

**Note:** Le code est auto-généré au format `EQ-XXX`.

---

### PUT /equipements/{id}
Mettre à jour un équipement.

---

### DELETE /equipements/{id}
Supprimer un équipement.

---

## 5. Ports

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /ports
Liste des ports avec pagination.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par label ou device |
| `vlan` | string | Filtrer par VLAN |
| `equipement_id` | integer | Filtrer par équipement |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "port_label": "Port-01",
      "device_name": "Switch01",
      "poe_enabled": true,
      "vlan": "100",
      "speed": "1000",
      "equipement_id": 1,
      "connected_equipment_id": 2,
      "equipement": {...}
    }
  ]
}
```

---

### POST /ports
Créer un nouveau port.

**Corps de la requête:**
```json
{
  "port_label": "string (requis, max 255)",
  "device_name": "string (requis)",
  "poe_enabled": "boolean (optionnel, défaut: false)",
  "vlan": "string (optionnel)",
  "speed": "string (optionnel)",
  "equipement_id": "integer (optionnel, doit exister)",
  "connected_equipment_id": "integer (optionnel, doit exister)"
}
```

---

### PUT /ports/{id}
Mettre à jour un port.

---

### DELETE /ports/{id}
Supprimer un port.

---

## 6. Liaisons

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /liaisons
Liste des liaisons réseau.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par label |
| `status` | string | Filtrer par statut |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "from": 1,
      "to": 2,
      "label": "Liaison principale",
      "media": "fibre",
      "length": "50",
      "status": "active",
      "fromEquipement": {...},
      "toEquipement": {...}
    }
  ]
}
```

---

### POST /liaisons
Créer une nouvelle liaison.

**Corps de la requête:**
```json
{
  "from": "integer (requis, ID équipement source)",
  "to": "integer (requis, ID équipement destination)",
  "label": "string (requis, max 255)",
  "media": "string (optionnel: fibre|cuivre|wifi)",
  "length": "string (optionnel)",
  "status": "string (optionnel: active|inactive)"
}
```

---

### PUT /liaisons/{id}
Mettre à jour une liaison.

---

### DELETE /liaisons/{id}
Supprimer une liaison.

---

## 7. LANs

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /lans
Liste des réseaux LAN.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom ou subnet |
| `status` | string | Filtrer par statut |
| `batiment_id` | integer | Filtrer par bâtiment |
| `salle_id` | integer | Filtrer par salle |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "LAN Production",
      "subnet": "192.168.1.0/24",
      "vlan_id": 100,
      "site": "Site Principal",
      "status": "active",
      "description": "Réseau de production",
      "gateway": "192.168.1.1",
      "batiment_id": 1,
      "salle_id": 1
    }
  ]
}
```

---

### POST /lans
Créer un nouveau LAN.

**Corps de la requête:**
```json
{
  "name": "string (requis, max 255)",
  "subnet": "string (requis)",
  "vlan_id": "integer (optionnel)",
  "site": "string (optionnel)",
  "status": "string (optionnel: active|inactive)",
  "description": "string (optionnel)",
  "gateway": "string (optionnel, format IP)",
  "batiment_id": "integer (optionnel, doit exister)",
  "salle_id": "integer (optionnel, doit exister)"
}
```

---

### PUT /lans/{id}
Mettre à jour un LAN.

---

### DELETE /lans/{id}
Supprimer un LAN.

---

## 8. Bâtiments

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /batiments
Liste des bâtiments.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom, adresse ou ville |
| `etat` | string | Filtrer par état |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "nom": "Bâtiment A",
      "adresse": "123 Rue Example",
      "ville": "Paris",
      "code_postal": "75001",
      "etat": "Actif",
      "description": "Bâtiment principal"
    }
  ]
}
```

---

### POST /batiments
Créer un nouveau bâtiment.

**Corps de la requête:**
```json
{
  "nom": "string (requis, max 255)",
  "adresse": "string (requis, max 255)",
  "ville": "string (requis, max 255)",
  "code_postal": "string (requis, max 10)",
  "etat": "string (requis: Actif|Inactif|Maintenance)",
  "description": "string (optionnel)"
}
```

---

### PUT /batiments/{id}
Mettre à jour un bâtiment.

---

### DELETE /batiments/{id}
Supprimer un bâtiment.

---

## 9. Salles

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /salles
Liste des salles.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom, étage ou type |
| `etat` | string | Filtrer par état |
| `batiment_id` | integer | Filtrer par bâtiment |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "nom": "Salle Serveur",
      "batiment_id": 1,
      "etage": "RDC",
      "capacite": 10,
      "type": "Technique",
      "etat": "Actif",
      "description": "Salle des serveurs principaux",
      "batiment": {...}
    }
  ]
}
```

---

### POST /salles
Créer une nouvelle salle.

**Corps de la requête:**
```json
{
  "nom": "string (requis, max 255)",
  "batiment_id": "integer (requis, doit exister)",
  "etage": "string (requis, max 255)",
  "capacite": "integer (requis, min 1)",
  "type": "string (requis, max 255)",
  "etat": "string (requis: Actif|Inactif|Maintenance)",
  "description": "string (optionnel)"
}
```

---

### PUT /salles/{id}
Mettre à jour une salle.

---

### DELETE /salles/{id}
Supprimer une salle.

---

## 10. Systèmes

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /systems
Liste des systèmes.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom |
| `status` | boolean | Filtrer par statut |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Serveur Web",
      "type": "server",
      "description": "Serveur HTTP principal",
      "vendor": "Dell",
      "endpoint": "https://server.local",
      "monitored_scope": "production",
      "coffret_id": 1,
      "status": true
    }
  ]
}
```

---

### POST /systems
Créer un nouveau système.

**Corps de la requête:**
```json
{
  "name": "string (requis, max 255)",
  "type": "string (requis, max 255)",
  "description": "string (optionnel)",
  "vendor": "string (optionnel)",
  "endpoint": "string (optionnel)",
  "monitored_scope": "string (optionnel)",
  "coffret_id": "integer (requis, doit exister)",
  "status": "boolean (requis)"
}
```

---

### PUT /systems/{id}
Mettre à jour un système.

---

### DELETE /systems/{id}
Supprimer un système.

---

## 11. Métriques

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /metrics
Liste des métriques.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom |
| `status` | boolean | Filtrer par statut |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "CPU Usage",
      "type": "percentage",
      "description": "Utilisation CPU",
      "last_value": "45%",
      "coffret_id": 1,
      "status": true
    }
  ]
}
```

---

### POST /metrics
Créer une nouvelle métrique.

**Corps de la requête:**
```json
{
  "name": "string (requis, max 255)",
  "type": "string (requis, max 255)",
  "description": "string (optionnel)",
  "last_value": "string (optionnel, max 255)",
  "coffret_id": "integer (requis, doit exister)",
  "status": "boolean (requis)"
}
```

---

### PUT /metrics/{id}
Mettre à jour une métrique.

---

### DELETE /metrics/{id}
Supprimer une métrique.

---

## 12. Maintenances

**Permission lecture:** `view_inventory`
**Permission écriture:** `manage_inventory`

### GET /maintenances
Liste des maintenances.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par type, technicien ou description |
| `statut` | string | Filtrer par statut |
| `per_page` | integer | Nombre par page |

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "equipement_id": 1,
      "type": "Préventive",
      "date_debut": "2024-01-20",
      "heure_debut": "09:00",
      "duree": "2h",
      "technicien": "Jean Dupont",
      "priorite": "moyenne",
      "description": "Maintenance préventive du switch",
      "statut": "planifiee",
      "equipement": {...}
    }
  ]
}
```

---

### POST /maintenances
Créer une nouvelle maintenance.

**Corps de la requête:**
```json
{
  "equipement_id": "integer (optionnel, doit exister)",
  "type": "string (requis, max 255)",
  "date_debut": "date (requis, format YYYY-MM-DD)",
  "heure_debut": "string (requis, format HH:mm)",
  "duree": "string (requis, max 255)",
  "technicien": "string (requis, max 255)",
  "priorite": "string (requis: basse|moyenne|haute|critique)",
  "description": "string (requis)",
  "statut": "string (optionnel: planifiee|en_cours|terminee|annulee, défaut: planifiee)"
}
```

---

### PUT /maintenances/{id}
Mettre à jour une maintenance.

---

### DELETE /maintenances/{id}
Supprimer une maintenance.

---

## 13. Cartographie

**Permission requise:** `view_cartography`

### GET /cartography/lans
Liste des LANs pour la cartographie.

**Réponse succès (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "LAN Production",
      "subnet": "192.168.1.0/24",
      "equipment_count": 15
    }
  ]
}
```

---

### GET /cartography/lans/{id}
Topologie d'un LAN spécifique avec noeuds et liens.

**Réponse succès (200):**
```json
{
  "data": {
    "id": 1,
    "name": "LAN Production",
    "nodes": [
      {
        "id": 1,
        "equipement_code": "EQ-001",
        "name": "Switch Principal",
        "type": "switch",
        "ip_address": "192.168.1.1",
        "status": "active",
        "role": "switch"
      }
    ],
    "links": [
      {
        "id": 1,
        "source": 1,
        "target": 2,
        "label": "Liaison principale",
        "media": "fibre",
        "status": "active"
      }
    ]
  }
}
```

---

### GET /cartography/topology
Topologie filtrée par bâtiment et/ou salle.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `batiment_id` | integer | Filtrer par bâtiment |
| `salle_id` | integer | Filtrer par salle |

**Réponse succès (200):**
```json
{
  "data": {
    "nodes": [...],
    "links": [...]
  }
}
```

---

### GET /cartography/batiments
Liste des bâtiments pour les filtres.

---

### GET /cartography/salles
Liste des salles pour les filtres.

**Paramètres query:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `batiment_id` | integer | Filtrer par bâtiment |

---

## 14. Import CSV

**Permission requise:** `manage_inventory`

### POST /import
Importer des données depuis un fichier CSV.

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Corps de la requête:**
| Champ | Type | Description |
|-------|------|-------------|
| `file` | file | Fichier CSV (max 10MB) |
| `type` | string | Type d'entité: coffrets, equipements, ports, liaisons, systems |

**Réponse succès (200):**
```json
{
  "success": true,
  "message": "Import réussi",
  "imported": 45,
  "errors": ["Ligne 12: Le champ nom est requis"],
  "total": 50
}
```

---

### GET /import/template/{type}
Télécharger un modèle CSV pour l'import.

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `type` | string | coffrets, equipements, ports, liaisons, systems |

**Réponse:** Fichier CSV téléchargeable

**Exemples de templates:**

**coffrets:**
```csv
code,nom,piece,long,lat,status
COF001,Coffret Principal,Salle Serveur,2.5,48.8,active
```

**equipements:**
```csv
equipement_code,name,type,description,direction_in_out,vlan,ip_address,coffret_id,status
EQ001,Switch Principal,switch,Switch 24 ports,in,100,192.168.1.1,1,active
```

**ports:**
```csv
port_label,device_name,poe_enabled,vlan,speed,connected_equipment_id
Port1,Switch01,1,100,1000,1
```

**liaisons:**
```csv
from,to,label,media,length,status
1,2,Liaison principale,fibre,50,active
```

**systems:**
```csv
name,type,description,ip_address,status
Serveur Web,server,Serveur HTTP principal,192.168.1.10,active
```

---

## 15. Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé (permission insuffisante) |
| 404 | Ressource non trouvée |
| 422 | Erreur de validation |
| 500 | Erreur serveur |

### Format des erreurs de validation (422):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "nom": ["Le champ nom est obligatoire."],
    "email": ["Le champ email doit être une adresse email valide."]
  }
}
```

### Format des erreurs génériques:
```json
{
  "message": "Description de l'erreur"
}
```

---

## Exemples d'utilisation avec cURL

### Connexion
```bash
curl -X POST https://reseau-api.jobs-conseil.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin@example.com", "password": "password123"}'
```

### Liste des équipements
```bash
curl -X GET "https://reseau-api.jobs-conseil.host/api/equipements?per_page=10&status=active" \
  -H "Authorization: Bearer {token}"
```

### Créer un équipement
```bash
curl -X POST https://reseau-api.jobs-conseil.host/api/equipements \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau Switch",
    "type": "switch",
    "ip_address": "192.168.1.50",
    "status": "active"
  }'
```

### Import CSV
```bash
curl -X POST https://reseau-api.jobs-conseil.host/api/import \
  -H "Authorization: Bearer {token}" \
  -F "file=@equipements.csv" \
  -F "type=equipements"
```

---

*Documentation générée le 17/12/2024 - JOBS-Conseil*
