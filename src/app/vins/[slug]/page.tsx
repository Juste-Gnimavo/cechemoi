import { redirect } from 'next/navigation'

export default async function VinsSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/categorie/${slug}`)
}
