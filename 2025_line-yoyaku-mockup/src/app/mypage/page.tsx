import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ReservationList } from "@/components/reservation-list"

export default async function MyPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    const reservations = await prisma.reservation.findMany({
        where: { userId: session.user.id },
        include: { service: true },
        orderBy: { startTime: 'desc' }
    })

    return (
        <main className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">マイページ</h1>
            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4">予約履歴</h2>
                    <ReservationList reservations={reservations} />
                </section>
            </div>
        </main>
    )
}
