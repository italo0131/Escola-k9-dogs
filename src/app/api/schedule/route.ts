import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isStaffRole } from "@/lib/role"
import { requireApiUser } from "../_auth"
import { hasPremiumPlatformAccess } from "@/lib/platform"

export async function GET(){

 const { session, error } = await requireApiUser()
 if(error) return error

 if(!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)){
  return NextResponse.json({success:false,message:"Agenda completa disponivel apenas nos planos pagos"},{status:403})
 }

 const where = isStaffRole(session.user.role) ? {} : { userId: session.user.id }

 const schedule = await prisma.schedule.findMany({
  where,
  include:{ user:true, trainer:true, dog:true },
  orderBy:{ date:"asc" }
 })

 return NextResponse.json(schedule)

}

export async function POST(req:Request){

 const { session, error } = await requireApiUser()
 if(error) return error

 if(!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)){
  return NextResponse.json({success:false,message:"Agenda completa disponivel apenas nos planos pagos"},{status:403})
 }

 const data = await req.json()
 const dogId = String(data?.dogId || "").trim() || null
 const parsedDate = new Date(data?.date)

 if(Number.isNaN(parsedDate.getTime())){
  return NextResponse.json({success:false,message:"Data invalida"},{status:400})
 }

 let userId = isStaffRole(session.user.role) && data.userId ? data.userId : session.user.id

 if(dogId){
  const dog = await prisma.dog.findUnique({ where:{ id:dogId } })
  if(!dog){
   return NextResponse.json({success:false,message:"Cao nao encontrado"},{status:404})
  }
  if(isStaffRole(session.user.role)){
   userId = dog.ownerId
  }
  if(!isStaffRole(session.user.role) && dog.ownerId !== session.user.id){
   return NextResponse.json({success:false,message:"Sem permissao para agendar este cao"},{status:403})
  }
 }

 const schedule = await prisma.schedule.create({
  data:{
   title:String(data?.title || "Sessao de treino").trim() || "Sessao de treino",
   notes:String(data?.notes || "").trim() || null,
   location:String(data?.location || "").trim() || null,
   format:String(data?.format || "PRESENTIAL").trim().toUpperCase(),
   durationMinutes:data?.durationMinutes ? Math.max(15, Number(data.durationMinutes)) : null,
   date:parsedDate,
   status:String(data?.status || "Pendente").trim(),
   userId,
   trainerId:isStaffRole(session.user.role) ? session.user.id : null,
   dogId
  },
  include:{ user:true, trainer:true, dog:true }
 })

 return NextResponse.json(schedule)

}
