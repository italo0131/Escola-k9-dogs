import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isStaffRole } from "@/lib/role"
import { requireApiUser } from "../_auth"
import { normalizeVideoUrl } from "@/lib/video"
import { hasPremiumPlatformAccess } from "@/lib/platform"

export async function GET(){

 const { session, error } = await requireApiUser()
 if(error) return error

 if(!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)){
  return NextResponse.json({success:false,message:"Treinos completos disponiveis apenas nos planos pagos"},{status:403})
 }

 const where = isStaffRole(session.user.role) ? {} : { dog:{ ownerId: session.user.id } }

 const training = await prisma.trainingSession.findMany({
  where,
  include:{ dog:true, coach:true },
  orderBy:{ executedAt:"desc" }
 })

 return NextResponse.json(training)

}

export async function POST(req:Request){

 const { session, error } = await requireApiUser()
 if(error) return error

 if(!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)){
  return NextResponse.json({success:false,message:"Treinos completos disponiveis apenas nos planos pagos"},{status:403})
 }

 const data = await req.json()
  const title = String(data?.title || "").trim()
  const description = String(data?.description || "").trim() || null
  const dogId = String(data?.dogId || "").trim()

  if(!title || !dogId){
   return NextResponse.json({success:false,message:"Titulo e cao sao obrigatorios"},{status:400})
  }

 const dog = await prisma.dog.findUnique({ where:{ id:dogId } })
 if(!dog){
  return NextResponse.json({success:false,message:"Cao nao encontrado"},{status:404})
 }

 if(!isStaffRole(session.user.role) && dog.ownerId !== session.user.id){
  return NextResponse.json({success:false,message:"Sem permissão para registrar treino para este cão"},{status:403})
 }

 const training = await prisma.trainingSession.create({
  data:{
   title,
   description,
   focusArea: String(data?.focusArea || "").trim().toUpperCase() || null,
   difficulty: String(data?.difficulty || "").trim().toUpperCase() || null,
   durationMinutes: data?.durationMinutes ? Math.max(1, Number(data.durationMinutes)) : null,
   trainerNotes: String(data?.trainerNotes || "").trim() || null,
   homework: String(data?.homework || "").trim() || null,
   videoUrl: normalizeVideoUrl(data?.videoUrl),
   progress: Math.max(0, Math.min(100, Number(data.progress) || 0)),
   dogId,
   coachId: session.user.id!,
   executedAt: data?.executedAt ? new Date(data.executedAt) : new Date()
  },
  include:{ dog:true, coach:true }
 })

 return NextResponse.json(training)

}
