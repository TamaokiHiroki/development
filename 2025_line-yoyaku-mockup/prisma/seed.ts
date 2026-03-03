import { PrismaClient, ServiceType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Create Services
    const services = [
        {
            name: "Initial Consultation",
            description: "First meeting to discuss requirements.",
            duration: 60,
            price: 5000,
            type: ServiceType.MEETING,
            capacity: 1,
        },
        {
            name: "Follow-up Session",
            description: "Review progress and next steps.",
            duration: 30,
            price: 3000,
            type: ServiceType.MEETING,
            capacity: 1,
        },
        {
            name: "Group Workshop",
            description: "Learn basics in a group setting.",
            duration: 90,
            price: 2000,
            type: ServiceType.EVENT,
            capacity: 5,
        },
    ]

    for (const s of services) {
        await prisma.service.create({
            data: s,
        })
    }

    console.log('Seed data inserted')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
