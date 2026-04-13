"use client"

import Link from "next/link"

type AdminCard = {
  href: string
  title: string
  desc: string
}

const adminCards: AdminCard[] = [
  { href: "/dashboard", title: "Dashboard", desc: "Resumo do acompanhamento, clientes e modulos ativos" },
  { href: "/admin/users", title: "Usuarios", desc: "Criar contas, definir senhas temporarias e ajustar papeis" },
  { href: "/admin/modules", title: "Modulos", desc: "Criar o catalogo de acessos que cada cliente pode receber" },
  { href: "/admin/clients", title: "Clientes", desc: "Consultar a operacao dos clientes cadastrados" },
  { href: "/admin/dogs", title: "Caes", desc: "Acompanhar o cadastro dos caes vinculados aos clientes" },
  { href: "/admin/trainings", title: "Treinos", desc: "Gerenciar treinos, progresso e materiais" },
  { href: "/admin/schedule", title: "Agenda", desc: "Controlar sessoes, consultas e compromissos criados pela equipe" },
  { href: "/admin/security", title: "Seguranca", desc: "Auditoria, verificacoes e protecao operacional" },
]

export default function AdminConsoleClient({
  viewerName,
  viewerRole,
  isRoot,
}: {
  viewerName: string
  viewerRole: string
  isRoot: boolean
}) {
  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[30px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(8,145,178,0.14),rgba(15,23,42,0.92))] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/80">Perfil admin</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold">Centro de controle da plataforma</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {viewerName}, seu acesso como {viewerRole} agora concentra o que mais pesa na operacao: criacao de contas,
                atribuicao de modulos e acompanhamento da jornada dos clientes.
              </p>
            </div>
            <Link
              href="/admin/users"
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
            >
              Abrir usuarios
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/8"
            >
              <p className="text-lg font-semibold">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.desc}</p>
            </Link>
          ))}
        </div>

        {isRoot ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Observacao root</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Contas administrativas continuam exigindo cuidado especial. Use o painel de usuarios para elevar papeis com
              parcimonia e mantenha as chaves de ambiente fora do frontend.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
