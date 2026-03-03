import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { addMinutes } from "date-fns"

const createReservationSchema = z.object({
    serviceId: z.string(),
    startTime: z.string().datetime(), // ISO string
})

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { serviceId, startTime } = createReservationSchema.parse(body)

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        })

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        const start = new Date(startTime)
        const end = addMinutes(start, service.duration)

        // Check availability again (Race condition check)
        // Count existing reservations overlapping with this slot
        const overlappingReservations = await prisma.reservation.count({
            where: {
                serviceId: serviceId,
                startTime: {
                    lt: end,
                },
                endTime: {
                    gt: start,
                },
                status: {
                    not: "CANCELLED",
                },
            },
        })

        if (overlappingReservations >= service.capacity) {
            return NextResponse.json({ error: "Slot no longer available" }, { status: 409 })
        }

        // Create Reservation
        const reservation = await prisma.reservation.create({
            data: {
                userId: session.user.id!,
                serviceId: serviceId,
                startTime: start,
                endTime: end,
                status: "CONFIRMED",
            },
        })

        return NextResponse.json(reservation)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: (error as any).errors }, { status: 400 })
        }
        console.error("Reservation Create Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
