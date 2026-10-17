# UNI-PAY (نظام إدارة الرواتب الجامعية)
## Plateforme Universitaire de Gestion du Cycle de Paie — MVP

UNI-PAY est une application web intégrée conçue pour moderniser, fiabiliser et tracer l'intégralité du cycle de paie des universités et établissements d'enseignement supérieur algériens.

Le système prend en charge la gestion du personnel, le calcul réglementaire de la paie, l'audit algorithmique intelligent, le workflow d'approbation multi-niveaux à visa obligatoire, l'espace en libre-service pour les employés et le cycle technique de paiement et de clôture financière.

---

## 🌟 Architecture & Fonctionnalités Clés

### 1. Les 7 Espaces Métier Dédiés (RBAC Strict)
- **Administrateur Système** (`/admin`) : Gestion des utilisateurs, rôles, matrice de permissions granulaires, organisation, paramètres système, règles de paie et journaux d'audit de sécurité.
- **Agent RH / Gestionnaire Paie** (`/agent`) : Gestion des dossiers agents, saisie des présences et éléments variables, calcul automatique du brut/cotisations/IRG/net, contrôle d'anomalies pré-vol et soumission des lots.
- **Chef de Service / Département** (`/chef`) : Première vérification du lot, revue des anomalies de paie signalées, approbation formelle ou retour motivé pour correction.
- **Directeur d'Établissement / Ordonnateur** (`/directeur`) : Arbitrage institutionnel, visa hiérarchique d'engagement, contrôle macroscopique de la masse salariale et clôture définitive des lots payés.
- **Comptable Financier** (`/comptable`) : Validation comptable préalable, génération du fichier technique bancaire normalisé, exécution du paiement sous protocole contrôlé et rapprochement bancaire.
- **Contrôleur Financier** (`/controle-financier`) : Examen de conformité budgétaire et octroi du **Visa Financier obligatoire** (sans lequel aucun lot ne peut passer au paiement).
- **Espace Employé** (`/employe`) : Consultation sécurisée du profil individuel, accès aux notifications et téléchargement direct des bulletins de paie officiels au format PDF haute fidélité.

---

### 2. Le Workflow de Paie à Visa Bloquant
Le cycle de vie d'un lot de paie traverse les états ordonnés suivants :
```
[DRAFT] ➜ [CALCULATED] ➜ [READY_FOR_REVIEW]
   ➜ [CHEF_REVIEW] ➜ [APPROVED_BY_CHEF]
   ➜ [DIRECTOR_REVIEW] ➜ [APPROVED_BY_DIRECTOR]
   ➜ [ACCOUNTING_REVIEW] ➜ [ACCOUNTING_VALIDATED]
   ➜ [FINANCIAL_CONTROL] ➜ [AUTHORIZED]
   ➜ [PAYMENT_PROCESSING] ➜ [PAID] ➜ [RECONCILED] ➜ [CLOSED]
```
- **Règle de correction** : À toute étape de revue, un rejet renvoie le lot à `RETURNED_FOR_CORRECTION` avec motif obligatoire. Une nouvelle version incrémentale (v2, v3...) doit être créée pour corriger les données, scellant l'historique de la version rejetée.
- **Immutabilité absolue** : Dès qu'un lot atteint l'état `CLOSED`, aucune modification de présence, prime, retenue ou calcul n'est admise.

---

### 3. Moteur Smart Audit & Résilience
- Détection automatisée d'anomalies : absences prolongées, variations inhabituelles de salaire (+25%), primes disproportionnées, données manquantes (RIB, CIN, grade), doublons d'identité.
- Analyse assistée et explicative des anomalies avec sévérité hiérarchisée (`CRITICAL`, `HIGH`, `WARNING`, `INFO`).
- Résilience intégrée : le moteur algorithmique déterministe fonctionne en continu, même en cas d'indisponibilité des services externes.

---

