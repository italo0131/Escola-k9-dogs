# K9 Training Platform

K9 Training e uma plataforma digital brasileira que conecta donos de caes e adestradores profissionais.

O produto combina:

- cadastro e acompanhamento de caes
- agenda e treinos
- conteudo em video e texto
- blog, forum e canais
- planos de assinatura
- dashboards por perfil

## Documentacao do produto

- Blueprint de produto: [docs/product-blueprint.md](docs/product-blueprint.md)
- Roadmap atual: [TODO.md](TODO.md)

## Stack atual

- Next.js App Router
- React 19
- Prisma
- PostgreSQL
- NextAuth
- Stripe
- Resend

## Perfis

- Cliente
- Adestrador
- Admin

## Regras de plano

- Free: ate 3 caes, blog e area de racas
- Pago: R$ 59,90/mes com acesso completo a conteudos, forum, treinos, agenda, IA e canais

## Rodando localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Build de producao

```bash
npx prisma migrate deploy
npm run build
npm run start
```

Se o banco atual ja foi sincronizado no passado com `prisma db push`, rode uma unica vez antes do primeiro deploy com migrations:

```bash
npx prisma migrate resolve --applied 20260402223000_init
```

## Pontos de infraestrutura para producao

- email transacional real
- checkout e webhook reais
- storage persistente para uploads
- revisao final de seguranca e observabilidade

## Observacao

O build passa, mas o repositório ainda possui uma divida tecnica relevante em lint e tipagem. A etapa de hardening para lancamento amplo ainda precisa ser concluida.
