'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationSetup() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      navigator.serviceWorker.register('/sw.js').then(async reg => {
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      }).catch(() => {})
    }
  }, [])

  async function subscribe() {
    setLoading(true)
    setStatus('')
    try {
      const keyRes = await fetch('/api/push')
      const { publicKey } = await keyRes.json()
      if (!publicKey) { setStatus('❌ VAPID key არ არის კონფიგურებული'); setLoading(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      })
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      })
      setSubscribed(true)
      setStatus('✅ შეტყობინებები ჩართულია!')
    } catch (err) {
      setStatus(`❌ შეცდომა: ${err instanceof Error ? err.message : 'უცნობი'}`)
    }
    setLoading(false)
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await fetch('/api/push', { method: 'DELETE' })
      setSubscribed(false)
      setStatus('შეტყობინებები გამოირთო')
    } catch {}
    setLoading(false)
  }

  if (!supported) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔔 Push შეტყობინებები</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          კვების და ვარჯიშის შეხსენებები პირდაპირ მოწყობილობაზე
        </p>
        <div className="flex items-center gap-3">
          {subscribed ? (
            <Button onClick={unsubscribe} loading={loading} className="btn-secondary">
              🔕 გამოირთვა
            </Button>
          ) : (
            <Button onClick={subscribe} loading={loading}>
              🔔 ჩართვა
            </Button>
          )}
          {subscribed && <span className="text-sm text-green-600 font-medium">✅ ჩართულია</span>}
        </div>
        {status && <p className={`text-sm mt-2 ${status.startsWith('✅') ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>{status}</p>}
      </CardContent>
    </Card>
  )
}
