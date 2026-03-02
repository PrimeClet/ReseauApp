# Protocole de Tests Fonctionnels - ReseauApp

## Inventaire Complet des Fonctionnalites a Tester

---

## MODULE 1 : AUTHENTIFICATION ET SESSION

### 1.1 Page de Connexion (`/login`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 1.1.1 | Affichage du formulaire de connexion | Champs email et mot de passe visibles, bouton de connexion present | Critique |
| 1.1.2 | Connexion avec identifiants valides (email) | Redirection vers le dashboard, token stocke, utilisateur charge | Critique |
| 1.1.3 | Connexion avec identifiants valides (username) | Meme resultat qu'avec email (le backend accepte email OU username) | Critique |
| 1.1.4 | Connexion avec email invalide | Message d'erreur affiche, reste sur `/login` | Critique |
| 1.1.5 | Connexion avec mot de passe invalide | Message d'erreur affiche, reste sur `/login` | Critique |
| 1.1.6 | Connexion avec champs vides | Validation front : messages d'erreur sur les champs requis | Haute |
| 1.1.7 | Connexion d'un utilisateur desactive (`is_active=false`) | Message d'erreur specifique (compte desactive) | Critique |
| 1.1.8 | Toggle visibilite du mot de passe | Icone oeil bascule le type du champ (password/text) | Basse |
| 1.1.9 | Affichage des comptes de test | Section avec identifiants de test visible | Basse |
| 1.1.10 | Chargement des roles et permissions apres login | User context contient roles, permissions, role mappe (administrator/technicien/observateur) | Critique |

### 1.2 Deconnexion

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 1.2.1 | Deconnexion via menu utilisateur | Token revoque, redirection vers `/login` | Critique |
| 1.2.2 | Activite de deconnexion loguee | ActivityLog cree avec action='logout' | Moyenne |
| 1.2.3 | Acces a une page protegee apres deconnexion | Redirection automatique vers `/login` | Critique |

### 1.3 Session et Auto-deconnexion

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 1.3.1 | Auto-deconnexion apres 15 minutes d'inactivite | Session expiree, redirection vers `/login` | Haute |
| 1.3.2 | Persistance du token (Redux Persist) | Token conserve apres rafraichissement de la page | Haute |
| 1.3.3 | Recuperation du profil (`GET /api/auth/me`) | Retourne utilisateur avec roles et permissions completes | Critique |

### 1.4 Protection des Routes

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 1.4.1 | Acces a `/` sans authentification | Redirection vers `/login` | Critique |
| 1.4.2 | Acces a `/equipements` sans authentification | Redirection vers `/login` | Critique |
| 1.4.3 | URL actuelle sauvegardee pour redirection post-login | Apres login, retour a l'URL initialement demandee | Moyenne |
| 1.4.4 | Acces a `/users` par un Observateur | Redirection vers `/unauthorized` | Critique |
| 1.4.5 | Acces a `/validation-modifications` par un Technicien | Redirection vers `/unauthorized` ou bouton absent | Haute |
| 1.4.6 | Page 404 pour route inexistante | Affichage page NotFound avec bouton retour | Basse |
| 1.4.7 | Page 403 (`/unauthorized`) | Affichage message acces refuse avec options de navigation | Basse |

---

## MODULE 2 : NAVIGATION ET LAYOUT

### 2.1 Barre de Navigation (Navbar)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 2.1.1 | Affichage du Navbar | Logo/nom application, cloche notifications, avatar utilisateur | Haute |
| 2.1.2 | Bouton toggle sidebar | Ouvre/ferme le sidebar avec icone Menu | Haute |
| 2.1.3 | Menu utilisateur (clic avatar) | Dropdown avec nom, email, role badge colore, lien profil, bouton deconnexion | Haute |
| 2.1.4 | Badge de role colore | Super Admin/Administrateur en rouge, Technicien en bleu, Observateur en gris | Moyenne |
| 2.1.5 | Cloche de notifications | Affiche compteur non-lues, clic ouvre les notifications | Haute |
| 2.1.6 | Initiales utilisateur dans l'avatar | Generees depuis nom + prenom | Basse |

### 2.2 Sidebar

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 2.2.1 | Affichage des sections principales | Dashboard, Inventaire (Sites, Zones, Batiments, Salles, Armoires, Equipements, Ports, Liaisons), Maintenance, Reseau, Administration, Compte | Haute |
| 2.2.2 | Navigation vers le Dashboard | Clic sur "Dashboard" charge la page d'accueil | Haute |
| 2.2.3 | Navigation vers chaque page inventaire | Sites, Zones, Batiments, Salles, Armoires, Equipements, Ports, Liaisons | Haute |
| 2.2.4 | Section Maintenance depliable | Maintenances, Mises a jour, Validation, Historique | Haute |
| 2.2.5 | Section Administration depliable | Utilisateurs, Roles, Permissions, Logs d'activite | Haute |
| 2.2.6 | Section Reseau | VLANs, Cartographie LAN | Haute |
| 2.2.7 | Section Compte | Notifications, Profil, Parametres | Haute |
| 2.2.8 | Highlight de la section active | Element selectionne visuellement distingue | Moyenne |
| 2.2.9 | Expansion automatique de la section courante | Si on est sur `/maintenances`, la section Maintenance est ouverte | Moyenne |
| 2.2.10 | Bouton "Validation" visible uniquement pour admin | Observateur et Technicien ne voient pas ce bouton | Critique |
| 2.2.11 | Fermeture auto sur mobile | Sidebar se ferme apres navigation sur ecran mobile | Moyenne |
| 2.2.12 | Sauvegarde etat sidebar (localStorage) | Etat ouvert/ferme persiste entre les sessions | Basse |

---

## MODULE 3 : DASHBOARD (`/`)

### 3.1 Statistiques Globales

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 3.1.1 | Affichage des cartes de statistiques | Compteurs pour Sites, Batiments, Salles, Coffrets, Equipements, Ports visibles | Haute |
| 3.1.2 | Valeurs des compteurs correctes | Correspondent aux donnees reelles en base | Haute |
| 3.1.3 | Icones et couleurs des cartes | Chaque carte a son icone et couleur specifique | Basse |
| 3.1.4 | Indicateurs de tendance | Pourcentage positif/negatif affiche si disponible | Basse |

### 3.2 Filtres du Dashboard

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 3.2.1 | Filtre par site | Dropdown avec tous les sites, selection filtre les statistiques | Moyenne |
| 3.2.2 | Filtre par type d'equipement | Dropdown avec types, filtre les donnees | Moyenne |
| 3.2.3 | Combinaison de filtres | Site + Type appliques simultanement | Moyenne |

### 3.3 Graphiques

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 3.3.1 | Graphique camembert distribution equipements | Repartition par type d'equipement | Moyenne |
| 3.3.2 | Graphique barres statut equipements | Actifs vs Inactifs vs Maintenance | Moyenne |
| 3.3.3 | Graphique radar capacite reseau | Visualisation de la capacite | Basse |
| 3.3.4 | Graphique barres par type d'equipement | Compteur par categorie | Basse |

### 3.4 Actions Rapides et Timeline

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 3.4.1 | Cartes d'actions rapides | Navigation directe vers sections principales | Moyenne |
| 3.4.2 | Liste des dernieres modifications | Timeline des modifications recentes | Moyenne |

---

## MODULE 4 : GESTION DES SITES (`/sites`)

### 4.1 Liste des Sites

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 4.1.1 | Affichage du tableau des sites actifs | Colonnes : Code, Nom, Description, Nombre de zones, Date creation | Haute |
| 4.1.2 | Onglet "Sites actifs" | Affiche uniquement les sites non supprimes | Haute |
| 4.1.3 | Onglet "Sites supprimes" | Affiche uniquement les sites en corbeille (soft deleted) | Haute |
| 4.1.4 | Recherche textuelle | Filtre sur libelle et description | Haute |
| 4.1.5 | Tri des colonnes | Clic sur l'en-tete trie ASC/DESC | Moyenne |
| 4.1.6 | Pagination | Navigation entre les pages, compteur d'elements | Haute |

