# Guide d'Utilisation - Schéma Réseau

## Vue d'ensemble

Le schéma réseau permet de visualiser graphiquement toutes les connexions (liaisons) d'un équipement, aussi bien en **upstream** (vers la source) qu'en **downstream** (vers la distribution).

---

## Accéder au schéma

1. Naviguez vers la page **Équipements**
2. Cliquez sur un équipement pour ouvrir sa page de détail
3. Faites défiler jusqu'à la section **"Chaîne de dépendance"**
4. Cliquez sur l'onglet **"Schéma"**

---

## Interface du schéma

### Zone principale (graphe)

Le graphe affiche les équipements sous forme de **cercles colorés** avec leur nom en dessous.

#### Légende des couleurs par type d'équipement

| Couleur | Type |
|---------|------|
| 🔵 Bleu | Switch |
| 🟣 Violet | Routeur |
| 🔴 Rouge | Firewall |
| 🟢 Vert | Point d'accès |
| 🟠 Orange | Serveur |
| ⚫ Gris | Autre |

#### Équipement actuel
- Identifié par une **bordure dorée/jaune**
- Positionné au centre du graphe

#### Types de liaisons

| Style | Direction | Description |
|-------|-----------|-------------|
| ─ ─ ─ Vert pointillé | Upstream | Vers la source réseau (amont) |
| ───── Bleu plein | Downstream | Vers la distribution (aval) |

---

## Contrôles de navigation

### Boutons de la barre d'outils

| Bouton | Action |
|--------|--------|
| 🔍+ | Zoom avant |
| 🔍- | Zoom arrière |
| ⛶ | Ajuster la vue (recentrer tout le graphe) |

### Gestes de navigation

| Geste | Action |
|-------|--------|
| **Molette souris** | Zoom avant/arrière |
| **Clic + glisser (sur le fond)** | Déplacer la vue |
| **Clic + glisser (sur un nœud)** | Déplacer l'équipement |
| **Clic simple (sur un nœud)** | Sélectionner et voir les détails |
| **Clic simple (sur une liaison)** | Sélectionner et voir les détails |
| **Survol (hover)** | Afficher l'info-bulle |

---

## Informations affichées

### Sur les nœuds (équipements)

- **Label** : Nom de l'équipement
- **Info-bulle** (au survol) :
  - Code de l'équipement
  - Type
  - Adresse IP

### Sur les liaisons

- **Label** : `[Port Source] Média [Port Dest]`
  - Exemple : `[Gi0/1] Cuivre [Gi0/24]`
- **Info-bulle** (au survol) :
  - Port source
  - Type de média
  - Port destination
  - Longueur du câble

---

## Panneau de détails (à droite)

Lorsque vous cliquez sur un élément, ses détails s'affichent dans le panneau latéral.

### Pour un équipement sélectionné

- Nom
- Code équipement
- Type
- Adresse IP
- Adresse MAC
- Statut (Actif, Inactif, Maintenance)
- Badge "Équipement actuel" si c'est le nœud central

### Pour une liaison sélectionnée

- Type de média (Cuivre, Fibre, etc.)
- Longueur
- Port source
- Port destination
- Direction (Upstream / Downstream)

---

## Statistiques

En haut à droite du schéma, vous pouvez voir :

- **Équipements** : Nombre total de nœuds affichés
- **Liens** : Nombre total de liaisons

---

## Cas d'utilisation

### 1. Identifier la chaîne de dépendance

Visualisez rapidement tous les équipements connectés en amont et en aval d'un switch pour comprendre l'impact en cas de panne.

### 2. Vérifier les connexions de ports

Cliquez sur une liaison pour voir exactement quels ports sont utilisés de chaque côté.

### 3. Documenter l'infrastructure

Utilisez le schéma comme référence visuelle pour la documentation réseau.

### 4. Diagnostic de problèmes

Identifiez les points de connexion entre équipements pour le dépannage.

---

## Astuces

1. **Réorganisez les nœuds** : Glissez-déposez les équipements pour obtenir une disposition plus claire.

2. **Zoom sur une zone** : Utilisez la molette pour zoomer sur une partie spécifique du réseau.

3. **Recentrer la vue** : Cliquez sur le bouton ⛶ pour revenir à la vue d'ensemble.

4. **Info-bulles détaillées** : Survolez les éléments pour voir les informations sans cliquer.

---

## Autres onglets disponibles

En plus du schéma, vous avez accès à :

- **Upstream** : Liste détaillée des équipements en amont
- **Downstream** : Liste détaillée des équipements en aval

Ces onglets présentent les mêmes informations sous forme de timeline verticale.

---

## Support

Pour toute question ou problème, contactez l'équipe technique.