### 4. Cycle de Paiement & Rapprochement Bancaire
- Fichier technique de virement normalisé (`GENERIC_BANK_TRANSFER`) avec empreinte cryptographique SHA-256 scellée.
- Masquage des coordonnées bancaires dans l'interface et enregistrement immuable des snapshots lors de l'exécution.
- Processus de confirmation contrôlé (`MANUAL_CONTROLLED`).
- Module de rapprochement automatique multi-critères (Référence transaction ➜ Matricule + Montant).

---

## 👥 Comptes de Démonstration (Demo Accounts)

Tous les comptes de démonstration utilisent le mot de passe standardisé :
`Password123!`

| Espace & Rôle | Email de connexion | Description du profil |
|---|---|---|
| **Administrateur** | `admin@unipay.dz` | Administrateur global de la plateforme |
| **Agent RH** | `agent@unipay.dz` | Gestionnaire du personnel et du calcul de paie |
| **Chef de Service** | `chef@unipay.dz` | Responsable de validation de service |
| **Directeur** | `directeur@unipay.dz` | Ordonnateur de l'université |
| **Comptable** | `comptable@unipay.dz` | Comptable assignataire & trésorier |
| **Contrôleur Financier** | `controleur@unipay.dz` | Contrôleur budgétaire d'État (Visa) |
| **Employé** | `employe@unipay.dz` | Professeur d'université (bulletins & profil) |
| *Compte Inactif* | `desactive@unipay.dz` | Utilisateur désactivé (test sécurité) |

---

## 🚀 Installation et Lancement Local

### Prérequis
- **Node.js** >= 18.18 (recommandé v20 ou supérieur)
- **npm** >= 9.x

### 1. Cloner et installer les dépendances
```bash
git clone <url-du-depot>
cd unipay
npm install
```

### 2. Configuration d'environnement
Copiez le fichier d'exemple et configurez les variables d'environnement nécessaires :
```bash
cp .env.example .env
```

Contenu type de `.env` :
```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-super-secret-key-32-chars-minimum"
```

### 3. Base de données et Données initiales
Initialisez la base SQLite locale avec les migrations Prisma et les données de démonstration :
```bash
npx prisma migrate dev
npm run seed
npx tsx scripts/link_employee.ts
```

### 4. Démarrer le serveur de développement
```bash
npm run dev
```
Rendez-vous sur [http://localhost:3000](http://localhost:3000) et connectez-vous avec l'un des comptes de démonstration ci-dessus.

---

## 🧪 Validation et Suites de Tests

Le projet dispose d'une suite complète de tests d'intégration et de non-régression couvrant chaque phase du projet :

```bash
# Exécuter l'audit complet Phase 9 (136 tests)
npx tsx scripts/test_phase9.ts

# Exécuter les tests de non-régression des phases précédentes
npx tsx scripts/test_phase2.ts   # Auth & RBAC (13 tests)
npx tsx scripts/test_phase3.ts   # Administration (16 tests)
npx tsx scripts/test_phase4.ts   # Paie & Moteur (27 tests)
npx tsx scripts/test_phase5.ts   # Smart Audit (22 tests)
npx tsx scripts/test_phase6.ts   # Workflow d'approbation (53 tests)
npx tsx scripts/test_phase7.ts   # Espace Employé & PDF (40 tests)
npx tsx scripts/test_phase8.ts   # Paiement & Clôture (101 tests)

# Contrôles de qualité du code
npx tsc --noEmit                # Validation TypeScript stricte
npm run lint                    # Validation ESLint
npm run build                   # Compilation Next.js Turbopack
```

---

## 📌 Périmètre et Statut du MVP

> **Note importante** : UNI-PAY MVP est une plateforme fonctionnelle, stabilisée, auditée et prête pour démonstration institutionnelle. Elle opère en environnement local/démonstration (base SQLite, simulation bancaire contrôlée conforme aux formats techniques). Les raccordements aux passerelles de paiement en temps réel (SATIM/CIB/Edahabia) et aux systèmes fiscaux gouvernementaux (Jibayatic/DGI) constituent des développements ultérieurs hors périmètre du MVP.
