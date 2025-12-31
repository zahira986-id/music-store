# Configuration pour .env - Instructions de correction

## Problème détecté
Erreur de connexion à Supabase: `connect ETIMEDOUT`

## Cause probable
Le caractère `@` dans votre mot de passe doit être encodé en URL.

## Solution

Dans votre fichier `.env`, vous avez actuellement:
```
DB_PASSWORD=Zahira1996@za
```

### Option 1: Encoder le caractère @ (RECOMMANDÉ)
Remplacez `@` par `%40` dans le mot de passe:
```env
# Database Configuration
DB_HOST=aws-0-eu-west-1.pooler.supabase.com
DB_USER=postgres.abcdef123456
DB_PASSWORD=Zahira1996%40za
DB_NAME=postgres
DB_PORT=6543
```

### Option 2: Utiliser DATABASE_URL directement
Au lieu de DB_HOST, DB_USER, etc., utilisez une seule variable:
```env
DATABASE_URL=postgresql://postgres.abcdef123456:Zahira1996%40za@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

Puis modifiez `app.js` pour utiliser DATABASE_URL si elle existe.

### Option 3: Vérifier la connexion Supabase
Il est aussi possible que:
1. Le projet Supabase ne soit pas encore complètement démarré (attendez 2-3 minutes)
2. Le DB_USER soit incorrect (vérifiez bien qu'il commence par `postgres.` suivi de votre project ref)
3. Le mot de passe soit incorrect

## Étapes à suivre

1. **Corrigez votre `.env`** en remplaçant `@` par `%40` dans DB_PASSWORD
2. **Sauvegardez** le fichier
3. **Redémarrez** le serveur
4. **Vérifiez** le message de connexion

## Note importante
Assurez-vous que votre DB_USER ressemble à `postgres.xxxxxxxxxxxxx` (avec le bon project reference de Supabase).
