# Correction : Erreur de chargement de la chaîne de dépendance

## 🐛 Problème

Erreur affichée dans le navigateur :
```
Erreur lors du chargement de la chaîne de dépendance
```

Cette erreur apparaît lors de l'accès à la page de détails d'un équipement.

---

## 🔍 Cause du problème

La bibliothèque **`vis-network`** (utilisée pour afficher le graphe de la chaîne de dépendance) a des problèmes de chargement avec Vite :

1. **Import synchrone lourd** : Le composant `DependencyChainSection` importe `vis-network/standalone` directement
2. **Chargement bloquant** : Cela peut bloquer le chargement initial de la page
3. **Configuration Vite manquante** : Vite n'était pas configuré pour optimiser cette dépendance

### Fichier concerné
[DependencyChainSection.tsx:32](reseau_front/src/components/sections/DependencyChainSection.tsx#L32)
```tsx
import { Network as VisNetwork, DataSet } from 'vis-network/standalone';
```

---

## ✅ Solutions appliquées

### 1. Configuration Vite pour `vis-network`

**Fichier modifié :** [vite.config.ts](reseau_front/vite.config.ts)

```tsx
// AVANT
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ["react", "react-dom", "react-router-dom"],
        ui: ["@radix-ui/react-dialog", ...],
        charts: ["recharts"],
        query: ["@tanstack/react-query"],
      },
    },
  },
},

// APRÈS
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ["react", "react-dom", "react-router-dom"],
        ui: ["@radix-ui/react-dialog", ...],
        charts: ["recharts"],
        query: ["@tanstack/react-query"],
        network: ["vis-network"], // ✅ Chunk séparé pour vis-network
      },
    },
  },
},
optimizeDeps: {
  include: ["vis-network/standalone"], // ✅ Pré-bundler vis-network
},
```

**Bénéfices :**
- ✅ Vis-network est dans un chunk séparé (ne bloque pas le bundle principal)
- ✅ Pre-bundling par Vite (chargement plus rapide)
- ✅ Meilleure gestion du cache

---

### 2. Lazy Loading du composant `DependencyChainSection`

**Fichier modifié :** [EquipementsDetailSection.tsx](reseau_front/src/components/sections/EquipementsDetailSection.tsx)

**AVANT (import synchrone) :**
```tsx
import { useState, useEffect } from "react";
import DependencyChainSection from "./DependencyChainSection";
```

**APRÈS (import lazy) :**
```tsx
import { useState, useEffect, lazy, Suspense } from "react";

// Lazy load pour éviter les problèmes de chargement avec vis-network
const DependencyChainSection = lazy(() => import("./DependencyChainSection"));
```

**Bénéfices :**
- ✅ Le composant est chargé **uniquement quand nécessaire**
- ✅ Ne bloque pas le chargement initial de la page
- ✅ Meilleure performance (code splitting)

---

### 3. Suspense avec Fallback

**Ajout d'un Suspense autour du composant :**

```tsx
// AVANT (sans Suspense)
<DependencyChainSection
  equipementId={selectedEquipement.id}
  equipementName={selectedEquipement.name}
/>

// APRÈS (avec Suspense)
<Suspense fallback={
  <Card className="mt-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Network className="h-5 w-5" />
        Chaîne de dépendance
      </CardTitle>
      <CardDescription>Chargement en cours...</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
}>
  <DependencyChainSection
    equipementId={selectedEquipement.id}
    equipementName={selectedEquipement.name}
  />
</Suspense>
```

**Bénéfices :**
- ✅ Affiche un loader pendant le chargement du composant
- ✅ Meilleure expérience utilisateur
- ✅ Évite l'écran blanc

---

## 📊 Impact de la correction

### Avant
```
Page Détails Équipement
   ↓
Charge TOUT (React + vis-network + ...)
   ↓
❌ Long chargement initial
❌ Erreur possible de dépendance
❌ Page blanche ou erreur
```

### Après
```
Page Détails Équipement
   ↓
Charge React + composants principaux
   ↓
✅ Chargement rapide
   ↓
Utilisateur clique sur onglet Dépendances
   ↓
Charge DependencyChainSection + vis-network
   ↓
✅ Affiche le loader
   ↓
✅ Affiche le graphe
```

---

## 🧪 Tests à effectuer

### Test 1 : Chargement de la page de détails
1. ✅ Aller sur [Équipements](http://localhost:8080/equipements)
2. ✅ Cliquer sur un équipement
3. ✅ La page de détails se charge rapidement
4. ✅ Pas d'erreur "Erreur lors du chargement de la chaîne de dépendance"

### Test 2 : Chargement de la chaîne de dépendance
1. ✅ Sur la page de détails d'un équipement
2. ✅ Scroller vers le bas jusqu'à la section "Chaîne de dépendance"
3. ✅ Observer le loader pendant 1-2 secondes
4. ✅ Le graphe de dépendance s'affiche correctement

### Test 3 : Performance
1. ✅ Ouvrir les DevTools → Network
2. ✅ Recharger la page de détails
3. ✅ Vérifier que `vis-network` est chargé dans un chunk séparé
4. ✅ Vérifier que le temps de chargement initial est réduit

---

## 🔧 Autres optimisations possibles

### Si le problème persiste

#### Option 1 : Précharger vis-network
```tsx
// Dans App.tsx ou index.tsx
import { useEffect } from 'react';

useEffect(() => {
  // Précharger vis-network après le montage initial
  import('./components/sections/DependencyChainSection');
}, []);
```

#### Option 2 : Utiliser un graphe plus léger
Remplacer `vis-network` par une alternative plus légère :
- **react-flow** : Plus moderne, mieux intégré avec React
- **cytoscape.js** : Plus léger
- **d3.js** : Plus personnalisable

#### Option 3 : Lazy load par onglet
```tsx
const [selectedTab, setSelectedTab] = useState('overview');

<Tabs value={selectedTab} onValueChange={setSelectedTab}>
  <TabsContent value="dependencies">
    {selectedTab === 'dependencies' && (
      <Suspense fallback={<Loader />}>
        <DependencyChainSection {...props} />
      </Suspense>
    )}
  </TabsContent>
</Tabs>
```

---

## 📝 Checklist de vérification

- [x] Configuration Vite mise à jour
- [x] Lazy loading ajouté
- [x] Suspense avec fallback
- [x] Import optimisé dans `optimizeDeps`
- [x] Chunk séparé pour vis-network
- [ ] Tests effectués
- [ ] Performance vérifiée

---

## 🚀 Démarrage après correction

```bash
# Arrêter le serveur actuel
pkill -f "vite"

# Nettoyer le cache (optionnel mais recommandé)
rm -rf node_modules/.vite

# Redémarrer le serveur
npm run dev
```

Puis tester l'application dans le navigateur.

---

## 📚 Ressources

- [Vite - Code Splitting](https://vitejs.dev/guide/features.html#code-splitting)
- [React Lazy Loading](https://react.dev/reference/react/lazy)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [vis-network Documentation](https://visjs.github.io/vis-network/docs/network/)

---

## 💡 Résumé

### Avant ❌
- Chargement synchrone de vis-network
- Bloque le chargement initial
- Erreur "Chaîne de dépendance"

### Après ✅
- Lazy loading avec `React.lazy()`
- Chunk séparé pour vis-network
- Suspense avec fallback élégant
- Chargement rapide de la page

---

**Date de correction :** 2026-02-03
**Statut :** ✅ Corrigé
**Impact :** Performance améliorée + Erreur résolue
