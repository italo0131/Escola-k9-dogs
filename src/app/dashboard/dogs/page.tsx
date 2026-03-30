import { prisma } from "@/lib/prisma"

export default async function Dogs(){

 const dogs = await prisma.dog.findMany({
  include:{ owner:true }
 })

 return(

  <div>

   <h1 className="text-2xl font-bold mb-6">
    Cães cadastrados
   </h1>

   <div className="grid grid-cols-3 gap-6">

    {dogs.map(dog=>(
     
     <div key={dog.id}
      className="bg-white p-6 rounded-xl shadow"
     >

      <h2 className="font-bold text-lg">
       {dog.name}
      </h2>

      <p>Raça: {dog.breed}</p>
      <p>Idade: {dog.age}</p>
      <p>Tutor: {dog.owner.name}</p>

     </div>

    ))}

   </div>

  </div>

 )

}