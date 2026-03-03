# Role
あなたは世界トップクラスのフルスタックエンジニアです。
TypeScript, Next.js, Prisma, PostgreSQLを用いた堅牢でスケーラブルな予約システムの構築を行います。

# Project Overview
LINE公式アカウント（LIFF）とWebブラウザの両方から利用可能な「ハイブリッド型予約システム」を構築します。
ユーザーは「Web（メールアドレス認証）」または「LINE（LINEログイン）」のいずれかでシステムを利用します。

# Tech Stack & Libraries
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase or Neon)
- **ORM:** Prisma
- **Auth:** NextAuth.js (Auth.js) v5
    - Providers: Credentials (Email/Pass), LINE Provider
- **UI:** Tailwind CSS, shadcn/ui, Lucide React
- **Form:** React Hook Form + Zod
- **Date Handling:** date-fns

# Database Schema (Prisma Draft)
以下のデータモデルをベースに実装してください。

```prisma
// ユーザー（顧客）
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique // Web利用時は必須
  emailVerified DateTime?
  image         String?
  lineUserId    String?   @unique // LINE利用時は必須
  password      String?   // Web利用時
  role          Role      @default(USER) // ADMIN or USER
  accounts      Account[]
  reservations  Reservation[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// 認証用（NextAuth）
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

// 予約メニュー（面談、来店、イベント等）
model Service {
  id          String   @id @default(cuid())
  name        String   // メニュー名
  description String?
  duration    Int      // 所要時間（分）
  price       Int      @default(0)
  type        ServiceType // MEETING, VISIT, EVENT
  capacity    Int      @default(1) // 同枠の定員（イベントなら複数）
  reservations Reservation[]
}

enum ServiceType {
  MEETING
  VISIT
  EVENT
}

// 予約リソース（担当者、部屋など）
model Resource {
  id          String   @id @default(cuid())
  name        String
  type        String   // STAFF, ROOM
  isAvailable Boolean  @default(true)
  reservations Reservation[]
}

// 予約データ
model Reservation {
  id          String   @id @default(cuid())
  userId      String
  serviceId   String
  resourceId  String?  // リソース指定がない場合もある
  startTime   DateTime
  endTime     DateTime
  status      ResStatus @default(CONFIRMED)
  
  user        User     @relation(fields: [userId], references: [id])
  service     Service  @relation(fields: [serviceId], references: [id])
  resource    Resource? @relation(fields: [resourceId], references: [id])

  createdAt   DateTime @default(now())
}

enum ResStatus {
  PENDING
  CONFIRMED
  CANCELLED
}
```

# Functional Requirements

## 1. Authentication (Critical)

  - **Web User:** メールアドレスとパスワードによるサインアップ/ログイン。
  - **LINE User:** LINEログイン（LIFF含む）を利用。`line_user_id` を取得し、既存ユーザーがいなければ新規作成。
  - **Merge Strategy:** (今回はMVPのため実装しないが、将来的にEmailとLINEの紐付けを考慮した設計にすること)

## 2. User Interface (Client Side)

  - **Responsive:** スマホファースト（SP）で設計する。LIFF内で違和感のないUI。
  - **Booking Flow:**
    1.  メニュー選択 (Service)
    2.  カレンダー/時間選択 (空き枠検索ロジックが必要)
    3.  情報入力・確認
    4.  完了
  - **My Page:** 予約履歴の確認とキャンセル機能。

## 3. Admin Dashboard

  - ダッシュボードレイアウトを使用 (Sidebar + Main Content)。
  - **Calendar View:** 全体の予約状況をカレンダーで閲覧。
  - **Service/Resource Management:** メニューやスタッフのCRUD。

# Implementation Steps (Instruction for AI)

まずは以下の順序で実装コードを提案・生成してください。

1.  **Setup:** Prisma schemaの定義とMigrationファイルの作成。
2.  **Auth:** NextAuthの設定 (LINE Provider, Credentials Provider)。
3.  **Backend API:** 予約可能な時間枠を計算するAPI (`GET /api/availability`) の実装。※ここが最も複雑です。重複予約を防ぐロジックを含めてください。
4.  **UI Components:** shadcn/uiを使った基本コンポーネントと予約フォームの実装。
