import { prisma } from "@/lib/prisma"
import { BookingForm } from "@/components/booking-form"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

interface PageProps {
    params: Promise<{
        serviceId: string
    }>
}

export default async function BookingPage({ params }: PageProps) {
    const session = await auth()
    const { serviceId } = await params
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
    })

    if (!service) {
        notFound()
    }

    return (
        <main className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
            <p className="text-muted-foreground mb-8">{service.description}</p>

            <BookingForm service={service} userId={session?.user?.id} />
        </main>
    )
}