### 4.2 Creation de Site

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 4.2.1 | Bouton "Ajouter un site" visible pour Admin | Bouton present pour Super Admin et Administrateur | Critique |
| 4.2.2 | Bouton absent pour Observateur | Bouton cache si pas de permission de creation | Critique |
| 4.2.3 | Modal de creation : champ Libelle (requis) | Validation : requis, string, max 255 caracteres | Haute |
| 4.2.4 | Modal de creation : champ Description (optionnel) | Champ texte optionnel | Haute |
| 4.2.5 | Soumission valide | Site cree, toast de succes, tableau actualise | Haute |
| 4.2.6 | Soumission avec libelle vide | Erreur de validation affichee | Haute |

### 4.3 Detail d'un Site

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 4.3.1 | Clic sur une ligne | Modal de details ouvre avec toutes les informations | Haute |
| 4.3.2 | Affichage du nombre de zones | Compteur de zones dependantes | Moyenne |

### 4.4 Modification de Site

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 4.4.1 | Bouton Modifier visible pour Admin | Icone crayon present | Haute |
| 4.4.2 | Modal d'edition pre-remplie | Champs remplis avec les valeurs actuelles | Haute |
| 4.4.3 | Sauvegarde des modifications | Donnees mises a jour, toast de succes | Haute |

### 4.5 Suppression de Site

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 4.5.1 | Bouton Supprimer visible pour Admin | Icone poubelle present | Haute |
| 4.5.2 | Confirmation de suppression | Dialog de confirmation avant suppression | Haute |
| 4.5.3 | Suppression d'un site SANS zones | Soft delete reussi, site passe dans l'onglet "Supprimes" | Haute |
| 4.5.4 | Suppression d'un site AVEC zones | Erreur 422 : "Impossible de supprimer, X zones dependantes" | Critique |
| 4.5.5 | Dialog d'erreur de dependance | Affiche la liste des zones bloquantes | Haute |

### 4.6 Restauration de Site

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 4.6.1 | Bouton Restaurer dans l'onglet "Supprimes" | Bouton visible sur chaque site supprime | Haute |
| 4.6.2 | Restauration reussie | Site revient dans l'onglet "Actifs" | Haute |

### 4.7 Suppression Definitive

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 4.7.1 | Suppression definitive d'un site sans zones | Site supprime de la base de donnees | Haute |
| 4.7.2 | Suppression definitive d'un site avec zones (meme en corbeille) | Erreur : zones encore presentes | Haute |

---

## MODULE 5 : GESTION DES ZONES (`/zones`)

### 5.1 Liste des Zones

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 5.1.1 | Affichage du tableau | Colonnes : Code, Nom, Site parent, Nombre de batiments, Date creation | Haute |
| 5.1.2 | Onglet actifs / supprimes | Separation des zones actives et soft deleted | Haute |
| 5.1.3 | Filtre par site | Dropdown filtrant les zones par site parent | Haute |
| 5.1.4 | Recherche textuelle | Filtre sur libelle et description | Haute |
| 5.1.5 | Pagination | Pagination fonctionnelle | Haute |

### 5.2 CRUD Zones

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 5.2.1 | Creation : champ Libelle (requis) | Validation : requis, string, max 255 | Haute |
| 5.2.2 | Creation : selecteur Site parent (requis) | Combobox avec sites existants, validation `exists:sites,id` | Haute |
| 5.2.3 | Creation : champ Description (optionnel) | Texte optionnel | Moyenne |
| 5.2.4 | Modification d'une zone | Champs pre-remplis, sauvegarde partielle autorisee | Haute |
| 5.2.5 | Suppression d'une zone SANS batiments | Soft delete reussi | Haute |
| 5.2.6 | Suppression d'une zone AVEC batiments | Erreur 422 avec compte des batiments bloquants | Critique |
| 5.2.7 | Restauration d'une zone supprimee | Retour dans la liste active | Haute |

---

## MODULE 6 : GESTION DES BATIMENTS (`/batiments`)

### 6.1 Liste et Filtres

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 6.1.1 | Affichage du tableau | Colonnes : Code, Nom, Zone parent, Nombre de salles, Description | Haute |
| 6.1.2 | Filtre par zone (hierarchique : Site > Zone) | Dropdown Zone filtrant les batiments | Haute |
| 6.1.3 | Recherche textuelle sur nom et description | Filtre fonctionnel | Haute |
| 6.1.4 | Support soft delete et restauration | Onglets actifs/supprimes | Haute |

### 6.2 CRUD Batiments

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 6.2.1 | Creation : champ Nom (requis, max 255) | Validation appliquee | Haute |
| 6.2.2 | Creation : selecteur Zone (optionnel, `exists:zones,id`) | Combobox avec zones existantes | Haute |
| 6.2.3 | Creation : champ Description (optionnel) | Texte libre | Moyenne |
| 6.2.4 | Creation reservee aux Administrateurs | `isAdministrator()` verifie cote serveur | Critique |
| 6.2.5 | Modification partielle | Mise a jour d'un seul champ fonctionne | Haute |
| 6.2.6 | Suppression soft delete | Batiment passe en corbeille | Haute |
| 6.2.7 | Restauration | Batiment restaure avec sa relation zone | Haute |

### 6.3 Import CSV Batiments

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 6.3.1 | Upload fichier CSV (max 2 Mo, formats csv/txt) | Fichier accepte si valide | Haute |
| 6.3.2 | En-tetes CSV attendus : nom, description | Parsing correct avec nettoyage BOM | Haute |
| 6.3.3 | Creation de nouveaux batiments | Compteur "crees" dans le resultat | Haute |
| 6.3.4 | Mise a jour de batiments existants (meme nom) | Compteur "mis a jour" dans le resultat | Haute |
| 6.3.5 | Restauration de batiments supprimes (meme nom) | Batiment restaure automatiquement | Moyenne |
| 6.3.6 | Rapport d'erreurs par ligne | Compteur "erreurs" avec detail par ligne | Haute |
| 6.3.7 | Rejet de fichier non-CSV | Erreur de validation 422 | Haute |

---

## MODULE 7 : GESTION DES SALLES (`/salles`)

### 7.1 Liste et Filtres

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 7.1.1 | Affichage du tableau | Colonnes : Code, Nom, Batiment, Etage, Type, Capacite, Etat | Haute |
| 7.1.2 | Filtre par etat (Actif, Inactif, Maintenance) | Dropdown filtrant | Haute |
| 7.1.3 | Filtre par batiment | Combobox hierarchique | Haute |
| 7.1.4 | Recherche sur nom, etage, type | Filtre textuel | Haute |
| 7.1.5 | Indicateur de capacite colore | Vert si < 50%, Jaune 50-80%, Rouge > 80% | Moyenne |

### 7.2 CRUD Salles

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 7.2.1 | Creation : Nom (requis, max 255) | Validation appliquee | Haute |
| 7.2.2 | Creation : Batiment (requis, `exists:batiments,id`) | Combobox obligatoire | Haute |
| 7.2.3 | Creation : Etage (optionnel, entier, defaut 0) | Champ numerique | Moyenne |
| 7.2.4 | Creation : Capacite (requis, entier, min 1) | Validation min 1 | Haute |
| 7.2.5 | Creation : Type (requis, max 255) | Ex: Bureau, Salle serveur, Local technique | Haute |
| 7.2.6 | Creation : Etat (optionnel, valeurs: Actif/Inactif/Maintenance) | Dropdown, defaut "Actif" | Haute |
| 7.2.7 | Creation reservee aux Administrateurs | Verification serveur `isAdministrator()` | Critique |
| 7.2.8 | Import CSV salles (nom, batiment, etage, capacite, type, description) | Import avec recherche batiment par nom | Haute |

