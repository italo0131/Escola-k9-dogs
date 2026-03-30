// app/sobre/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Sobre | K9 Training Platform',
  description: 'Conheça a história da plataforma que conecta adestradores e amantes de cães.',
}

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/paw-pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Sobre a K9 Training
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Transformando a relação entre humanos e cães através da tecnologia e educação.
            </p>
          </div>
        </div>
      </section>

      {/* História */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold mb-4">Nossa História</h2>
              <p className="text-gray-300 mb-4">
                Fundada em 2025 por Italo, adestrador profissional e apaixonado por tecnologia, a K9 Training nasceu da necessidade de criar uma ponte entre adestradores qualificados e donos de cães que buscam orientação de qualidade.
              </p>
              <p className="text-gray-300 mb-4">
                Percebemos que muitos tutores enfrentam dificuldades para encontrar informações confiáveis e profissionais próximos. Ao mesmo tempo, adestradores competentes não tinham uma ferramenta digital para gerenciar seus clientes e compartilhar conhecimento.
              </p>
              <p className="text-gray-300">
                Hoje, somos uma comunidade em crescimento, com centenas de cães cadastrados e dezenas de profissionais parceiros. Nosso objetivo é continuar evoluindo e ajudando cada vez mais famílias a terem uma convivência harmoniosa com seus melhores amigos.
              </p>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden">
              <Image
                src="/images/about-dog.jpg"
                alt="Cão feliz ao lado de adestrador"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="py-16 bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">Missão</h3>
              <p className="text-gray-300">
                Democratizar o acesso à educação canina de qualidade e fortalecer o vínculo entre humanos e cães.
              </p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">Visão</h3>
              <p className="text-gray-300">
                Ser a principal referência em treinamento e bem-estar canino na América Latina até 2030.
              </p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">Valores</h3>
              <ul className="text-gray-300 space-y-2">
                <li>✔ Respeito aos animais</li>
                <li>✔ Ética profissional</li>
                <li>✔ Inovação constante</li>
                <li>✔ Comunidade colaborativa</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Equipe (opcional) */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold mb-12">Quem está por trás</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Membro 1 */}
            <div>
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-yellow-400">
                <Image src="/images/italo.jpg" alt="Italo" fill className="object-cover" />
              </div>
              <h3 className="text-xl font-semibold">Italo</h3>
              <p className="text-yellow-400">Fundador & Desenvolvedor</p>
              <p className="text-gray-400 text-sm mt-2">Adestrador e programador, uniu suas paixões para criar esta plataforma.</p>
            </div>
            {/* Adicione mais membros conforme necessário */}
          </div>
        </div>
      </section>
    </main>
  )
}