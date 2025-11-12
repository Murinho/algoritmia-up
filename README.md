This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Getting Started

First install the necessary dependencies using:
```bash
npm i -D tailwindcss postcss autoprefixer lucide-react react-icons
```

First, run the development server:

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Python API

A lightweight FastAPI server lives in `Api/algoritmia-api.py`.

- Install dependencies: `pip install -r Api/requirements.txt`
- Run locally: `python Api/algoritmia-api.py`
- Test endpoints:
  - `GET http://localhost:8000/health`
  - `GET http://localhost:8000/version`
  - `GET http://localhost:8000/leaderboard`
  - `POST http://localhost:8000/echo`
  - `POST http://localhost:8000/init` (runs one-time init; accepts `?force=true` to re-run)
  - `GET http://localhost:8000/init/status`

Environment:
- Set `DATABASE_URL` to your PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/mydb`).
  The `POST /init` endpoint will create the `public.leaderboard` table if it does not exist.

The API enables CORS for `http://localhost:3000` by default so the Next.js app can call it during development.

curl -i "http://127.0.0.1:8000/users" \
  -H "Content-Type: application/json" \
  --data-binary @- <<'JSON'
{
  "full_name": "Adrián Muro Garduño",
  "email": "adrian@up.edu.mx",
  "codeforces_handle": "adrianmuro",
  "birthdate": "2002-10-09",
  "degree_program": "Ingeniería en IA",
  "entry_year": 2021,
  "country": "Mexico",
  "password": "1Qwerty$"
  "profile_image_url": "https://example.com/avatar.png"
}
JSON