import DogProfileForm from "../../DogProfileForm"

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DogProfileForm mode="edit" dogId={id} />
}
