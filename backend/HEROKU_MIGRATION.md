# Instructions pour exécuter la migration sur Heroku

## Option 1: Exécuter via Heroku CLI (Recommandé)

1. Assurez-vous d'être authentifié sur Heroku :
```bash
heroku login
```

2. Exécutez la migration directement sur Heroku :
```bash
cd backend
heroku run npx prisma migrate deploy --app loudbrands-backend-eu
```

Ou utilisez le script de migration :
```bash
heroku run node scripts/migrate-stock-movements.js --app loudbrands-backend-eu
```

## Option 2: Migration automatique lors du déploiement

La migration Prisma formelle a été créée dans `prisma/migrations/20240101000000_add_stock_movements/`.

Lors du prochain déploiement sur Heroku, si votre `package.json` contient :
```json
"build": "prisma generate && prisma migrate deploy"
```

La migration sera automatiquement exécutée.

## Option 3: Via le Dashboard Heroku

1. Allez sur https://dashboard.heroku.com/apps/loudbrands-backend-eu
2. Cliquez sur "More" → "Run console"
3. Exécutez :
```bash
npx prisma migrate deploy
```

Ou :
```bash
node scripts/migrate-stock-movements.js
```

## Vérification

Pour vérifier que la table a été créée :
```bash
heroku run npx prisma studio --app loudbrands-backend-eu
```

Ou via la console Heroku :
```bash
heroku pg:psql --app loudbrands-backend-eu
```

Puis exécutez :
```sql
SELECT * FROM stock_movements LIMIT 10;
```
