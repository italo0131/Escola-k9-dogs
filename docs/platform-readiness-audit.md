# Platform Readiness Audit

Data da leitura: 2026-03-24
Base considerada: estado atual do codigo local

## Status rapido
- `feito`: autenticacao com NextAuth, protecao de rotas, sessao com plano, verificacao de email, rate limiting basico, area de racas com IA e perfil, dashboard/cursos/caes com UX mais humana.
- `parcial`: verificacao de telefone, seguranca de cabecalhos, feedbacks de UI, microinteracoes, skeletons, transparencia de IA, persistencia do perfil do consultor de racas.
- `pendente`: integracao real de SMS, Sentry, analytics, storage dedicado de imagens, migracoes de banco aplicadas em ambiente acessivel, benchmarks formais, testes com usuarios reais, backup automatizado documentado.

## Autenticacao e seguranca
- `feito`: login por email e senha com NextAuth.
- `feito`: sessao JWT com `plan`, `role`, `emailVerifiedAt` e `status` no token e na sessao.
- `feito`: middleware protegendo rotas privadas e controle por plano.
- `feito`: rate limiting em login e verificacoes.
- `feito`: protecao de origem cruzada em endpoints sensiveis.
- `parcial`: headers de seguranca no middleware; precisam ser validados no deploy final com todas as integrações externas.
- `pendente`: auditoria persistida de tentativas de login e logout dedicado via endpoint proprio.

## Verificacao de conta
- `feito`: fluxo de verificacao de email com codigo, reenvio e confirmacao.
- `parcial`: telefone com codigo, confirmacao e reset do status ao trocar numero; falta provedor real de SMS.
- `parcial`: cooldown de UX no front para reenvio de codigo.

## UX, acessibilidade e tom de voz
- `feito`: skip link para teclado, foco visivel e alvos de toque minimos.
- `feito`: toasts reutilizaveis para feedback de acao.
- `feito`: skeleton basico reutilizavel.
- `feito`: microinteracoes globais de hover, foco e entrada suave.
- `feito`: copy mais humana em login, cadastro, verificacao, cursos, area de caes e banner de sessao.
- `parcial`: ainda vale espalhar esse mesmo nivel para agenda, treino, forum e mais telas administrativas.

## IA
- `feito`: consultor geral com transparencia e fallback guiado.
- `feito`: consultor de racas com perfil do tutor, catalogo real e restricao ao catalogo da plataforma.
- `parcial`: recomendacoes de curso/treino ainda podem crescer com historico mais profundo do usuario e cache dedicado.
- `pendente`: embeddings e busca vetorial para recomendacoes avancadas.

## Areas principais
- `feito`: dashboard, cursos, caes e racas com experiencia principal funcional.
- `parcial`: agenda, treino, forum e perfil ainda precisam da mesma rodada de refinamento visual/semantico.
- `pendente`: certificado de curso, notificacoes push, Google Calendar, melhor resposta no forum e exclusao LGPD ponta a ponta.

## Infra e producao
- `feito`: build local passando no estado validado deste workspace.
- `parcial`: deploy preparado, mas depende de variaveis e banco acessivel para aplicar schema completo.
- `pendente`: storage externo, monitoramento, analytics, backup automatizado e politica/termos publicados.
