# K9 Training Platform: Switch to Internal Docker DB + Admin Setup

## Status: In Progress

### Step 1: [COMPLETED] Create .env.local with internal Docker DB URL
- DATABASE_URL=postgresql://devStartp:1533@localhost:5432/devStartp?schema=public

### Step 2: [COMPLETED] Start Docker DB
- `docker compose up -d db`

### Step 3: [COMPLETED] Sync Prisma schema to internal DB
 - `npx prisma generate` ✅
 - `npx prisma db push --force-reset` ✅ (using .env.local, DB reset & schema pushed to localhost:5432)

### Step 4: [COMPLETED] Create Admin User
- Admin: italoameida013@gmail.com / lafamiia013 (role: ADMIN)
- Admin email: italoameida013@gmail.com
- Password: lafamiia013
- Role: ADMIN (create via Prisma script)

### Step 5: [PENDING] Start full platform
- `docker compose up`
- `docker compose up` (or compose.debug.yaml for dev)

### Step 6: [PENDING] Verify
- Check Prisma Studio: `npx prisma studio`
- Login as admin

### Step 7: [COMPLETED] Cleanup / Test app connection
