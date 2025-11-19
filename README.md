This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Launching the Frontend

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

## Launching the Backend
First go to the Api root folder:
```bash
cd Api
```

Secondly install the requirements:
```bash
pip install -r requirements.txt
```

Thirdly start the backend server at port 8000:
```bash
uvicorn algoritmia_api.app:app --reload --port 8000
```

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

- Test endpoints (Powershell):
  - Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:8000/init"

Environment:
- Set the following environment variables in your settings.json file located in File tab -> Preferences -> Settings -> Features -> Terminal -> Integrated -> Env: Windows:
  - "NEXT_PUBLIC_API_BASE_URL": "http://localhost:8000",
  - "DATABASE_URL": "postgresql://user:password@localhost:5432/mydb",
  - STMP variables too.
  
  The `POST /init` endpoint will create the `public.leaderboard` table if it does not exist.

The API enables CORS for `http://localhost:3000` by default so the Next.js app can call it during development.



