\# Together



Espacio compartido privado para parejas. V1: estado + ubicación básica.



\## Requisitos



\- Node >= 20

\- pnpm >= 9

\- Docker + Docker Compose



\## Puesta en marcha



```bash

pnpm install

cp .env.example apps/api/.env

cp .env.example apps/web/.env

pnpm db:up

pnpm dev