---

## MODULE 8 : GESTION DES ARMOIRES / COFFRETS (`/armoires`)

### 8.1 Liste des Armoires

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 8.1.1 | Affichage des cartes d'armoires | Code, Nom, Statut, Batiment, Salle, Nombre d'equipements | Haute |
| 8.1.2 | Filtre par batiment | Dropdown filtrant par batiment | Haute |
| 8.1.3 | Filtre par salle | Dropdown dependant du batiment selectionne | Haute |
| 8.1.4 | Filtre par statut (active/inactive) | Dropdown | Haute |
| 8.1.5 | Bouton "Effacer les filtres" | Reinitialise tous les filtres | Moyenne |
| 8.1.6 | Recherche textuelle sur nom et code | Filtre fonctionnel | Haute |

### 8.2 Creation d'Armoire

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 8.2.1 | Champ Nom (requis) | Validation obligatoire | Haute |
| 8.2.2 | Champ Modele (optionnel) | Texte libre | Moyenne |
| 8.2.3 | Upload Photo (optionnel, image, max 4 Mo) | Formats : jpeg, png, jpg, gif, webp | Haute |
| 8.2.4 | Apercu de la photo uploadee | Image previsualise avec bouton supprimer | Moyenne |
| 8.2.5 | Selecteur Salle (requis) | Combobox avec salles disponibles | Haute |
| 8.2.6 | Auto-remplissage hierarchie (site, zone, batiment) depuis la salle | Selection salle remplit automatiquement les parents | Haute |
| 8.2.7 | Section GPS depliable (latitude, longitude) | Champs numeriques optionnels dans une section collapsible | Basse |
| 8.2.8 | Champ Emplacement (optionnel) | Description de l'emplacement physique | Basse |
| 8.2.9 | Selecteur Statut (active/inactive, defaut active) | Dropdown | Haute |
| 8.2.10 | Generation automatique du code (CF-001, CF-002...) | Code auto-incremente au format CF-XXX | Haute |
| 8.2.11 | Generation automatique du QR code SVG | QR code pointe vers `{frontend}/armoires/{code}/details` | Haute |
| 8.2.12 | Auto-generation du nom basee sur salle et compteur | Nom sugere automatiquement | Moyenne |

### 8.3 Detail d'une Armoire (`/armoires/:code/details`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 8.3.1 | Affichage des informations generales | Code, nom, modele, statut, emplacement, site, zone, batiment, salle | Haute |
| 8.3.2 | Affichage du QR code | QR code SVG affichable et scannable | Haute |
| 8.3.3 | Onglet Equipements | Tableau des equipements dans l'armoire avec pagination | Haute |
| 8.3.4 | Onglet Ports | Tableau des ports des equipements de l'armoire | Haute |
| 8.3.5 | Onglet Liaisons | Cartes de connexions avec details | Haute |
| 8.3.6 | Onglet Schema Reseau (Mapping) | Visualisation vis-network du reseau interne | Haute |
| 8.3.7 | Bouton retour a la liste | Navigation vers `/armoires` | Moyenne |
| 8.3.8 | Bouton Modifier l'armoire | Ouvre EditModal pour le coffret | Haute |
| 8.3.9 | Ajout d'equipement depuis le detail | Formulaire AddEquipmentForm avec coffret_id pre-rempli | Haute |
| 8.3.10 | Ajout de port depuis le detail | Formulaire AddPortForm avec coffret pre-selectionne | Haute |
| 8.3.11 | Ajout de liaison depuis le detail | Formulaire AddLiaisonForm avec coffret pre-selectionne | Haute |
| 8.3.12 | Highlight du switch principal | Switch principal visuellement distingue | Moyenne |

### 8.4 Photo d'Armoire

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 8.4.1 | Recuperation de la photo (`GET /coffrets/{id}/photo`) | Image servie avec MIME type correct | Haute |
| 8.4.2 | Cache de la photo (1 an) | Header Cache-Control present | Basse |
| 8.4.3 | Photo inexistante | Retour 404 | Moyenne |

### 8.5 Import CSV Armoires

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 8.5.1 | En-tetes CSV : nom, batiment, salle, long, lat, status | Parsing correct | Haute |
| 8.5.2 | Recherche batiment et salle par nom | Association correcte | Haute |
| 8.5.3 | Generation code et QR code pour nouveaux imports | Auto-generation | Haute |
| 8.5.4 | Mise a jour si armoire existante (meme nom) | Update sans duplication | Haute |

---

## MODULE 9 : GESTION DES EQUIPEMENTS (`/equipements`)

### 9.1 Liste des Equipements

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.1.1 | Affichage du tableau | Code, Nom, Type (badge colore), Statut, Batiment, Salle, Armoire, IP, MAC, Manageable | Haute |
| 9.1.2 | Icones par type d'equipement | Switch, routeur, serveur, onduleur, climatiseur, prise murale : chacun a son icone | Moyenne |
| 9.1.3 | Badge de statut colore | Actif (vert), Inactif (rouge), Maintenance (orange) | Moyenne |
| 9.1.4 | Filtre par statut | Dropdown actif/inactif/maintenance | Haute |
| 9.1.5 | Filtre par type d'equipement | Dropdown avec tous les types | Haute |
| 9.1.6 | Filtre par armoire | Combobox | Haute |
| 9.1.7 | Filtre par batiment | Combobox | Haute |
| 9.1.8 | Filtre par salle | Combobox | Haute |
| 9.1.9 | Recherche textuelle sur nom | Filtre fonctionnel | Haute |
| 9.1.10 | Pagination configurable | 15 elements par defaut, max 100 | Haute |

### 9.2 Creation d'Equipement Standard

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.2.1 | Champ Nom (requis) | Auto-generation possible basee sur type et compteur | Haute |
| 9.2.2 | Selecteur Type (requis) | switch, routeur, serveur, onduleur, climatiseur, autre | Haute |
| 9.2.3 | Champ Modele (optionnel) | Texte libre | Moyenne |
| 9.2.4 | Champ Fabricant (optionnel) | Texte libre | Moyenne |
| 9.2.5 | Champ Numero de serie (optionnel) | Texte libre | Moyenne |
| 9.2.6 | Selecteur Type reseau (optionnel) | IT ou OT | Moyenne |
| 9.2.7 | Champ Adresse IP (optionnel, validation IP) | Validation format IP valide | Haute |
| 9.2.8 | Champ Adresse MAC (optionnel, regex XX:XX:XX:XX:XX:XX) | Validation regex si rempli | Haute |
| 9.2.9 | Selecteur Armoire (optionnel) | Combobox avec armoires, auto-remplit la salle | Haute |
| 9.2.10 | Selecteur Salle (requis, `exists:salles,id`) | Obligatoire, desactive si armoire selectionnee | Haute |
| 9.2.11 | Champ Nombre de ports (optionnel, >= 0) | Pour les switches et routeurs | Haute |
| 9.2.12 | Toggle "Manageable" | Visible uniquement pour type switch | Haute |
| 9.2.13 | Toggle "Principal" | Visible uniquement pour type switch | Haute |
| 9.2.14 | Selecteur VLAN (combobox filtrable) | Affiche nom LAN + ID VLAN | Moyenne |
| 9.2.15 | Champ Description (optionnel) | Textarea | Basse |
| 9.2.16 | Code auto-genere (EQ-XXX) | Format EQ-001, EQ-002... si non fourni | Haute |
| 9.2.17 | QR code auto-genere | Pointe vers `{frontend}/equipements/{code}/details` | Haute |

