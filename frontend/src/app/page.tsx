import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Cushion
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          AI가 분석하는 나만의 감정 일기장
        </p>
        <p className="mt-2 text-base leading-7 text-gray-600">
          매일의 감정을 기록하고, AI가 당신의 마음 상태를 분석해드립니다.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/auth/register">
            <Button size="lg">시작하기</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">
              로그인
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}