export default function Topbar(){

 return(

  <div className="w-full h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6">

   <div className="font-semibold">
    Dashboard
   </div>

   <div className="flex items-center gap-4">

    <button className="bg-gray-200 px-3 py-1 rounded">
     Notificações
    </button>

    <button className="bg-gray-200 px-3 py-1 rounded">
     Perfil
    </button>

    <button className="bg-red-500 text-white px-3 py-1 rounded">
     Logout
    </button>

   </div>

  </div>

 )

}


