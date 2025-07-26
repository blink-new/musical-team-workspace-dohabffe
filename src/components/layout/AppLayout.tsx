import { useState, useEffect } from 'react'
import { blink } from '@/blink/client'
import { User } from '@/types'
import { Loader2 } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="musical-gradient w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-2xl text-white">🎵</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Musical Team Workspace</h1>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour accéder à votre espace de travail musical
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster />
    </div>
  )
}