"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface ReservationWithService {
    id: string
    startTime: Date
    endTime: Date
    status: string
    service: {
        name: string
        duration: number
        price: number
    }
}

export function ReservationList({ reservations }: { reservations: ReservationWithService[] }) {
    if (reservations.length === 0) {
        return <p className="text-muted-foreground">予約履歴はありません。</p>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reservations.map((reservation) => (
                <Card key={reservation.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{reservation.service.name}</CardTitle>
                            <Badge variant={reservation.status === 'CANCELLED' ? 'destructive' : 'default'}>
                                {reservation.status === 'CONFIRMED' ? '予約確定' :
                                    reservation.status === 'CANCELLED' ? 'キャンセル' : '仮予約'}
                            </Badge>
                        </div>
                        <CardDescription>
                            {format(new Date(reservation.startTime), "yyyy年M月d日 HH:mm", { locale: ja })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>所要時間: {reservation.service.duration}分</p>
                            <p>料金: ¥{reservation.service.price.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
