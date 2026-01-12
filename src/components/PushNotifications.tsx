'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from '@/utils/toast'

export default function PushNotifications() {
  const [mounted, setMounted] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    setMounted(true)
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Your browser does not support notifications')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        toast.success('Notifications enabled successfully!')

        // Send a test notification
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          registration.showNotification('Slotify Notifications', {
            body: 'You will now receive booking reminders',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'welcome',
          })
        }
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Please enable them in your browser settings.')
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      toast.error('Failed to enable notifications')
    }
  }

  if (!mounted || !isSupported) {
    return null
  }

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${permission === 'granted'
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
          {permission === 'granted' ? (
            <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <BellOff className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {permission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {permission === 'granted'
              ? 'You will receive reminders about your upcoming bookings'
              : 'Get notified about your upcoming appointments and booking changes'
            }
          </p>

          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Enable Notifications
            </button>
          )}

          {permission === 'granted' && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ You&apos;re all set!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
