This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```aiignore
  npm install
  
  replace USER with the local Postgres user. Add a password if that machine needs one: postgresql://USER:PASSWORD@localhost:5432/phamquocdat.

  printf 'AUTH_SECRET="%s"\nDATABASE_URL="postgresql://USER@localhost:5432/phamquocdat"\n' "$(openssl rand -base64 32)" > .env

  createdb phamquocdat

  npx prisma generate --config prisma7.config.ts

  //Apply the existing migrations
  npx prisma migrate deploy --config prisma7.config.ts

```


```aiignore
docker compose up -d  (s3 Mock)
```

```
to reset all db :
npx prisma migrate reset --config prisma7.config.ts

```

```admin create
npm run admin:create -- you@example.com 'a-long-password' 
```

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
