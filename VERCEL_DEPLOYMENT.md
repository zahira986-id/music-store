# Guide de Déploiement Vercel - Étapes Simplifiées

## Avant de commencer
Assurez-vous que votre code est poussé sur GitHub (votre repo: zahira986-id/Music-Store)

## Étape 1: Créer un compte / Se connecter à Vercel

1. Allez sur **https://vercel.com**
2. Cliquez sur **"Sign Up"** ou **"Login"**
3. Choisissez **"Continue with GitHub"**
4. Autorisez Vercel à accéder à vos repos GitHub

## Étape 2: Importer votre projet

1. Une fois connecté, cliquez sur **"Add New..."** (en haut à droite)
2. Sélectionnez **"Project"**
3. Vous verrez une liste de vos repos GitHub
4. Trouvez **"Music-Store"** et cliquez sur **"Import"**

## Étape 3: Configuration du projet

Sur la page de configuration:

### Framework Preset
- Sélectionnez **"Other"**

### Root Directory
- Laissez **"./"** (par défaut)

### Build Settings
- **Build Command**: Laissez vide
- **Output Directory**: Laissez vide
- **Install Command**: `npm install` (devrait être automatique)

## Étape 4: Variables d'environnement (IMPORTANT!)

Avant de déployer, ajoutez ces variables:

Cliquez sur **"Environment Variables"** et ajoutez:

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres.qeiwompkizpbserbhmol:Zahira1996ZA@aws-1-eu-west-1.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | `votre-secret-super-securise-changez-moi` |
| `GOOGLE_CLIENT_ID` | Votre Google Client ID |
| `GOOGLE_CLIENT_SECRET` | Votre Google Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://your-app.vercel.app/auth/google/callback` (à mettre à jour après le premier déploiement) |

### Comment ajouter une variable:
1. Tapez le **Name** (ex: `NODE_ENV`)
2. Tapez la **Value** (ex: `production`)
3. Cliquez **"Add"**
4. Répétez pour chaque variable

## Étape 5: Déployer

1. Une fois toutes les variables ajoutées, cliquez sur **"Deploy"**
2. Attendez 1-3 minutes
3. Vercel va:
   - Cloner votre repo
   - Installer les dépendances
   - Déployer l'application

## Étape 6: Après le premier déploiement

Vous recevrez une URL comme: `https://music-store-xyz.vercel.app`

### Mettre à jour Google OAuth:
1. Copiez votre URL Vercel
2. Allez dans **Google Cloud Console**
3. OAuth 2.0 Client → **Authorized redirect URIs**
4. Ajoutez: `https://votre-url-vercel.vercel.app/auth/google/callback`
5. **Sauvegardez**

### Mettre à jour GOOGLE_CALLBACK_URL dans Vercel:
1. Vercel Dashboard → Votre projet → **Settings**
2. **Environment Variables**
3. Trouvez `GOOGLE_CALLBACK_URL`
4. Cliquez **"Edit"**
5. Remplacez par votre vraie URL Vercel
6. **Sauvegardez**
7. Allez dans **Deployments** → cliquez sur les 3 points du dernier déploiement → **"Redeploy"**

## Terminé! 🎉

Votre application sera accessible à: `https://votre-app.vercel.app`

## Dépannage

### Erreur lors du build
- Vérifiez les logs dans Vercel
- Assurez-vous que toutes les variables d'environnement sont définies

### L'app ne se connecte pas à la base de données
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez dans les logs Vercel (`Functions` tab)

### Google OAuth ne fonctionne pas
- Vérifiez que `GOOGLE_CALLBACK_URL` correspond à votre URL Vercel
- Vérifiez que l'URL est aj outée dans Google Cloud Console
