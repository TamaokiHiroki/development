"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"

interface Service {
    id: string
    name: string
    duration: number
    price: number
}

interface Slot {
    startTime: string
    endTime: string
    available: number
}

export function BookingForm({ service, userId }: { service: Service; userId?: string }) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [slots, setSlots] = useState<Slot[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [step, setStep] = useState<1 | 2>(1) // 1: Slot Selection, 2: User Input
    const [formData, setFormData] = useState({
        name: "",
        email: "", // Optional if user is logged in, but good to collect
        remarks: ""
    })
    const router = useRouter()

    useEffect(() => {
        if (date) {
            fetchSlots(date)
        }
    }, [date])

    const fetchSlots = async (selectedDate: Date) => {
        setLoadingSlots(true)
        setSlots([])
        setSelectedSlot(null)
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd")
            const res = await fetch(`/api/availability?serviceId=${service.id}&date=${dateStr}`)
            if (!res.ok) throw new Error("空き状況の取得に失敗しました")
            const data = await res.json()
            setSlots(data.slots || [])
        } catch (error) {
            toast.error("空き状況の読み込みに失敗しました")
        } finally {
            setLoadingSlots(false)
        }
    }

    const handleBook = async () => {
        if (!selectedSlot) return
        setSubmitting(true)
        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceId: service.id,
                    startTime: selectedSlot.startTime,
                    // Note: In a real app, we would save name/remarks to the reservation or user profile
                    // For now, we just pass the core booking data
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "予約に失敗しました")
            }

            toast.success("予約が完了しました！")
            router.push("/mypage")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleNext = () => {
        if (selectedSlot) setStep(2)
    }

    const handleBack = () => {
        setStep(1)
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {step === 1 && (
                <>
                    <div>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            locale={ja}
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>予約日時を選択</CardTitle>
                            <CardDescription>
                                {date ? format(date, "yyyy年M月d日", { locale: ja }) : "日付を選択してください"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSlots ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-muted-foreground text-sm">この日の空き枠はありません。</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {slots.map((slot, i) => (
                                        <Button
                                            key={i}
                                            variant={selectedSlot === slot ? "default" : "outline"}
                                            className="w-full"
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            {format(new Date(slot.startTime), "HH:mm")}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                disabled={!selectedSlot}
                                onClick={handleNext}
                            >
                                次へ進む
                            </Button>
                        </CardFooter>
                    </Card>
                </>
            )}

            {step === 2 && (
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <CardTitle>予約内容の確認</CardTitle>
                        </div>
                        <CardDescription>以下の内容で予約を確定します。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2 p-4 border rounded-md bg-muted/50">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">メニュー:</span>
                                <span className="font-medium">{service.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">日時:</span>
                                <span className="font-medium">
                                    {selectedSlot && format(new Date(selectedSlot.startTime), "yyyy年M月d日 HH:mm", { locale: ja })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">料金:</span>
                                <span className="font-medium">¥{service.price.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">お名前 (任意)</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="山田 太郎"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="remarks">備考 (任意)</Label>
                            <Textarea
                                id="remarks"
                                value={formData.remarks}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="ご要望などがあればご記入ください"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        {!userId ? (
                            <Button className="w-full" onClick={() => router.push("/login")}>
                                ログインして予約する
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                disabled={submitting}
                                onClick={handleBook}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                予約を確定する
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
