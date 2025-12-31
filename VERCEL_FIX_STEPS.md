# Étapes pour réparer la synchronisation Vercel

Si vous voyez vos modifications sur GitHub mais que Vercel ne lance pas de nouveau déploiement, suivez ces étapes :

### 1. Vérifier la Branche de Production
Vercel ne déploie automatiquement que la branche qu'il considère comme la "Production".
1.  Allez dans l'onglet **Settings** de votre projet Vercel.
2.  Cliquez sur **Git** dans le menu à gauche.
3.  Vérifiez que la **Production Branch** est bien `main`. Si c'est écrit `master` ou autre chose, cliquez sur **Edit** pour mettre `main`.

### 2. Déclencher un Déploiement Manuel
Si la branche est correcte mais que rien ne se passe :
1.  Allez dans l'onglet **Deployments**.
2.  Cliquez sur les trois petits points **(...)** à côté du dernier déploiement réussi.
3.  Choisissez **Redeploy**.
4.  **IMPORTANT** : Dans la fenêtre qui s'ouvre, assurez-vous que l'option "Use latest commit from branch" (ou similaire) est cochée, puis cliquez sur **Redeploy**.

### 3. Re-déployer via GitHub (Si besoin)
Si vous ne voyez toujours pas le commit `"FORCE BUILD"` :
1.  Allez dans l'onglet **Overview**.
2.  Cliquez sur le bouton **"Add New..."** puis **"Project"** (même si le projet existe déjà).
3.  Vérifiez si Vercel vous propose de "Connect" ou "Import" à nouveau le dépôt pour rafraîchir le lien.

### 4. Vérifier les Logs de Build
Si un déploiement apparaît mais échoue :
1.  Cliquez sur le déploiement en cours.
2.  Allez dans l'onglet **Logs**.
3.  Si vous voyez une erreur, copiez-la moi ici.

> [!TIP]
> Mon dernier commit s'appelle **`FORCE BUILD: Trigger Vercel`**. C'est celui-là qu'on veut voir en haut de la liste !
