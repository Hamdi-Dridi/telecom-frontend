# Telecom Performance Analytics — version React

Conversion complète de l'app HTML/CSS/JS vanilla vers React (Vite).

## Pages construites

- ✅ **Authentification** (connexion / inscription / en attente)
- ✅ **Vue d'ensemble** — hero, scores par domaine, jauges, cartes KPI, graphique de tendance, tableau mensuel, Top/Bottom KPIs, statut de validation, activité récente
- ✅ **Historique** — graphique de score régional + tendances par domaine, bascule mensuel/annuel
- ✅ **Objectifs** — tableau complet (Poids, Objectif, Réalisation, Taux, Score, Statut, Commentaire, Validation), tout calculé en direct
- ✅ **Utilisateurs** — demandes en attente (approuver/refuser), tous les utilisateurs (modifier/rétrograder/suspendre/supprimer), création directe de compte
- ✅ **Export** — export CSV/JSON, modèle Excel à télécharger, import CSV/Excel (associe les lignes par nom d'indicateur), rapport imprimable en PDF (via l'impression du navigateur)
- ✅ **Gestion des indicateurs** (popup, accessible depuis Objectifs) — planifier un objectif sur plusieurs mois × sites à la fois, créer un nouvel indicateur, ajouter un mois au calendrier glissant à la volée, retirer/restaurer un indicateur existant

## Structure

```
react-app/
├── index.html                 # point d'entrée Vite (charge aussi la lib Excel via CDN)
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                    # ReactDOM.createRoot + providers
    ├── App.jsx                     # gate auth + navbar + routage des vues
    ├── styles/styles.css           # réutilisé tel quel (indépendant du JS)
    ├── assets/logo.png
    ├── utils/exportUtils.js        # CSV/JSON build, téléchargement, parsing CSV/import
    ├── data/
    │   ├── *.json                  # les 10 entités
    │   ├── db.js                   # DB + lookups
    │   └── storage.js              # helpers localStorage génériques
    ├── hooks/
    │   └── usePersistedState.js
    ├── context/
    │   ├── AppStateContext.jsx     # périodes (calendrier glissant), région/période
    │   ├── AuthContext.jsx         # utilisateurs, session, login/signup/CRUD
    │   └── KpiDataContext.jsx      # moteur de calcul KPI complet : Poids/Objectif/Réalisation/
    │                                 Taux/Score/Commentaire/Validation, indicateurs personnalisés,
    │                                 retrait/restauration, objectifs planifiés
    └── components/
        ├── AuthScreen.jsx
        ├── Navbar.jsx
        ├── SettingsModal.jsx
        ├── charts/
        │   ├── RingGauge.jsx        # jauge circulaire réutilisable
        │   ├── LineChart.jsx        # graphique avec axes + info-bulles
        │   └── Sparkline.jsx        # mini-graphique (popup détail)
        ├── kpi/
        │   ├── KpiCard.jsx
        │   ├── KpiDetailModal.jsx
        │   └── DomainScoreCard.jsx
        └── views/
            ├── OverviewView.jsx + overview/{OverviewHero,DomainScoresRow,RecentTrendCard,MonthlyTable,InsightsRow}.jsx
            ├── HistoriqueView.jsx
            ├── ObjectifsView.jsx + objectifs/{ObjectifsRow,GestionIndicateursModal,PlanTab,ExistingTab}.jsx
            ├── UtilisateursView.jsx + utilisateurs/{PendingUsersTable,AllUsersTable,UserCreateModal,UserEditModal}.jsx
            ├── ExportView.jsx + export/{ExportActions,ImportPanel,PrintReport}.jsx
            └── PlaceholderView.jsx  # plus utilisé, conservé pour référence
```

## Lancer le projet

```bash
cd react-app
npm install
npm run dev
```

Ouvre l'URL indiquée (`http://localhost:5173` par défaut).

Build de production :
```bash
npm run build   # génère dist/ — fichiers statiques déployables n'importe où
```

## Compte de démonstration

- **Email** : `amine.derbali@exemple.tn`
- **Mot de passe** : `admin123`

## Ce qui a changé par rapport à la version JS vanilla

- **Plus de `fetch()` pour les données** : les JSON sont importés directement (`import roles from './roles.json'`), donc **pas besoin de serveur pour que les données se chargent** — seul `npm run dev`/`vite` reste nécessaire (Vite est lui-même un petit serveur de développement).
- **État géré par React** (`useState`/Context) au lieu de manipulation directe du DOM.
- **localStorage** : mêmes clés que la version vanilla (`kpi_users_v5`, `kpi_periods_v5`, etc.) — donc si tu as déjà utilisé l'app vanilla dans le même navigateur, les données (utilisateurs créés, objectifs planifiés...) sont **partagées**.
- **CSS inchangé** : `styles.css` est repris tel quel, aucune classe renommée, donc le rendu visuel est identique.

## Note sur l'import/export Excel

La lecture et l'écriture des fichiers `.xlsx` sont **100% locales, sans dépendance externe** —
`src/utils/xlsxLite.js` est un petit lecteur/écrivain `.xlsx` maison qui n'utilise que des API
natives du navigateur (`CompressionStream`/`DecompressionStream` pour le conteneur ZIP, `DOMParser`
pour le XML). Aucune bibliothèque CDN, aucun paquet npm, aucune connexion internet requise — testé
avec **toutes les requêtes réseau externes bloquées**, y compris un aller-retour complet
export → réimport et un fichier `.xlsx` avec « shared strings » (le format utilisé par Excel/LibreOffice)
construit à la main pour vérifier que le lecteur gère aussi ce cas, pas seulement ses propres fichiers.

Seul le format `.xls` (Excel 97-2003, un format binaire différent et beaucoup plus complexe) n'est
pas supporté — un message clair invite à ré-enregistrer en `.xlsx` ou `.csv` dans ce cas. L'import
CSV reste par ailleurs totalement indépendant de tout ça (parseur écrit à la main).

## Tests effectués

Comme aucun accès réseau n'est disponible dans cet environnement (donc pas de `npm install` possible ici), la validation a été faite avec les outils déjà présents localement :
- **esbuild** : chaque fichier + le bundle complet ont été compilés sans erreur.
- **Playwright (Chromium headless réel)** : l'app a été chargée dans un vrai navigateur — connexion, inscription, ouverture des paramètres, navigation entre onglets, tout testé avec captures d'écran, **zéro erreur console**.

Tu peux lancer `npm install && npm run dev` en confiance — c'est la même chose que ce qui a été testé, juste avec Vite comme serveur de dev au lieu d'un bundle esbuild manuel.
