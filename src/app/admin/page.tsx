import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts'

export default async function AdminPage() {
  return (
    <div className="space-y-8">
      <AnalyticsCharts />

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/users">
          <Card className="hover:border-primary-500 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <span className="text-4xl">👥</span>
              <div>
                <h3 className="font-semibold">მომხმარებლების მართვა</h3>
                <p className="text-sm text-[var(--muted-foreground)]">სია, გამოწერები, ადმინ უფლებები</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
