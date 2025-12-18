# Protocole de Test - API Réseau Inventaire

**Version:** 1.0.0
**Date:** 17/12/2024
**Application:** Réseau Inventaire App API

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Configuration de l'environnement](#2-configuration-de-lenvironnement)
3. [Tests d'authentification](#3-tests-dauthentification)
4. [Tests des statistiques](#4-tests-des-statistiques)
5. [Tests CRUD - Coffrets](#5-tests-crud---coffrets)
6. [Tests CRUD - Équipements](#6-tests-crud---équipements)
7. [Tests CRUD - Ports](#7-tests-crud---ports)
8. [Tests CRUD - Liaisons](#8-tests-crud---liaisons)
9. [Tests CRUD - LANs](#9-tests-crud---lans)
10. [Tests CRUD - Bâtiments](#10-tests-crud---bâtiments)
11. [Tests CRUD - Salles](#11-tests-crud---salles)
12. [Tests CRUD - Systèmes](#12-tests-crud---systèmes)
13. [Tests CRUD - Métriques](#13-tests-crud---métriques)
14. [Tests CRUD - Maintenances](#14-tests-crud---maintenances)
15. [Tests de la cartographie](#15-tests-de-la-cartographie)
16. [Tests d'import CSV](#16-tests-dimport-csv)
17. [Tests de sécurité](#17-tests-de-sécurité)
18. [Tests de performance](#18-tests-de-performance)
19. [Résumé des résultats](#19-résumé-des-résultats)

---

## 1. Prérequis

### Outils nécessaires
- [ ] Postman ou Insomnia (client API REST)
- [ ] cURL (ligne de commande)
- [ ] Navigateur web avec outils développeur
- [ ] Accès à la base de données (MySQL/PostgreSQL)

### Comptes de test
| Rôle | Email | Mot de passe | Permissions |
|------|-------|--------------|-------------|
| Administrator | admin@test.com | password123 | Toutes |
| Directeur | directeur@test.com | password123 | Lecture + Écriture limitée |
| Utilisateur sans rôle | user@test.com | password123 | Aucune |

### Variables d'environnement
```
BASE_URL=https://reseau-api.jobs-conseil.host/api
TOKEN_ADMIN=<token_admin>
TOKEN_DIRECTEUR=<token_directeur>
TOKEN_USER=<token_user>
```

---

## 2. Configuration de l'environnement

### 2.1 Vérification de l'API
| ID | Test | Méthode | Endpoint | Résultat attendu | Statut |
|----|------|---------|----------|------------------|--------|
| ENV-01 | API accessible | GET | / | JSON avec nom et version | [ ] |
| ENV-02 | Route inexistante | GET | /route-inexistante | 404 Not Found | [ ] |

### Commandes de test
```bash
# ENV-01: Vérifier l'API
curl -X GET https://reseau-api.jobs-conseil.host/api/

# Réponse attendue:
# {"name":"Reseau Inventaire App API","Version":"1.0.0","Description":"..."}
```

---

## 3. Tests d'authentification

### 3.1 Connexion (Login)
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| AUTH-01 | Login valide admin | `{"login":"admin@test.com","password":"password123"}` | 200 + token | [ ] |
| AUTH-02 | Login valide directeur | `{"login":"directeur@test.com","password":"password123"}` | 200 + token | [ ] |
| AUTH-03 | Login avec username | `{"login":"admin","password":"password123"}` | 200 + token | [ ] |
| AUTH-04 | Login invalide (mauvais mdp) | `{"login":"admin@test.com","password":"wrong"}` | 401 | [ ] |
| AUTH-05 | Login invalide (user inexistant) | `{"login":"fake@test.com","password":"pass"}` | 401 | [ ] |
| AUTH-06 | Login sans password | `{"login":"admin@test.com"}` | 422 | [ ] |
| AUTH-07 | Login sans login | `{"password":"password123"}` | 422 | [ ] |
| AUTH-08 | Login corps vide | `{}` | 422 | [ ] |

### Commandes de test
```bash
# AUTH-01: Login valide
curl -X POST https://reseau-api.jobs-conseil.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@test.com","password":"password123"}'

# Sauvegarder le token pour les tests suivants
export TOKEN="<token_recu>"
```

### 3.2 Profil utilisateur
| ID | Test | Headers | Résultat attendu | Statut |
|----|------|---------|------------------|--------|
| AUTH-09 | Profil avec token valide | Bearer {token} | 200 + user info | [ ] |
| AUTH-10 | Profil sans token | Aucun | 401 | [ ] |
| AUTH-11 | Profil token invalide | Bearer invalid_token | 401 | [ ] |
| AUTH-12 | Profil token expiré | Bearer {expired_token} | 401 | [ ] |

### Commandes de test
```bash
# AUTH-09: Profil avec token
curl -X GET https://reseau-api.jobs-conseil.host/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3.3 Déconnexion (Logout)
| ID | Test | Headers | Résultat attendu | Statut |
|----|------|---------|------------------|--------|
| AUTH-13 | Logout avec token valide | Bearer {token} | 200 | [ ] |
| AUTH-14 | Utilisation token après logout | Bearer {token_révoqué} | 401 | [ ] |
| AUTH-15 | Logout sans token | Aucun | 401 | [ ] |

---

## 4. Tests des statistiques

**Prérequis:** Token admin valide

### 4.1 Statistiques globales
| ID | Test | Endpoint | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| STAT-01 | Stats globales | GET /stats/global | 200 + compteurs | [ ] |
| STAT-02 | Stats sans auth | GET /stats/global (sans token) | 401 | [ ] |
| STAT-03 | Stats sans permission | GET /stats/global (user sans perm) | 403 | [ ] |

### 4.2 Statistiques détaillées
| ID | Test | Endpoint | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| STAT-04 | Systems by type | GET /stats/systems-by-type | 200 + array groupé | [ ] |
| STAT-05 | Equipements by coffret | GET /stats/equipements-by-coffret | 200 + array groupé | [ ] |
| STAT-06 | Ports by VLAN | GET /stats/ports-by-vlan | 200 + array groupé | [ ] |

### Commandes de test
```bash
# STAT-01: Stats globales
curl -X GET https://reseau-api.jobs-conseil.host/api/stats/global \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Tests CRUD - Coffrets

### 5.1 Liste (INDEX)
| ID | Test | Paramètres | Résultat attendu | Statut |
|----|------|------------|------------------|--------|
| COF-01 | Liste sans filtres | - | 200 + pagination | [ ] |
| COF-02 | Liste avec search | ?search=serveur | 200 + résultats filtrés | [ ] |
| COF-03 | Liste avec status | ?status=active | 200 + coffrets actifs | [ ] |
| COF-04 | Liste avec per_page | ?per_page=5 | 200 + 5 éléments max | [ ] |
| COF-05 | Liste page 2 | ?page=2 | 200 + page 2 | [ ] |
| COF-06 | Liste per_page invalide | ?per_page=500 | 200 + défaut 15 | [ ] |

### 5.2 Détail (SHOW)
| ID | Test | Paramètre | Résultat attendu | Statut |
|----|------|-----------|------------------|--------|
| COF-07 | Détail coffret existant | /coffrets/1 | 200 + détails | [ ] |
| COF-08 | Détail coffret inexistant | /coffrets/9999 | 404 | [ ] |
| COF-09 | Détail avec relations | /coffrets/1 | 200 + equipements, metrics | [ ] |

### 5.3 Création (STORE)
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| COF-10 | Création valide | `{"nom":"Test","piece":"Salle A"}` | 201 + code auto | [ ] |
| COF-11 | Création complète | `{"nom":"Test","piece":"B","long":2.5,"lat":48.8,"status":"active"}` | 201 | [ ] |
| COF-12 | Création sans nom | `{"piece":"Salle A"}` | 422 | [ ] |
| COF-13 | Création sans piece | `{"nom":"Test"}` | 422 | [ ] |
| COF-14 | Création status invalide | `{"nom":"Test","piece":"A","status":"invalid"}` | 422 | [ ] |
| COF-15 | Création batiment inexistant | `{"nom":"Test","piece":"A","batiment_id":9999}` | 422 | [ ] |

### 5.4 Modification (UPDATE)
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| COF-16 | Update nom | `{"nom":"Nouveau nom"}` | 200 | [ ] |
| COF-17 | Update status | `{"status":"inactive"}` | 200 | [ ] |
| COF-18 | Update coffret inexistant | PUT /coffrets/9999 | 404 | [ ] |
| COF-19 | Update status invalide | `{"status":"invalid"}` | 422 | [ ] |

### 5.5 Suppression (DELETE)
| ID | Test | Paramètre | Résultat attendu | Statut |
|----|------|-----------|------------------|--------|
| COF-20 | Suppression existant | DELETE /coffrets/{id} | 200 | [ ] |
| COF-21 | Suppression inexistant | DELETE /coffrets/9999 | 404 | [ ] |
| COF-22 | Vérification suppression | GET /coffrets/{id_supprimé} | 404 | [ ] |

### Commandes de test
```bash
# COF-10: Création
curl -X POST https://reseau-api.jobs-conseil.host/api/coffrets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Coffret Test","piece":"Salle Serveur"}'

# COF-16: Update
curl -X PUT https://reseau-api.jobs-conseil.host/api/coffrets/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Nouveau nom"}'

# COF-20: Delete
curl -X DELETE https://reseau-api.jobs-conseil.host/api/coffrets/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Tests CRUD - Équipements

### 6.1 Liste (INDEX)
| ID | Test | Paramètres | Résultat attendu | Statut |
|----|------|------------|------------------|--------|
| EQ-01 | Liste sans filtres | - | 200 + pagination | [ ] |
| EQ-02 | Liste avec search | ?search=switch | 200 + filtrés | [ ] |
| EQ-03 | Liste avec type | ?type=switch | 200 + switches | [ ] |
| EQ-04 | Liste avec status | ?status=active | 200 + actifs | [ ] |
| EQ-05 | Liste avec coffret_id | ?coffret_id=1 | 200 + du coffret | [ ] |
| EQ-06 | Liste avec batiment_id | ?batiment_id=1 | 200 + du bâtiment | [ ] |

### 6.2 Détail (SHOW)
| ID | Test | Paramètre | Résultat attendu | Statut |
|----|------|-----------|------------------|--------|
| EQ-07 | Détail existant | /equipements/1 | 200 + détails | [ ] |
| EQ-08 | Détail inexistant | /equipements/9999 | 404 | [ ] |

### 6.3 Création (STORE)
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| EQ-09 | Création valide | `{"name":"Test","type":"switch"}` | 201 + code auto | [ ] |
| EQ-10 | Création complète | `{"name":"Test","type":"router","ip_address":"192.168.1.1","vlan":"100"}` | 201 | [ ] |
| EQ-11 | Création sans name | `{"type":"switch"}` | 422 | [ ] |
| EQ-12 | Création sans type | `{"name":"Test"}` | 422 | [ ] |
| EQ-13 | Création IP invalide | `{"name":"Test","type":"switch","ip_address":"invalid"}` | 422 | [ ] |
| EQ-14 | Création coffret inexistant | `{"name":"Test","type":"switch","coffret_id":9999}` | 422 | [ ] |

### 6.4 Modification (UPDATE)
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| EQ-15 | Update name | `{"name":"Nouveau"}` | 200 | [ ] |
| EQ-16 | Update IP | `{"ip_address":"192.168.2.1"}` | 200 | [ ] |
| EQ-17 | Update inexistant | PUT /equipements/9999 | 404 | [ ] |

### 6.5 Suppression (DELETE)
| ID | Test | Paramètre | Résultat attendu | Statut |
|----|------|-----------|------------------|--------|
| EQ-18 | Suppression existant | DELETE /equipements/{id} | 200 | [ ] |
| EQ-19 | Suppression inexistant | DELETE /equipements/9999 | 404 | [ ] |

---

## 7. Tests CRUD - Ports

### 7.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| PORT-01 | Liste | GET /ports | 200 + pagination | [ ] |
| PORT-02 | Liste avec VLAN | ?vlan=100 | 200 + filtrés | [ ] |
| PORT-03 | Détail | GET /ports/1 | 200 + détails | [ ] |
| PORT-04 | Détail inexistant | GET /ports/9999 | 404 | [ ] |

### 7.2 Création
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| PORT-05 | Création valide | `{"port_label":"Port-01","device_name":"Switch01"}` | 201 | [ ] |
| PORT-06 | Création complète | `{"port_label":"Port-02","device_name":"Switch01","poe_enabled":true,"vlan":"100","speed":"1000"}` | 201 | [ ] |
| PORT-07 | Création sans label | `{"device_name":"Switch01"}` | 422 | [ ] |
| PORT-08 | Création sans device | `{"port_label":"Port-01"}` | 422 | [ ] |

### 7.3 Modification et Suppression
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| PORT-09 | Update valide | PUT /ports/1 `{"vlan":"200"}` | 200 | [ ] |
| PORT-10 | Delete | DELETE /ports/1 | 200 | [ ] |

---

## 8. Tests CRUD - Liaisons

### 8.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| LIAI-01 | Liste | GET /liaisons | 200 + pagination | [ ] |
| LIAI-02 | Liste avec status | ?status=active | 200 + actives | [ ] |
| LIAI-03 | Détail | GET /liaisons/1 | 200 + from/to équipements | [ ] |

### 8.2 Création
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| LIAI-04 | Création valide | `{"from":1,"to":2,"label":"Link-01"}` | 201 | [ ] |
| LIAI-05 | Création complète | `{"from":1,"to":2,"label":"Link-02","media":"fibre","length":"50","status":"active"}` | 201 | [ ] |
| LIAI-06 | Création sans from | `{"to":2,"label":"Link"}` | 422 | [ ] |
| LIAI-07 | Création équipement inexistant | `{"from":9999,"to":2,"label":"Link"}` | 422 | [ ] |
| LIAI-08 | Création media invalide | `{"from":1,"to":2,"label":"Link","media":"invalid"}` | 422 | [ ] |

### 8.3 Modification et Suppression
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| LIAI-09 | Update | PUT /liaisons/1 `{"status":"inactive"}` | 200 | [ ] |
| LIAI-10 | Delete | DELETE /liaisons/1 | 200 | [ ] |

---

## 9. Tests CRUD - LANs

### 9.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| LAN-01 | Liste | GET /lans | 200 + pagination | [ ] |
| LAN-02 | Liste avec batiment | ?batiment_id=1 | 200 + filtrés | [ ] |
| LAN-03 | Détail | GET /lans/1 | 200 + détails | [ ] |

### 9.2 Création
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| LAN-04 | Création valide | `{"name":"LAN Test","subnet":"192.168.1.0/24"}` | 201 | [ ] |
| LAN-05 | Création complète | `{"name":"LAN Prod","subnet":"10.0.0.0/8","vlan_id":100,"gateway":"10.0.0.1","status":"active"}` | 201 | [ ] |
| LAN-06 | Création sans name | `{"subnet":"192.168.1.0/24"}` | 422 | [ ] |
| LAN-07 | Création sans subnet | `{"name":"LAN Test"}` | 422 | [ ] |

### 9.3 Modification et Suppression
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| LAN-08 | Update | PUT /lans/1 `{"gateway":"192.168.1.254"}` | 200 | [ ] |
| LAN-09 | Delete | DELETE /lans/1 | 200 | [ ] |

---

## 10. Tests CRUD - Bâtiments

### 10.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| BAT-01 | Liste | GET /batiments | 200 + pagination | [ ] |
| BAT-02 | Liste avec search | ?search=paris | 200 + filtrés | [ ] |
| BAT-03 | Liste avec etat | ?etat=Actif | 200 + actifs | [ ] |
| BAT-04 | Détail | GET /batiments/1 | 200 | [ ] |

### 10.2 Création
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| BAT-05 | Création valide | `{"nom":"Bâtiment A","adresse":"123 Rue","ville":"Paris","code_postal":"75001","etat":"Actif"}` | 201 | [ ] |
| BAT-06 | Création sans nom | `{"adresse":"123 Rue","ville":"Paris","code_postal":"75001","etat":"Actif"}` | 422 | [ ] |
| BAT-07 | Création etat invalide | `{"nom":"Test","adresse":"Rue","ville":"Paris","code_postal":"75001","etat":"Invalid"}` | 422 | [ ] |

### 10.3 Modification et Suppression
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| BAT-08 | Update | PUT /batiments/1 `{"nom":"Nouveau nom"}` | 200 | [ ] |
| BAT-09 | Delete | DELETE /batiments/1 | 200 | [ ] |

---

## 11. Tests CRUD - Salles

### 11.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| SAL-01 | Liste | GET /salles | 200 + pagination + batiment | [ ] |
| SAL-02 | Liste avec batiment_id | ?batiment_id=1 | 200 + filtrés | [ ] |
| SAL-03 | Détail | GET /salles/1 | 200 + batiment | [ ] |

### 11.2 Création
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| SAL-04 | Création valide | `{"nom":"Salle A","batiment_id":1,"etage":"RDC","capacite":10,"type":"Bureau","etat":"Actif"}` | 201 | [ ] |
| SAL-05 | Création batiment inexistant | `{"nom":"Salle","batiment_id":9999,"etage":"1","capacite":5,"type":"Bureau","etat":"Actif"}` | 422 | [ ] |
| SAL-06 | Création capacite négative | `{"nom":"Salle","batiment_id":1,"etage":"1","capacite":-1,"type":"Bureau","etat":"Actif"}` | 422 | [ ] |

### 11.3 Modification et Suppression
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| SAL-07 | Update | PUT /salles/1 `{"capacite":20}` | 200 | [ ] |
| SAL-08 | Delete | DELETE /salles/1 | 200 | [ ] |

---

## 12. Tests CRUD - Systèmes

### 12.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| SYS-01 | Liste | GET /systems | 200 + pagination | [ ] |
| SYS-02 | Liste avec status | ?status=true | 200 + actifs | [ ] |
| SYS-03 | Détail | GET /systems/1 | 200 | [ ] |

### 12.2 Création
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| SYS-04 | Création valide | `{"name":"Serveur","type":"server","coffret_id":1,"status":true}` | 201 | [ ] |
| SYS-05 | Création sans coffret | `{"name":"Serveur","type":"server","status":true}` | 422 | [ ] |

### 12.3 Modification et Suppression
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| SYS-06 | Update | PUT /systems/1 `{"status":false}` | 200 | [ ] |
| SYS-07 | Delete | DELETE /systems/1 | 200 | [ ] |

---

## 13. Tests CRUD - Métriques

### 13.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| MET-01 | Liste | GET /metrics | 200 + pagination | [ ] |
| MET-02 | Détail | GET /metrics/1 | 200 | [ ] |

### 13.2 CRUD
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| MET-03 | Création | POST `{"name":"CPU","type":"percentage","coffret_id":1,"status":true}` | 201 | [ ] |
| MET-04 | Update | PUT /metrics/1 `{"last_value":"75%"}` | 200 | [ ] |
| MET-05 | Delete | DELETE /metrics/1 | 200 | [ ] |

---

## 14. Tests CRUD - Maintenances

### 14.1 Liste et Détail
| ID | Test | Endpoint/Paramètres | Résultat attendu | Statut |
|----|------|---------------------|------------------|--------|
| MAIN-01 | Liste | GET /maintenances | 200 + pagination + equipement | [ ] |
| MAIN-02 | Liste avec statut | ?statut=planifiee | 200 + planifiées | [ ] |
| MAIN-03 | Détail | GET /maintenances/1 | 200 + equipement | [ ] |

### 14.2 Création
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| MAIN-04 | Création valide | `{"type":"Préventive","date_debut":"2024-02-01","heure_debut":"09:00","duree":"2h","technicien":"Jean","priorite":"moyenne","description":"Test"}` | 201 | [ ] |
| MAIN-05 | Création priorité invalide | `{...,"priorite":"invalid"}` | 422 | [ ] |
| MAIN-06 | Création statut invalide | `{...,"statut":"invalid"}` | 422 | [ ] |
| MAIN-07 | Création avec équipement | `{...,"equipement_id":1}` | 201 + equipement | [ ] |

### 14.3 Modification et Suppression
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| MAIN-08 | Update statut | PUT /maintenances/1 `{"statut":"en_cours"}` | 200 | [ ] |
| MAIN-09 | Delete | DELETE /maintenances/1 | 200 | [ ] |

---

## 15. Tests de la cartographie

### 15.1 Liste des LANs
| ID | Test | Endpoint | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| CARTO-01 | Liste LANs | GET /cartography/lans | 200 + LANs avec count | [ ] |

### 15.2 Topologie par LAN
| ID | Test | Endpoint | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| CARTO-02 | Topologie LAN existant | GET /cartography/lans/1 | 200 + nodes + links | [ ] |
| CARTO-03 | Topologie LAN inexistant | GET /cartography/lans/9999 | 404 | [ ] |
| CARTO-04 | Vérifier structure nodes | GET /cartography/lans/1 | nodes contient id, name, type, ip_address, status | [ ] |
| CARTO-05 | Vérifier structure links | GET /cartography/lans/1 | links contient source, target, label, media | [ ] |

### 15.3 Topologie filtrée
| ID | Test | Endpoint | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| CARTO-06 | Topologie par bâtiment | GET /cartography/topology?batiment_id=1 | 200 + nodes/links du bâtiment | [ ] |
| CARTO-07 | Topologie par salle | GET /cartography/topology?salle_id=1 | 200 + nodes/links de la salle | [ ] |
| CARTO-08 | Topologie bâtiment + salle | GET /cartography/topology?batiment_id=1&salle_id=1 | 200 + filtrés | [ ] |

### 15.4 Listes pour filtres
| ID | Test | Endpoint | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| CARTO-09 | Liste bâtiments | GET /cartography/batiments | 200 + bâtiments | [ ] |
| CARTO-10 | Liste salles | GET /cartography/salles | 200 + salles | [ ] |
| CARTO-11 | Salles par bâtiment | GET /cartography/salles?batiment_id=1 | 200 + salles du bâtiment | [ ] |

---

## 16. Tests d'import CSV

### 16.1 Templates
| ID | Test | Endpoint | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| IMP-01 | Template coffrets | GET /import/template/coffrets | 200 + fichier CSV | [ ] |
| IMP-02 | Template equipements | GET /import/template/equipements | 200 + fichier CSV | [ ] |
| IMP-03 | Template ports | GET /import/template/ports | 200 + fichier CSV | [ ] |
| IMP-04 | Template liaisons | GET /import/template/liaisons | 200 + fichier CSV | [ ] |
| IMP-05 | Template systems | GET /import/template/systems | 200 + fichier CSV | [ ] |
| IMP-06 | Template type invalide | GET /import/template/invalid | 400 | [ ] |

### 16.2 Import
| ID | Test | Corps requête | Résultat attendu | Statut |
|----|------|---------------|------------------|--------|
| IMP-07 | Import coffrets valide | file=coffrets.csv, type=coffrets | 200 + imported count | [ ] |
| IMP-08 | Import equipements valide | file=equipements.csv, type=equipements | 200 + imported count | [ ] |
| IMP-09 | Import sans fichier | type=coffrets | 422 | [ ] |
| IMP-10 | Import sans type | file=test.csv | 422 | [ ] |
| IMP-11 | Import type invalide | file=test.csv, type=invalid | 422 | [ ] |
| IMP-12 | Import fichier non CSV | file=test.pdf, type=coffrets | 422 | [ ] |
| IMP-13 | Import fichier trop gros | file>10MB, type=coffrets | 422 | [ ] |
| IMP-14 | Import avec erreurs validation | CSV avec données invalides | 200 + errors array | [ ] |

### Commandes de test
```bash
# IMP-07: Import coffrets
curl -X POST https://reseau-api.jobs-conseil.host/api/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@coffrets.csv" \
  -F "type=coffrets"
```

---

## 17. Tests de sécurité

### 17.1 Authentification et autorisation
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| SEC-01 | Accès sans token | GET /coffrets sans header | 401 | [ ] |
| SEC-02 | Token malformé | Authorization: Bearer xxx | 401 | [ ] |
| SEC-03 | User sans rôle | GET /coffrets avec user sans rôle | 403 | [ ] |
| SEC-04 | Directeur sans permission | Action manage sans permission | 403 | [ ] |
| SEC-05 | Cross-user access | Accès données autre user | 403 | [ ] |

### 17.2 Injection et validation
| ID | Test | Payload | Résultat attendu | Statut |
|----|------|---------|------------------|--------|
| SEC-06 | SQL Injection search | ?search='; DROP TABLE-- | Pas d'erreur SQL, résultat vide | [ ] |
| SEC-07 | XSS dans création | `{"nom":"<script>alert(1)</script>"}` | Données échappées | [ ] |
| SEC-08 | Path traversal import | filename=../../../etc/passwd | Rejeté | [ ] |

### 17.3 Rate limiting (si implémenté)
| ID | Test | Action | Résultat attendu | Statut |
|----|------|--------|------------------|--------|
| SEC-09 | Brute force login | 100 tentatives rapides | 429 Too Many Requests | [ ] |
| SEC-10 | API flooding | 1000 requêtes/min | Rate limited | [ ] |

---

## 18. Tests de performance

### 18.1 Temps de réponse
| ID | Test | Endpoint | Temps max | Statut |
|----|------|----------|-----------|--------|
| PERF-01 | Login | POST /auth/login | < 500ms | [ ] |
| PERF-02 | Liste coffrets | GET /coffrets | < 300ms | [ ] |
| PERF-03 | Détail coffret | GET /coffrets/1 | < 200ms | [ ] |
| PERF-04 | Création | POST /coffrets | < 500ms | [ ] |
| PERF-05 | Topologie LAN | GET /cartography/lans/1 | < 1000ms | [ ] |
| PERF-06 | Stats globales | GET /stats/global | < 500ms | [ ] |

### 18.2 Charge
| ID | Test | Scénario | Résultat attendu | Statut |
|----|------|----------|------------------|--------|
| PERF-07 | 10 users simultanés | 10 GET /coffrets | Temps < 1s | [ ] |
| PERF-08 | 50 users simultanés | 50 GET /coffrets | Temps < 3s | [ ] |
| PERF-09 | Pagination large | ?per_page=100 | Temps < 1s | [ ] |

---

## 19. Résumé des résultats

### Synthèse par module
| Module | Tests totaux | Passés | Échoués | Bloqués |
|--------|-------------|--------|---------|---------|
| Authentification | 15 | | | |
| Statistiques | 6 | | | |
| Coffrets | 22 | | | |
| Équipements | 19 | | | |
| Ports | 10 | | | |
| Liaisons | 10 | | | |
| LANs | 9 | | | |
| Bâtiments | 9 | | | |
| Salles | 8 | | | |
| Systèmes | 7 | | | |
| Métriques | 5 | | | |
| Maintenances | 9 | | | |
| Cartographie | 11 | | | |
| Import CSV | 14 | | | |
| Sécurité | 10 | | | |
| Performance | 9 | | | |
| **TOTAL** | **163** | | | |

### Résultat global
- **Date du test:** _______________
- **Testeur:** _______________
- **Version API:** 1.0.0
- **Environnement:** Production / Staging / Développement

### Anomalies détectées
| ID | Sévérité | Description | Statut |
|----|----------|-------------|--------|
| | | | |

### Commentaires
```
[Espace pour notes et observations]
```

---

*Protocole de test généré le 17/12/2024 - JOBS-Conseil*
