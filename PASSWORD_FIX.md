# Erreur: password authentication failed

## Problème
L'application se connecte à Supabase mais l'authentification échoue.

## Vérification de votre .env

Votre `.env` doit contenir EXACTEMENT:

```env
DATABASE_URL=postgresql://postgres.qeiwompkizpbserbhmol:Zahira1996%40za@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

## Points à vérifier:

### 1. Le DB_USER est-il correct?
Dans la connection string, le user doit être `postgres.qeiwompkizpbserbhmol` (avec le point entre "postgres" et votre project ref)

### 2. Le mot de passe est-il encodé?
Le caractère `@` DOIT être `%40`
- ❌ Incorrect: `Zahira1996@za`
- ✅ Correct: `Zahira1996%40za`

### 3. Le mot de passe est-il le bon?
Vérifiez dans Supabase → Settings → Database que c'est bien le mot de passe que vous avez défini.

## Si le mot de passe est perdu

1. Allez dans Supabase Dashboard
2. Settings → Database  
3. Cliquez sur "Reset Database Password"
4. Créez un nouveau mot de passe SANS caractères spéciaux (ex: `Zahira1996za`)
5. Mettez à jour votre `.env`:
   ```env
   DATABASE_URL=postgresql://postgres.qeiwompkizpbserbhmol:Zahira1996za@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
   ```

## Next Step

Vérifiez et corrigez votre `.env`, puis dites-moi "fait" pour retester!