### 9.3 Creation de Prise Murale

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.3.1 | Champs specifiques visibles si type='prise_murale' | Type prise, Emplacement, Switch, Port du switch | Haute |
| 9.3.2 | Selecteur Type de prise | RJ45, Fibre, Coaxial | Haute |
| 9.3.3 | Champ Emplacement (optionnel) | Description emplacement physique | Moyenne |
| 9.3.4 | Selecteur Switch connecte (optionnel) | Combobox des switches disponibles | Haute |
| 9.3.5 | Selecteur Port du switch (optionnel) | Filtre par switch selectionne, compteur disponibilite | Haute |
| 9.3.6 | Champs Media et Longueur liaison (optionnel) | Si connexion switch renseignee | Moyenne |
| 9.3.7 | Auto-generation nom (PM-NomSalle-##) | Code format PM-XXXX | Haute |
| 9.3.8 | Creation automatique du port associe (downlink) | Transaction : equipement + port + liaison optionnelle | Haute |
| 9.3.9 | Masquage des champs standard (modele, fabricant, serie) | Non pertinents pour prises murales | Moyenne |

### 9.4 Detail d'un Equipement (`/equipements/:code/details`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.4.1 | Informations generales | Tout l'equipement avec badges type, statut, manageable, principal | Haute |
| 9.4.2 | Affichage QR code | QR scannable | Haute |
| 9.4.3 | Onglet Ports | Liste des ports de l'equipement avec pagination | Haute |
| 9.4.4 | Onglet Liaisons / Connexions | ConnectionsSection avec cartes depliables | Haute |
| 9.4.5 | Onglet VLANs (uniquement pour switches manageables) | Configuration VLAN visible | Haute |
| 9.4.6 | Chaine de dependance (lazy-loaded) | Visualisation upstream/downstream via vis-network | Haute |
| 9.4.7 | Recherche par code (`GET /equipements/find-by-code`) | Retourne l'equipement ou 404 | Haute |

### 9.5 Switch Principal

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.5.1 | Definir comme switch principal | `POST /equipements/{id}/set-principal` | Haute |
| 9.5.2 | Un seul principal par armoire | Ancien principal perd le flag | Haute |
| 9.5.3 | Rejet si type != switch | Erreur 422 | Haute |
| 9.5.4 | Recuperer le switch principal d'un coffret | `GET /coffrets/{id}/principal-switch` | Haute |

### 9.6 Gestion VLANs sur Switch

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.6.1 | Lister les VLANs d'un switch (`GET /equipements/{id}/vlans`) | Liste des LANs attaches | Haute |
| 9.6.2 | Erreur si equipement non manageable | 422 retourne | Haute |
| 9.6.3 | Attacher un VLAN (`POST /equipements/{id}/vlans`) | Relation pivot creee avec is_tagged et ports | Haute |
| 9.6.4 | VLAN deja attache | Erreur 422 "deja configure" | Haute |
| 9.6.5 | Modifier config VLAN (`PUT /equipements/{id}/vlans`) | Pivot mis a jour (is_tagged, ports) | Haute |
| 9.6.6 | Detacher un VLAN (`DELETE /equipements/{id}/vlans`) | Relation pivot supprimee | Haute |

### 9.7 Analyse d'Impact et Dependances

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.7.1 | Chaine de dependance (`GET /equipements/{id}/dependency-chain`) | JSON avec upstream[] et downstream[] | Haute |
| 9.7.2 | Profondeur maximale (defaut 10) | Pas de boucle infinie | Critique |
| 9.7.3 | Analyse d'impact (`GET /equipements/{id}/impact-analysis`) | Severite calculee (none/low/medium/high/critical) | Haute |
| 9.7.4 | Seuils de severite | 0=none, 1-2=low, 3-5=medium, 6-10=high, >10=critical | Haute |

### 9.8 Prises Murales

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 9.8.1 | Liste prises murales (`GET /prises-murales`) | Filtre par salle et batiment | Haute |
| 9.8.2 | Statistiques prises (`GET /prises-murales/stats`) | Total, actives, inactives, connectees, non connectees | Haute |
| 9.8.3 | Modification prise | Mise a jour du port associe si nom change | Haute |
| 9.8.4 | Rejet modification si type != prise_murale | Erreur 422 | Haute |

---

## MODULE 10 : GESTION DES PORTS (`/ports`)

### 10.1 Liste et Filtres

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 10.1.1 | Affichage du tableau | Label, Equipement, Type connexion, Genre, Vitesse, PoE, Statut, VLAN | Haute |
| 10.1.2 | Filtre par equipement | Combobox hierarchique | Haute |
| 10.1.3 | Filtre par genre (uplink/downlink) | Dropdown | Haute |
| 10.1.4 | Filtre par statut (actif/inactif/reserve) | Dropdown | Haute |
| 10.1.5 | Recherche sur port_label et device_name | Filtre textuel | Haute |

### 10.2 Creation de Port

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 10.2.1 | Selecteur Equipement (requis, `exists:equipements,id`) | Combobox obligatoire | Haute |
| 10.2.2 | Champ Label port (requis) | Auto-genere : Gi0/X pour switches, PX pour autres | Haute |
| 10.2.3 | Selecteur Vitesse | Auto, 10 Mbps, 100 Mbps, 1 Gbps, 10 Gbps, 40 Gbps, 100 Gbps | Haute |
| 10.2.4 | Toggle PoE | Oui/Non, defaut Non | Haute |
| 10.2.5 | Selecteur Type reseau | IT ou OT, defaut IT | Moyenne |
| 10.2.6 | Selecteur Statut | Actif, Inactif, Reserve, defaut Actif | Haute |
| 10.2.7 | Selecteur Genre | Downlink ou Uplink, defaut Downlink | Haute |
| 10.2.8 | Champs Uplink/Downlink (descriptions, optionnels) | Texte libre | Basse |
| 10.2.9 | Selecteur VLAN | Dropdown avec LANs actifs (nom + ID VLAN) | Haute |
| 10.2.10 | Auto-numerotation du label | Comptage des ports existants pour increment | Haute |

### 10.3 Modification et Suppression

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 10.3.1 | Edition : tous les champs modifiables | Mise a jour partielle | Haute |
| 10.3.2 | Suppression soft delete | Port passe en corbeille | Haute |
| 10.3.3 | Restauration d'un port supprime | Port restaure avec relations | Haute |

---

## MODULE 11 : GESTION DES LIAISONS (`/liaisons`)

### 11.1 Liste et Filtres

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 11.1.1 | Affichage tableau/cartes | Label, Media, Port source > Port destination, Longueur, Statut | Haute |
| 11.1.2 | Filtre par media (Fibre, Cuivre, MPLS, VPN, Ethernet, Satellite) | Dropdown | Haute |
| 11.1.3 | Filtre par statut (actif/inactif) | Dropdown | Haute |
| 11.1.4 | Filtre par type connexion (appareil-appareil, appareil-endpoint) | Dropdown | Moyenne |
| 11.1.5 | Recherche sur label et media | Filtre textuel | Haute |

### 11.2 Creation de Liaison

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 11.2.1 | Champ Label (requis) | Texte obligatoire | Haute |
| 11.2.2 | Selecteur Direction | down (downstream) ou up (upstream) | Haute |
| 11.2.3 | Selecteur Media (requis) | Fibre, Cuivre, MPLS, VPN, Ethernet, Satellite | Haute |
| 11.2.4 | Selecteur Type cable (optionnel) | Cat5e, Cat6, Cat6a, Cat7, Fibre monomode, Fibre multimode, Coaxial | Moyenne |
| 11.2.5 | Selecteur Equipement source (requis) | Combobox | Haute |
| 11.2.6 | Selecteur Port source (requis, filtre par equipement) | Uniquement ports disponibles (non utilises) | Critique |
| 11.2.7 | Compteur de ports disponibles (source) | "X/Y disponibles" avec couleur rouge si 0 | Haute |
| 11.2.8 | Selecteur Equipement destination (requis) | Combobox | Haute |
| 11.2.9 | Selecteur Port destination (requis, filtre par equipement) | Uniquement ports disponibles | Critique |
| 11.2.10 | Compteur de ports disponibles (destination) | Meme affichage que source | Haute |
| 11.2.11 | Champ Longueur en metres (optionnel) | Nombre | Moyenne |
| 11.2.12 | Toggle Statut (actif/inactif, defaut actif) | Toggle switch | Haute |

### 11.3 Validations de Liaison

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 11.3.1 | Port source != Port destination | Meme port interdit des deux cotes | Critique |
| 11.3.2 | Port source non utilise dans une autre liaison | Erreur 422 si deja connecte | Critique |
| 11.3.3 | Port destination non utilise dans une autre liaison | Erreur 422 si deja connecte | Critique |
| 11.3.4 | Ports soft-deleted exclus de la selection | Ne pas proposer les ports supprimes | Haute |
| 11.3.5 | Message "Aucun port disponible" | Si tous les ports sont utilises | Haute |

### 11.4 Section Connexions (Vue Detail)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 11.4.1 | Cartes de connexion depliables | Chevron pour afficher les details | Haute |
| 11.4.2 | Icone cable variable par media | Fibre, WiFi, Cuivre differencies | Moyenne |
| 11.4.3 | Classification appareil-appareil / appareil-endpoint | Groupement automatique | Moyenne |
| 11.4.4 | Badge de statut sur chaque connexion | Actif en vert, Inactif en rouge | Moyenne |

---

## MODULE 12 : GESTION DES LANS / VLANS (`/vlans`)

### 12.1 Liste des LANs

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 12.1.1 | Affichage du tableau | Nom, Subnet, VLAN ID, Gateway, Statut, Description | Haute |
| 12.1.2 | Filtre par statut (active/inactive/maintenance) | Dropdown | Haute |
| 12.1.3 | Recherche sur nom, subnet, vlan_id, site | Filtre textuel | Haute |

### 12.2 Creation de LAN

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 12.2.1 | Selecteur Switch manageable (requis) | Dropdown charge les switches manageables | Haute |
| 12.2.2 | Info switch selectionne | Nom, code, IP, armoire affiches | Moyenne |
| 12.2.3 | Champ Nom (requis) | Texte obligatoire | Haute |
| 12.2.4 | Champ Subnet (requis, format CIDR) | Ex: 10.0.1.0/24 | Haute |
| 12.2.5 | Champ VLAN ID (requis, entier) | Nombre entier | Haute |
| 12.2.6 | Champ Gateway (optionnel) | Adresse IP | Haute |
| 12.2.7 | Selecteur Statut (requis) | active, inactive, maintenance | Haute |
| 12.2.8 | Champ Description (optionnel) | Textarea | Basse |
| 12.2.9 | Auto-extraction batiment/salle depuis l'equipement | Si equipement dans un coffret, copie ses coordonnees | Haute |
| 12.2.10 | Attachement automatique au switch | Relation many-to-many creee avec is_tagged=true | Haute |

### 12.3 Modification et Suppression

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 12.3.1 | Modification partielle du LAN | Mise a jour des champs fournis | Haute |
| 12.3.2 | Suppression definitive (hard delete) | LAN supprime de la base | Haute |

---

## MODULE 13 : CARTOGRAPHIE RESEAU (`/cartographie-lan`)

### 13.1 Visualisation

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 13.1.1 | Affichage de la topologie reseau | Noeuds = equipements, Aretes = liaisons | Haute |
| 13.1.2 | Noeuds colores par type | Core, Distribution, Acces, Endpoint differencies | Haute |
| 13.1.3 | Aretes colorees par media | Fibre, Cuivre, Wireless differencies | Haute |
| 13.1.4 | Fleches directionnelles pour liaisons unidirectionnelles | Fleche visible | Moyenne |
| 13.1.5 | Legende des types et connexions | Section legende visible | Moyenne |

### 13.2 Controles d'Interaction

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 13.2.1 | Zoom avant/arriere | Boutons + molette souris | Haute |
| 13.2.2 | Pan (defilement) | Drag sur le canvas | Haute |
| 13.2.3 | Ajuster a la vue | Bouton "Fit to View" recentre tout | Haute |
| 13.2.4 | Reinitialiser la vue | Bouton reset | Moyenne |
| 13.2.5 | Clic sur un noeud | Modal details de l'equipement | Haute |
| 13.2.6 | Clic sur une arete | Modal details de la liaison | Haute |
| 13.2.7 | Drag d'un noeud | Repositionnement interactif | Moyenne |
| 13.2.8 | Survol d'un noeud | Tooltip avec infos basiques | Basse |

### 13.3 Filtres de Visualisation

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 13.3.1 | Filtre par LAN | Affiche uniquement un LAN | Haute |
| 13.3.2 | Filtre par Batiment | Filtre geographique | Haute |
| 13.3.3 | Filtre par Salle | Filtre geographique | Haute |
| 13.3.4 | Filtre par Type d'equipement | Montre uniquement les switches, routeurs, etc. | Haute |
| 13.3.5 | Toggle Labels | Afficher/masquer les etiquettes | Basse |
| 13.3.6 | Toggle Connexions | Afficher/masquer les liaisons | Basse |

### 13.4 Layouts et Export

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 13.4.1 | Layout automatique (hierarchique) | Arrangement intelligent des noeuds | Haute |
| 13.4.2 | Layout horizontal/vertical/circulaire | Options de disposition | Moyenne |
| 13.4.3 | Export CSV | Donnees noeuds et liens | Haute |
| 13.4.4 | Export PDF | Representation visuelle | Haute |
| 13.4.5 | Export PNG | Capture d'ecran du canvas | Moyenne |

---

## MODULE 14 : GESTION DES UTILISATEURS (`/users`)

### 14.1 Liste des Utilisateurs

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 14.1.1 | Affichage du tableau | Nom, Prenom, Email, Username, Roles (badges), Statut, Derniere connexion | Haute |
| 14.1.2 | Filtre par role | Multiselect : Super Admin, Administrateur, Technicien, Observateur | Haute |
| 14.1.3 | Filtre par statut (actif/inactif) | Dropdown | Haute |
| 14.1.4 | Recherche sur nom, prenom, email, username | Filtre textuel | Haute |

### 14.2 Creation d'Utilisateur

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 14.2.1 | Permission requise : `utilisateurs.creer` | Bouton absent si pas de permission | Critique |
| 14.2.2 | Champ Nom (requis, max 255) | Validation | Haute |
| 14.2.3 | Champ Prenom (optionnel) | Texte | Haute |
| 14.2.4 | Champ Username (requis, unique) | Validation unicite | Haute |
| 14.2.5 | Champ Email (requis, format email, unique) | Validation format et unicite | Haute |
| 14.2.6 | Champ Telephone (optionnel, max 20) | Format telephone | Moyenne |
| 14.2.7 | Champ Mot de passe (requis + confirmation) | Regles de complexite Laravel | Haute |
| 14.2.8 | Champ Confirmation mot de passe | Doit correspondre | Haute |
| 14.2.9 | Checkboxes Roles | Selection multiple parmi les roles existants | Haute |
| 14.2.10 | Toggle Statut (actif/inactif, defaut actif) | Toggle switch | Haute |

### 14.3 Modification d'Utilisateur

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 14.3.1 | Permission requise : `utilisateurs.modifier` | Verification serveur | Critique |
| 14.3.2 | Mot de passe optionnel (uniquement si rempli) | Si vide, mot de passe inchange | Haute |
| 14.3.3 | Username et Email : unicite sauf pour l'utilisateur courant | `unique:users,username,{id}` | Haute |
| 14.3.4 | Modification des roles | Sync via Spatie syncRoles | Haute |

### 14.4 Suppression d'Utilisateur

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 14.4.1 | Permission requise : `utilisateurs.supprimer` | Verification serveur | Critique |
| 14.4.2 | Impossible de se supprimer soi-meme | Erreur 403 "Cannot delete yourself" | Critique |
| 14.4.3 | Roles supprimes avant deletion | Nettoyage des associations | Haute |
| 14.4.4 | Suppression definitive (hard delete) | Utilisateur efface de la base | Haute |

### 14.5 Gestion du Statut

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 14.5.1 | Toggle actif/inactif (`POST /users/{id}/toggle-status`) | Bascule `is_active` | Haute |
| 14.5.2 | Impossible de se desactiver soi-meme | Erreur 403 | Critique |
| 14.5.3 | Utilisateur desactive ne peut plus se connecter | Login refuse avec message specifique | Critique |

### 14.6 Attribution Roles et Permissions

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 14.6.1 | Attribuer des roles (`POST /users/{id}/roles`) | Sync roles via Spatie | Haute |
| 14.6.2 | Permission requise : `roles.modifier` | Verification serveur | Critique |
| 14.6.3 | Attribuer permissions directes (`POST /users/{id}/permissions`) | Sync permissions directes | Haute |
| 14.6.4 | Permission requise : `permissions.attribuer` | Verification serveur | Critique |

---

## MODULE 15 : GESTION DES ROLES (`/roles`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 15.1 | Liste des roles | Nom, Description, Nombre de permissions, Nombre d'utilisateurs | Haute |
| 15.2 | Creation d'un role | Nom (unique, requis), Description | Haute |
| 15.3 | Gestion des permissions par role (modal) | Interface accordeon par module avec checkboxes | Haute |
| 15.4 | "Tout selectionner" par module | Coche toutes les permissions du module | Haute |
| 15.5 | "Tout deselectionner" par module | Decoche toutes les permissions du module | Haute |
| 15.6 | Modules disponibles | utilisateurs, armoires, equipements, ports, liaisons, sites, zones, batiments, salles, lans, roles, modifications, cartographie, dashboard, maintenance, logs | Haute |
| 15.7 | Actions par module | voir, creer, modifier, supprimer, restaurer, importer, exporter, attribuer, executer, valider | Haute |

---

## MODULE 16 : GESTION DES PERMISSIONS (`/permissions`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 16.1 | Vue lecture seule des permissions | Liste en accordeon par module, non editable | Haute |
| 16.2 | Recherche sur nom/description | Filtre textuel | Haute |
| 16.3 | Filtre par module | Dropdown par module | Haute |
| 16.4 | Filtre par type d'action | voir/creer/modifier/supprimer/restaurer/importer/exporter | Haute |
| 16.5 | Compteur total de permissions | Affiche dans le header | Moyenne |
| 16.6 | Legende des types d'action | Code couleur pour chaque type | Basse |

---

## MODULE 17 : WORKFLOW DES MODIFICATIONS (`/modifications`)

### 17.1 Creation de Demande

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 17.1.1 | Selecteur Coffret (requis, `exists:coffrets,id`) | Combobox | Haute |
| 17.1.2 | Selecteur Type modification (requis) | ajout_port, ajout_equipement, modification_connexion, suppression_port, suppression_equipement, changement_statut_port | Haute |
| 17.1.3 | Champ Description (requis) | Textarea detaillee | Haute |
| 17.1.4 | Champ Raison (requis) | Justification de la demande | Haute |
| 17.1.5 | Upload Photo avant (optionnel, image, max 4 Mo) | Preview de l'image | Haute |
| 17.1.6 | Upload Photo apres (optionnel, image, max 4 Mo) | Preview de l'image | Haute |
| 17.1.7 | Date d'intervention (requis, date) | Date picker | Haute |
| 17.1.8 | Heure d'intervention (requis, format HH:mm) | Time picker | Haute |
| 17.1.9 | Selecteur Port (optionnel) | Si la modification concerne un port | Moyenne |
| 17.1.10 | Selecteur Equipement (optionnel) | Si la modification concerne un equipement | Moyenne |
| 17.1.11 | Statut auto = "en_attente" | Set automatiquement | Haute |
| 17.1.12 | User auto = utilisateur connecte | Set automatiquement | Haute |

### 17.2 Validation : Une Seule Demande Pendante par Coffret

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 17.2.1 | Verifier qu'aucune demande "en_attente" n'existe pour le coffret | Si existe, erreur 422 | Critique |
| 17.2.2 | Message d'erreur explicite | "Une demande en attente existe deja pour cette armoire" | Haute |

### 17.3 Notifications Automatiques

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 17.3.1 | Creation : notification aux admins | Tous les Super Admin et Administrateur actifs notifies | Haute |
| 17.3.2 | Contenu notification creation | "Une nouvelle demande de {type} a ete soumise sur le coffret {nom} par {user}" | Haute |
| 17.3.3 | Approbation : notification au demandeur | Createur de la demande notifie | Haute |
| 17.3.4 | Rejet : notification au demandeur | Inclut la raison du rejet | Haute |
| 17.3.5 | Demande d'info : notification au demandeur | Inclut le commentaire | Haute |

### 17.4 Validation des Modifications (`/validation-modifications`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 17.4.1 | Acces reserve aux Administrateurs | Middleware role verifie | Critique |
| 17.4.2 | Liste des modifications "en_attente" uniquement | Ordonnees par date decroissante | Haute |
| 17.4.3 | Bouton Approuver | Dialog avec commentaire optionnel | Haute |
| 17.4.4 | Bouton Rejeter | Dialog avec raison requise (min 10 caracteres) | Haute |
| 17.4.5 | Bouton Demander plus d'info | Dialog avec question requise (min 10 caracteres) | Haute |
| 17.4.6 | Validation min 10 caracteres | Bouton desactive tant que < 10 chars | Haute |
| 17.4.7 | Approbation : statut = "approuvee" | + validated_by + validated_at | Haute |
| 17.4.8 | Rejet : statut = "rejetee" | + commentaire enregistre | Haute |
| 17.4.9 | Demande info : statut = "en_revision" | + commentaire enregistre | Haute |

### 17.5 Historique des Modifications (`/modification-history`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 17.5.1 | Liste historique (approuvees et rejetees) | Tableau avec filtres | Haute |
| 17.5.2 | Filtre par coffret/equipement | Combobox | Haute |
| 17.5.3 | Filtre par type de modification | Dropdown | Haute |
| 17.5.4 | Filtre par statut (approuvee/rejetee/rollback) | Dropdown | Haute |
| 17.5.5 | Filtre par date (plage de/a) | Date pickers | Haute |
| 17.5.6 | Visualisation photos avant/apres | Gallery dans le modal de details | Haute |
| 17.5.7 | Export CSV de l'historique d'un coffret | Fichier CSV avec BOM UTF-8, separateur point-virgule | Haute |
| 17.5.8 | Export PDF de l'historique | JSON structure pour generation PDF client | Haute |

### 17.6 Rollback

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 17.6.1 | Bouton Rollback sur modification approuvee | Dialog avec raison requise (min 10 chars) | Haute |
| 17.6.2 | Creation modification inverse automatique | ajout_port → suppression_port, etc. | Haute |
| 17.6.3 | Approbation auto de la modification inverse | Statut "approuvee" immediat | Haute |
| 17.6.4 | Commentaire rollback sur la modification originale | Trace de l'annulation | Haute |
| 17.6.5 | Acces reserve aux Admin ou Directeur | Verification cote serveur | Critique |
| 17.6.6 | Rejet si modification non approuvee | Erreur 422 | Haute |

---

## MODULE 18 : GESTION DES MAINTENANCES (`/maintenances`)

### 18.1 Liste et Filtres

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 18.1.1 | Affichage du tableau | ID, Equipement, Type, Priorite, Date, Heure, Duree, Technicien, Statut | Haute |
| 18.1.2 | Filtre par statut | planifiee, en_cours, terminee, annulee | Haute |
| 18.1.3 | Filtre par priorite | basse, moyenne, haute, critique | Haute |
| 18.1.4 | Recherche sur type, technicien, description | Filtre textuel | Haute |
| 18.1.5 | Cartes statistiques en haut | Total planifiees, En cours, Terminees ce mois, En retard | Moyenne |

### 18.2 Planification de Maintenance

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 18.2.1 | Selecteur Equipement (optionnel) | Combobox | Haute |
| 18.2.2 | Champ Type (requis, max 255) | Ex: inspection, nettoyage, remplacement, mise a jour | Haute |
| 18.2.3 | Date de debut (requis) | Date picker | Haute |
| 18.2.4 | Heure de debut (requis, format HH:mm) | Time picker | Haute |
| 18.2.5 | Duree estimee (requis, max 255) | Texte descriptif (ex: "2 heures") | Haute |
| 18.2.6 | Technicien (requis, max 255) | Nom du technicien | Haute |
| 18.2.7 | Priorite (requis) | basse, moyenne, haute, critique | Haute |
| 18.2.8 | Description (requis) | Textarea detaillee | Haute |
| 18.2.9 | Statut par defaut = "planifiee" | Auto-set | Haute |

### 18.3 Cycle de Vie de la Maintenance

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 18.3.1 | Passage planifiee → en_cours | Via modification du statut | Haute |
| 18.3.2 | Passage en_cours → terminee | Via modification du statut | Haute |
| 18.3.3 | Passage planifiee → annulee | Via modification du statut | Haute |
| 18.3.4 | Suppression d'une maintenance | Hard delete, reserve aux admins | Haute |

---

## MODULE 19 : NOTIFICATIONS (`/notifications`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 19.1 | Onglet "Toutes" avec badge compteur | Affiche toutes les notifications | Haute |
| 19.2 | Onglet "Non lues" avec badge compteur | Uniquement les non lues | Haute |
| 19.3 | Onglet "Lues" | Uniquement les lues | Haute |
| 19.4 | Filtre par type (info, warning, error, success, alert) | Dropdown | Haute |
| 19.5 | Filtre par date (aujourd'hui, cette semaine, ce mois) | Dropdown | Haute |
| 19.6 | Marquer comme lu (individuel) | Toggle lu/non-lu | Haute |
| 19.7 | Marquer tout comme lu | `POST /notifications/read-all` | Haute |
| 19.8 | Supprimer une notification | Hard delete | Haute |
| 19.9 | Compteur non-lues dans le Navbar | `GET /notifications/unread-count` | Haute |
| 19.10 | Lecture automatique en ouvrant le detail | `GET /notifications/{id}` marque comme lu | Haute |
| 19.11 | Badge type colore | Couleurs differentes par type de notification | Moyenne |
| 19.12 | Horodatage relatif ("il y a 2 heures") | Format temps relatif | Basse |

---

## MODULE 20 : LOGS D'ACTIVITE (`/activity-logs`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 20.1 | Acces reserve aux Super Admin et Administrateur | Verification `hasRole` | Critique |
| 20.2 | Liste avec badges colores par action | Creation (vert), Modification (bleu), Suppression (rouge), Restauration (violet), Connexion (cyan), Deconnexion (gris) | Haute |
| 20.3 | Badge type de modele | Equipement, Port, Liaison, Armoire, etc. | Haute |
| 20.4 | Filtre par action | Dropdown : Toutes, Creation, Modification, Suppression, Restauration, Connexion, Deconnexion | Haute |
| 20.5 | Filtre par type de modele | Dropdown : Tous, Equipement, Port, Liaison, Armoire, etc. | Haute |
| 20.6 | Filtre par date (debut et fin) | Date pickers | Haute |
| 20.7 | Recherche textuelle dans les descriptions | Filtre texte | Haute |
| 20.8 | Pagination (Page X de Y) | Navigation Previous/Next | Haute |
| 20.9 | Compteur total dans le header | "X entrees" | Moyenne |
| 20.10 | Statistiques (`GET /activity-logs/stats`) | total_actions, actions_by_type, actions_by_user (top 10), actions_by_model, recent_activities | Haute |
| 20.11 | Logs par modele specifique (`GET /activity-logs/model/{type}/{id}`) | Historique d'un enregistrement precis | Haute |
| 20.12 | Nettoyage des anciens logs (`POST /activity-logs/cleanup`) | Suppression des logs > X jours | Haute |
| 20.13 | Le nettoyage est lui-meme logue | Action "cleanup" enregistree | Haute |

---

## MODULE 21 : PROFIL UTILISATEUR (`/profile`)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 21.1 | Affichage info compte (lecture seule) | Username, Email, Nom complet, Role(s), Date creation, Derniere connexion | Haute |
| 21.2 | Mode edition (Nom, Email) | Bouton "Editer" bascule en mode edition | Haute |
| 21.3 | Sauvegarde des modifications profil | Mise a jour via API | Haute |
| 21.4 | Changement de mot de passe (modal) | Ancien mot de passe, Nouveau, Confirmation | Haute |
| 21.5 | Indicateur force mot de passe | Min 8 chars, majuscule, minuscule, chiffre, caractere special | Haute |
| 21.6 | Validation confirmation mot de passe | Doit correspondre | Haute |

---

## MODULE 22 : PARAMETRES / IMPORT (`/` section Parametres)

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 22.1 | Selecteur type d'import | Coffrets, Equipements, Ports, Liaisons, Systems | Haute |
| 22.2 | Upload fichier CSV | Input fichier | Haute |
| 22.3 | Telechargement du template CSV | Bouton par type, telecharge un modele vide | Haute |
| 22.4 | Resultat de l'import | Compteurs : crees, mis a jour, erreurs | Haute |
| 22.5 | Messages d'erreur detailles | Erreur par ligne du CSV | Haute |
| 22.6 | Spinner de chargement pendant l'import | Indicateur visuel | Moyenne |

---

## MODULE 23 : COMPOSANTS TRANSVERSAUX

### 23.1 DataTableEnhanced

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 23.1.1 | Recherche globale | Filtre sur toutes les colonnes | Haute |
| 23.1.2 | Tri par clic sur en-tete | ASC/DESC toggle | Haute |
| 23.1.3 | Pagination | Boutons page suivante/precedente, compteur | Haute |
| 23.1.4 | Actions par ligne (voir, modifier, supprimer, restaurer) | Boutons d'action sur chaque ligne | Haute |
| 23.1.5 | Confirmation de suppression | Dialog avant delete | Haute |
| 23.1.6 | Confirmation de restauration | Dialog avant restore | Haute |
| 23.1.7 | Rendus de cellule personnalises | Badges, icones, couleurs | Haute |
| 23.1.8 | Import CSV integre | Si `enableImport=true` | Haute |
| 23.1.9 | Export integre | Si `enableExport=true` | Haute |

### 23.2 DetailsModal

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 23.2.1 | Affichage lecture seule de toutes les donnees | Champs formatte, badges statut | Haute |
| 23.2.2 | Icone et couleur par type d'entite | coffret, equipement, switch, routeur, firewall, serveur, etc. | Moyenne |
| 23.2.3 | Bouton Modifier (si onEdit fourni) | Ouvre l'edition | Haute |
| 23.2.4 | Bouton Supprimer (si onDelete fourni) | Avec confirmation | Haute |
| 23.2.5 | Affichage QR code (si disponible) | Image QR integree | Moyenne |

### 23.3 EditModal

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 23.3.1 | Generation dynamique du formulaire | Basee sur la definition des champs | Haute |
| 23.3.2 | Types de champs : text, select, number, textarea, radio, file | Tous fonctionnels | Haute |
| 23.3.3 | Champs conditionnels (visibleWhen) | Affichage conditionnel selon valeur d'un autre champ | Haute |
| 23.3.4 | Upload fichier avec apercu | Preview d'image | Haute |
| 23.3.5 | Pre-remplissage avec donnees existantes | Champs initialises | Haute |
| 23.3.6 | Groupement de champs par sections | Organisation visuelle | Moyenne |
| 23.3.7 | Sauvegarde | Appel onSave avec donnees du formulaire | Haute |

### 23.4 PageHeader

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 23.4.1 | Titre de page | Affiche en grand | Haute |
| 23.4.2 | Fil d'Ariane (breadcrumbs) | Navigation cliquable | Haute |
| 23.4.3 | Zone d'actions (boutons) | Boutons personnalisables a droite | Haute |
| 23.4.4 | Responsive (mobile vs desktop) | Breadcrumbs caches sur petit ecran | Moyenne |

---

## MODULE 24 : PERMISSIONS ET ACCES (Matrice Croisee)

### 24.1 Matrice des Permissions par Role

| Action | Super Admin | Administrateur | Technicien | Observateur |
|--------|:-----------:|:--------------:|:----------:|:-----------:|
| **Voir tout** | OUI | OUI | OUI | OUI |
| **Creer Sites/Zones** | OUI | OUI | NON | NON |
| **Creer Batiments/Salles** | OUI | OUI | NON | NON |
| **Creer Coffrets** | OUI | OUI | NON | NON |
| **Creer Equipements** | OUI | OUI | NON | NON |
| **Creer Ports** | OUI | OUI | NON | NON |
| **Creer Liaisons** | OUI | OUI | NON | NON |
| **Creer LANs** | OUI | OUI | NON | NON |
| **Modifier tout** | OUI | OUI | NON | NON |
| **Supprimer tout** | OUI | OUI | NON | NON |
| **Creer Utilisateurs** | OUI | OUI | NON | NON |
| **Modifier Utilisateurs** | OUI | OUI | NON | NON |
| **Supprimer Utilisateurs** | OUI | OUI | NON | NON |
| **Toggle Statut Utilisateur** | OUI | OUI | NON | NON |
| **Attribuer Roles** | OUI | OUI | NON | NON |
| **Attribuer Permissions** | OUI | OUI | NON | NON |
| **Creer Modifications** | OUI | OUI | OUI | NON |
| **Valider Modifications** | OUI | OUI | NON | NON |
| **Rollback Modifications** | OUI | OUI | NON | NON |
| **Creer Maintenances** | OUI | OUI | NON | NON |
| **Voir Logs Activite** | OUI | OUI | NON | NON |
| **Nettoyer Logs** | OUI | OUI | NON | NON |
| **Import CSV** | OUI | OUI | NON | NON |

### 24.2 Tests de Controle d'Acces a Verifier

| # | Test | Priorite |
|---|------|----------|
| 24.2.1 | Requete API sans token → 401 | Critique |
| 24.2.2 | Requete API avec token invalide → 401 | Critique |
| 24.2.3 | Requete API avec token expire → 401 | Critique |
| 24.2.4 | Observateur cree un equipement → 403 | Critique |
| 24.2.5 | Technicien supprime un site → 403 | Critique |
| 24.2.6 | Technicien approuve une modification → 403 | Critique |
| 24.2.7 | Observateur accede aux logs d'activite → 403 | Critique |
| 24.2.8 | Utilisateur desactive tente de se connecter → 403 | Critique |
| 24.2.9 | Utilisateur tente de supprimer son propre compte → 403 | Critique |
| 24.2.10 | Utilisateur tente de se desactiver → 403 | Critique |

---

## MODULE 25 : REGLES METIER CRITIQUES

### 25.1 Hierarchie d'Infrastructure

| # | Regle | Test | Priorite |
|---|-------|------|----------|
| 25.1.1 | Un site ne peut etre supprime s'il a des zones | DELETE /sites → 422 si zones > 0 | Critique |
| 25.1.2 | Une zone ne peut etre supprimee si elle a des batiments | DELETE /zones → 422 si batiments > 0 | Critique |
| 25.1.3 | La salle est obligatoire pour un equipement | POST /equipements sans salle_id → 422 | Critique |
| 25.1.4 | Un port requiert un equipement | POST /ports sans equipement_id → 422 | Critique |

### 25.2 Unicite et Integrite

| # | Regle | Test | Priorite |
|---|-------|------|----------|
| 25.2.1 | Un port ne peut etre dans deux liaisons | POST /liaisons avec port deja utilise → 422 | Critique |
| 25.2.2 | Les deux ports d'une liaison doivent etre differents | from == to → 422 | Critique |
| 25.2.3 | Un seul switch principal par armoire | set-principal retire le flag des autres | Critique |
| 25.2.4 | Un VLAN ne peut etre attache deux fois au meme switch | POST /equipements/{id}/vlans en double → 422 | Critique |
| 25.2.5 | Email utilisateur unique | POST /users avec email existant → 422 | Critique |
| 25.2.6 | Username utilisateur unique | POST /users avec username existant → 422 | Critique |
| 25.2.7 | Une seule modification en_attente par coffret | POST /modifications si pending existe → 422 | Critique |

### 25.3 Soft Delete et Restauration

| # | Regle | Test | Priorite |
|---|-------|------|----------|
| 25.3.1 | Sites : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.2 | Zones : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.3 | Batiments : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.4 | Salles : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.5 | Coffrets : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.6 | Equipements : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.7 | Ports : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.8 | Liaisons : soft delete avec restauration | DELETE + POST restore fonctionnent | Haute |
| 25.3.9 | Suppression definitive (force) avec verification dependances | Impossible si enfants existent | Haute |
| 25.3.10 | Les ports supprimes ne sont pas proposes pour les liaisons | Exclus de la selection | Haute |
| 25.3.11 | LANs : hard delete (pas de soft delete) | DELETE supprime definitivement | Haute |
| 25.3.12 | Utilisateurs : hard delete | DELETE efface definitivement | Haute |

---

## MODULE 26 : PWA ET RESPONSIVE

| # | Fonctionnalite | Resultat attendu | Priorite |
|---|---------------|------------------|----------|
| 26.1 | Manifest PWA accessible (`/manifest.webmanifest`) | Retour 200 avec contenu JSON | Haute |
| 26.2 | Service Worker enregistre | SW installe en mode production | Haute |
| 26.3 | Installation PWA (Android/iOS) | Application installable depuis le navigateur | Haute |
| 26.4 | Affichage mobile : page Login | Formulaire accessible et utilisable | Haute |
| 26.5 | Affichage mobile : Dashboard | Cartes empilees, graphiques scrollables | Haute |
| 26.6 | Affichage mobile : Tableaux | Scroll horizontal ou adaptation responsive | Haute |
| 26.7 | Affichage mobile : Sidebar auto-fermee | Menu hamburger pour ouvrir | Haute |
| 26.8 | Affichage mobile : Modals | Formulaires utilisables sur petit ecran | Haute |
| 26.9 | Affichage tablette | Layout adapte entre mobile et desktop | Moyenne |

---

## RESUME STATISTIQUE

| Categorie | Nombre de fonctionnalites |
|-----------|:------------------------:|
| Authentification et Session | 17 |
| Navigation et Layout | 24 |
| Dashboard | 12 |
| Sites | 14 |
| Zones | 12 |
| Batiments | 14 |
| Salles | 13 |
| Armoires / Coffrets | 24 |
| Equipements | 42 |
| Ports | 16 |
| Liaisons | 18 |
| LANs / VLANs | 13 |
| Cartographie Reseau | 19 |
| Utilisateurs | 18 |
| Roles | 7 |
| Permissions | 6 |
| Workflow Modifications | 27 |
| Maintenances | 13 |
| Notifications | 12 |
| Logs d'Activite | 13 |
| Profil Utilisateur | 6 |
| Import / Parametres | 6 |
| Composants Transversaux | 19 |
| Permissions et Acces | 23 |
| Regles Metier Critiques | 22 |
| PWA et Responsive | 9 |
| **TOTAL** | **~359 fonctionnalites** |

### Repartition par Priorite

| Priorite | Nombre estime |
|----------|:------------:|
| Critique | ~55 |
| Haute | ~230 |
| Moyenne | ~50 |
| Basse | ~24 |
