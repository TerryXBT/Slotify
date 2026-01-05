import { redirect } from 'next/navigation'

export default async function Page({
    params
}: {
    params: Promise<{ username: string; serviceId: string }>
}) {
    const { username, serviceId } = await params
    redirect(`/${username}?service=${serviceId}`)
}
