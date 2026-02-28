import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-gray-900">404</h2>
        <p className="text-xl text-gray-600">Page Not Found</p>
        <p className="text-gray-500">Could not find requested resource</p>
      </div>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  )
}
