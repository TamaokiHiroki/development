import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>ログイン</CardTitle>
                    <CardDescription>ログイン方法を選択してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form
                        action={async () => {
                            "use server"
                            await signIn("line", { redirectTo: "/" })
                        }}
                    >
                        <Button className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white" type="submit">
                            LINEでログイン
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                またはメールアドレスでログイン
                            </span>
                        </div>
                    </div>

                    <form
                        action={async (formData) => {
                            "use server"
                            await signIn("credentials", formData)
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button className="w-full" type="submit">
                            メールアドレスでログイン
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
