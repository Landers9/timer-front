# README.md - Time Manager Frontend

Voici un README complet et professionnel pour votre frontend :

# ⏰ Time Manager - Frontend

Application web de gestion du temps et des pointages pour les entreprises. Permet aux employés d'enregistrer leurs heures de travail et aux managers de suivre les équipes.

## 📋 Table des matières

- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Tests](#tests)
- [Build & Déploiement](#build--déploiement)
- [Contribution](#contribution)

---

## 🚀 Technologies

- **Framework** : Angular 18.2.20
- **Langage** : TypeScript 5.5+
- **Styling** : Tailwind CSS 3.4+
- **HTTP Client** : Angular HttpClient
- **Routing** : Angular Router (Standalone Components)
- **State Management** : Angular Signals

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** : v18.19+ ou v20.11+ ([Télécharger](https://nodejs.org/))
- **npm** : v9+ (inclus avec Node.js)
- **Angular CLI** : v18+

```bash
# Vérifier les versions installées
node -v
npm -v

# Installer Angular CLI globalement (si nécessaire)
npm install -g @angular/cli@18
```

---

## 📦 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/EpitechMscProPromo2027/T-DEV-700-project-COT_3.git
cd frontend
```

### 2. Installer les dépendances

```bash
npm install
```

---

## ⚙️ Configuration

### Variables d'environnement

Le projet utilise deux fichiers de configuration :

#### Développement (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:4000/api", // URL du backend local
  apiTimeout: 30000,
  enableDebugLog: true,
};
```

#### Production (`src/environments/environment.production.ts`)

```typescript
export const environment = {
  production: true,
  apiUrl: "http://localhost:4000/api", // URL du backend en production
  apiTimeout: 30000,
  enableDebugLog: false,
};
```

**💡 Conseil** : Modifiez `apiUrl` pour pointer vers votre backend.

---

## 🎯 Lancement

### Mode développement

```bash
npm start
# ou
ng serve
```

L'application sera accessible sur : **http://localhost:4200**

### Mode développement avec port personnalisé

```bash
ng serve --port 4300
```

### Mode développement avec rechargement automatique

```bash
ng serve --watch
```

---

## 📁 Structure du projet

```
src/app/
├── layouts/                    # Mise en page (Auth, Main)
│   ├── auth-layout/           # Layout pour pages publiques (login)
│   └── main-layout/           # Layout pour pages authentifiées (avec sidebar)
│
├── pages/                      # Pages de l'application
│   ├── login/                 # Page de connexion
│   ├── dashboard/             # Tableau de bord
│   ├── users/                 # Gestion des utilisateurs
│   ├── teams/                 # Gestion des équipes
│   ├── clocks/                # Pointages (arrivée/départ)
│   └── reports/               # Rapports et KPIs
│
├── components/                 # Composants réutilisables
│   ├── button/                # Boutons personnalisés
│   ├── card/                  # Cartes d'information
│   ├── input/                 # Champs de formulaire
│   └── table/                 # Tableaux de données
│
├── services/                   # Services (logique métier & API)
│   ├── auth.service.ts        # Authentification
│   ├── user.service.ts        # Gestion utilisateurs
│   ├── team.service.ts        # Gestion équipes
│   ├── clock.service.ts       # Gestion pointages
│   └── report.service.ts      # Génération rapports
│
├── models/                     # Interfaces TypeScript
│   ├── user.model.ts          # Interface User
│   ├── team.model.ts          # Interface Team
│   ├── clock.model.ts         # Interface Clock
│   └── report.model.ts        # Interface Report
│
├── guards/                     # Protection des routes
│   └── auth.guard.ts          # Vérification authentification
│
├── interceptors/               # Intercepteurs HTTP
│   └── auth.interceptor.ts    # Ajout token JWT automatique
│
├── app.routes.ts              # Configuration des routes
├── app.config.ts              # Configuration globale
└── app.component.ts           # Composant racine

src/environments/              # Configuration par environnement
├── environment.ts             # Développement
└── environment.production.ts  # Production
```

---

## ✨ Fonctionnalités

### 🔐 Authentification

- Connexion par email/mot de passe
- Gestion des tokens JWT
- Protection des routes
- Déconnexion automatique

### 👤 Rôles utilisateurs

#### Employé

- ✅ Enregistrer arrivée/départ
- ✅ Consulter son historique de pointages
- ✅ Voir son dashboard personnel
- ✅ Modifier ses informations

#### Manager (+ fonctionnalités employé)

- ✅ Gérer les utilisateurs
- ✅ Gérer les équipes
- ✅ Voir les horaires des employés
- ✅ Accéder aux rapports et KPIs
- ✅ Voir les dashboards des employés

### 📊 Fonctionnalités principales

- **Dashboard** : Vue d'ensemble des heures travaillées
- **Utilisateurs** : CRUD complet (Créer, Lire, Modifier, Supprimer)
- **Équipes** : Gestion des équipes et affectations
- **Pointages** : Enregistrement arrivée/départ en temps réel
- **Rapports** : KPIs et statistiques (taux de retard, heures moyennes, etc.)

---

## 🏗️ Architecture

### Composants Standalone

Le projet utilise l'approche **Standalone Components** d'Angular 18 :

- Pas de modules NgModule
- Import direct des dépendances dans chaque composant
- Lazy loading natif des composants

### Gestion d'état avec Signals

Utilisation des **Signals** (Angular 16+) pour la gestion d'état réactive :

```typescript
// Exemple dans auth.service.ts
currentUser = signal<User | null>(null);

// Lecture
const user = this.authService.currentUser();

// Modification
this.currentUser.set(newUser);
```

### Communication avec l'API

Tous les appels API passent par les **services** :

```typescript
// Exemple d'utilisation
this.userService.getAll().subscribe((users) => {
  console.log(users);
});
```

### Sécurité

- **JWT Token** : Stocké dans localStorage
- **Auth Guard** : Protection des routes authentifiées
- **Auth Interceptor** : Ajout automatique du token aux requêtes HTTP
- **HTTPS** : Recommandé en production

---

## 🧪 Tests

### Lancer les tests unitaires

```bash
npm test
# ou
ng test
```

### Lancer les tests avec couverture

```bash
ng test --code-coverage
```

Le rapport de couverture sera généré dans `coverage/`

### Structure des tests

```typescript
// Exemple de test
describe("AuthService", () => {
  it("should authenticate user with valid credentials", () => {
    // Test logic
  });
});
```

---

## 🚢 Build & Déploiement

### Build de développement

```bash
npm run build
# ou
ng build
```

Les fichiers générés seront dans `dist/`

### Build de production

```bash
npm run build:prod
# ou
ng build --configuration production
```

**Optimisations appliquées en production** :

- ✅ Minification du code
- ✅ Tree-shaking (suppression du code inutilisé)
- ✅ Optimisation des bundles
- ✅ AOT Compilation (Ahead-of-Time)
- ✅ Service Worker (si activé)

### Build Docker

Voir le fichier `Dockerfile` à la racine du projet.

```bash
# Build l'image Docker
docker build -t time-manager-frontend .

# Lancer le container
docker run -p 8080:80 time-manager-frontend
```

---

## 🐳 Docker

### Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

# Stage 2: Run
FROM nginx:alpine
COPY --from=build /app/dist/time-manager-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  frontend:
    build: .
    ports:
      - "4200:80"
    environment:
      - API_URL=http://backend:4000/api
    depends_on:
      - backend
```

---

## 📝 Scripts disponibles

| Commande                       | Description                       |
| ------------------------------ | --------------------------------- |
| `npm start`                    | Lance le serveur de développement |
| `npm run build`                | Build de développement            |
| `npm run build:prod`           | Build de production optimisé      |
| `npm test`                     | Lance les tests unitaires         |
| `npm run lint`                 | Vérifie le code (linting)         |
| `ng generate component <name>` | Créer un nouveau composant        |
| `ng generate service <name>`   | Créer un nouveau service          |

---

## 🎨 Styling avec Tailwind CSS

### Classes utilitaires personnalisées

Le projet définit des classes réutilisables dans `src/styles.css` :

```css
/* Boutons */
.btn-primary    /* Bouton bleu principal */
/* Bouton bleu principal */
/* Bouton bleu principal */
/* Bouton bleu principal */
.btn-secondary  /* Bouton gris secondaire */
.btn-danger     /* Bouton rouge pour actions critiques */

/* Formulaires */
.input-field    /* Champ de saisie standard */
.input-label    /* Label de formulaire */

/* Cartes */
.card; /* Carte blanche avec ombre */
```

### Utilisation

```html
<button class="btn-primary">Se connecter</button>

<input type="text" class="input-field" placeholder="Email" />

<div class="card">
  <h3>Titre</h3>
  <p>Contenu de la carte</p>
</div>
```

---

## 🤝 Contribution

### Workflow Git

1. **Créer une branche** pour votre fonctionnalité

```bash
git checkout -b feature/nom-de-la-fonctionnalite
```

2. **Commit avec des messages clairs**

```bash
git commit -m "feat: ajout page de gestion des équipes"
git commit -m "fix: correction bug affichage dashboard"
```

3. **Push et créer une Pull Request**

```bash
git push origin feature/nom-de-la-fonctionnalite
```

### Conventions de commit

Suivre le format [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage du code
- `refactor:` Refactoring
- `test:` Ajout de tests
- `chore:` Tâches de maintenance

---

## 🐛 Résolution de problèmes

### L'application ne se lance pas

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur de connexion au backend

Vérifiez que :

1. Le backend est démarré
2. L'URL dans `environment.ts` est correcte
3. Le CORS est configuré sur le backend

### Erreur de compilation Tailwind

```bash
# Réinstaller Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

---

## 📚 Documentation

- [Angular Documentation](https://angular.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 👥 Équipe

- **Développeurs** : [Suicide Squad]
- **Organisation GitHub** : EpitechMscProPromo2027

---

## 📄 Licence

Ce projet est développé dans le cadre du cursus EPITECH MSC.

---

# timer-front
