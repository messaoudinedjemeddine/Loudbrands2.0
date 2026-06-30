# Instructions pour créer la table stock_movements

## Option 1: Utiliser le script Node.js (Recommandé)

1. Assurez-vous que votre fichier `.env` contient `DATABASE_URL` avec votre connexion PostgreSQL
2. Exécutez la commande suivante :

```bash
cd backend
npm run db:migrate:stock-movements
```

Ou directement :

```bash
node scripts/migrate-stock-movements.js
```

## Option 2: Utiliser Prisma Migrate

Si vous avez `DATABASE_URL` configuré dans votre `.env` :

```bash
cd backend
npx prisma migrate dev --name add_stock_movements
```

## Option 3: Exécuter le script SQL directement

Si vous préférez exécuter le SQL directement sur votre base de données :

1. Connectez-vous à votre base de données PostgreSQL
2. Exécutez le contenu du fichier `migrations/add_stock_movements.sql`

Ou via psql :

```bash
psql -U votre_utilisateur -d votre_base_de_donnees -f migrations/add_stock_movements.sql
```

## Vérification

Pour vérifier que la table a été créée correctement :

```bash
cd backend
npx prisma studio
```

Ou exécutez cette requête SQL :

```sql
SELECT * FROM stock_movements LIMIT 10;
```
