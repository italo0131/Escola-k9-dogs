export default function Sidebar(){

 return(

  <div className="w-64 h-screen bg-white border-r">

   <div className="p-6 font-bold text-xl border-b">
    K9 Platform
   </div>

   <nav className="p-4 flex flex-col gap-3">

    <a href="/dashboard" className="p-2 hover:bg-gray-100 rounded">
     Dashboard
    </a>

    <a href="/dashboard/dogs" className="p-2 hover:bg-gray-100 rounded">
     Cães
    </a>

    <a href="/dashboard/clients" className="p-2 hover:bg-gray-100 rounded">
     Clientes
    </a>

    <a href="/dashboard/schedule" className="p-2 hover:bg-gray-100 rounded">
     Agenda
    </a>

    <a href="/dashboard/settings" className="p-2 hover:bg-gray-100 rounded">
     Configurações
    </a>

   </nav>

  </div>

 )

}