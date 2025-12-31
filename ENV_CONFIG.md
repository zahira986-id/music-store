# Configuration .env pour Supabase

## Instructions

Dans votre fichier `.env`, ajoutez cette ligne (remplacez [YOUR-PASSWORD] par votre vrai mot de passe):

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret

# JWT Secret
JWT_SECRET=votre-secret-key

# Supabase Database - Utilisez DATABASE_URL
DATABASE_URL=postgresql://postgres.qeiwompkizpbserbhmol:Zahira1996%40za@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

## Important!

⚠️ **Le caractère `@` dans votre mot de passe DOIT être encodé en `%40`**

Votre mot de passe: `Zahira1996@za`
Devient: `Zahira1996%40za`

## Votre DATABASE_URL complète

Remplacez `[YOUR-PASSWORD]` dans la connection string par `Zahira1996%40za`:

```
DATABASE_URL=postgresql://postgres.qeiwompkizpbserbhmol:Zahira1996%40za@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

## Étapes à suivre

1. Ouvrez votre fichier `.env`
2. Ajoutez la ligne `DATABASE_URL=...` (avec votre mot de passe encodé)
3. Vous pouvez **supprimer ou commenter** les anciennes lignes DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
4. Sauvegardez le fichier
5. Redémarrez le serveur

## Exemple de .env complet

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=votre-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-google-client-secret

# JWT Secret
JWT_SECRET=votre-secret-key-change-in-production

# Supabase Database Connection
DATABASE_URL=postgresql://postgres.qeiwompkizpbserbhmol:Zahira1996%40za@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# Anciennes configurations (peuvent être supprimées)
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=music
```
