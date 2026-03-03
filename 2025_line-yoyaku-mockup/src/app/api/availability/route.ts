import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, addMinutes, format, parseISO, isBefore } from "date-fns"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const serviceId = searchParams.get("serviceId")
    const dateString = searchParams.get("date") // YYYY-MM-DD

    if (!serviceId || !dateString) {
        return NextResponse.json({ error: "Missing serviceId or date" }, { status: 400 })
    }

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        })

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // Business Hours (Hardcoded for MVP, could be in DB)
        const BUSINESS_START_HOUR = 10
        const BUSINESS_END_HOUR = 20

        const queryDate = parseISO(dateString)
        const startOfQueryDate = startOfDay(queryDate)
        const endOfQueryDate = endOfDay(queryDate)

        // Fetch existing reservations for this service on this date
        // Note: We might also need to check Resource availability if resources are assigned dynamically
        // For MVP, we'll check Service Capacity.
        const reservations = await prisma.reservation.findMany({
            where: {
                serviceId: serviceId,
                startTime: {
                    gte: startOfQueryDate,
                    lt: endOfQueryDate,
                },
                status: {
                    not: "CANCELLED",
                },
            },
        })

        // Generate slots
        const slots = []
        let currentTime = new Date(queryDate)
        currentTime.setHours(BUSINESS_START_HOUR, 0, 0, 0)

        const endTime = new Date(queryDate)
        endTime.setHours(BUSINESS_END_HOUR, 0, 0, 0)

        const duration = service.duration // minutes
        const interval = 30 // step in minutes (could be same as duration or fixed)

        while (isBefore(currentTime, endTime)) {
            const slotEnd = addMinutes(currentTime, duration)

            if (isBefore(endTime, slotEnd)) {
                break // Exceeds business hours
            }

            // Check availability
            // A slot is available if:
            // 1. It doesn't overlap with fully booked periods
            // For simple capacity check: count reservations that overlap with this slot

            const overlappingReservations = reservations.filter((res: any) => {
                // Check overlap: (StartA < EndB) and (EndA > StartB)
                return (res.startTime < slotEnd) && (res.endTime > currentTime)
            })

            if (overlappingReservations.length < service.capacity) {
                slots.push({
                    startTime: new Date(currentTime),
                    endTime: slotEnd,
                    available: service.capacity - overlappingReservations.length
                })
            }

            currentTime = addMinutes(currentTime, interval)
        }

        return NextResponse.json({ slots })

    } catch (error) {
        console.error("Availability API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
