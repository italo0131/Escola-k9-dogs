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
- Starter: acesso completo a conteudos, forum, treinos, agenda e canais
- Pro: acesso completo com posicionamento premium

## Rodando localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Build de producao

```bash
npm run build
npm run start
```

## Pontos de infraestrutura para producao

- email transacional real
- checkout e webhook reais
- storage persistente para uploads
- revisao final de seguranca e observabilidade

## Observacao

O build passa, mas o repositório ainda possui uma divida tecnica relevante em lint e tipagem. A etapa de hardening para lancamento amplo ainda precisa ser concluida.
