# Z-CORNER

Food court digital multi-tenant. COD ke meja.

## Setup

```bash
cd A:\zcorner2
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Buka http://localhost:3000

## Akun demo

| Role | Email | Password |
|------|-------|----------|
| Super | super@zcorner.id | admin123 |
| Admin Nusantara | admin@nusantara.id | admin123 |
| Admin Kopi | admin@kopisenja.id | admin123 |

## Routes

- `/` customer home
- `/tenant/[id]` menu
- `/cart` checkout COD + nomor meja
- `/orders/[id]` tracking (poll 3s)
- `/admin/login` login
- `/admin` dashboard tenant (poll 4s)
- `/admin/menu` CRUD + upload
- `/admin/reports` laporan + CSV
- `/super` platform dashboard
