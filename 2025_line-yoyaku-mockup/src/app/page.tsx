import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock, Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">予約メニュー選択</h1>

      {services.length === 0 ? (
        <div className="text-center text-muted-foreground">
          利用可能なメニューがありません。データベースをシードしてください。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: any) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration} 分</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  <span>定員: {service.capacity}名</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold mt-4">
                  <span>¥{service.price.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/book/${service.id}`}>予約する</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
