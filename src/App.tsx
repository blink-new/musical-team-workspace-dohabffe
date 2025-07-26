import { useState, useEffect, useCallback } from 'react'
import { blink } from '@/blink/client'
import { TeamWithRole, UserProfile } from '@/types'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { useToast } from '@/hooks/use-toast'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [teams, setTeams] = useState<TeamWithRole[]>([])
  const [currentTeam, setCurrentTeam] = useState<TeamWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const { toast } = useToast()

  const loadUserData = useCallback(async (user: any) => {
    try {
      // Check if user profile exists
      const profiles = await blink.db.userProfiles.list({
        where: { userId: user.id }
      })

      if (profiles.length === 0) {
        setNeedsOnboarding(true)
        setLoading(false)
        return
      }

      setUserProfile(profiles[0])

      // Load user's teams with roles
      const memberships = await blink.db.teamMemberships.list({
        where: { 
          AND: [
            { userId: user.id },
            { isActive: "1" }
          ]
        }
      })

      if (memberships.length === 0) {
        setNeedsOnboarding(true)
        setLoading(false)
        return
      }

      // Get team details for each membership
      const teamIds = memberships.map(m => m.teamId)
      const teamData = await blink.db.teams.list({
        where: { id: { in: teamIds } }
      })

      // Combine team data with user roles
      const teamsWithRoles: TeamWithRole[] = teamData.map(team => {
        const membership = memberships.find(m => m.teamId === team.id)
        return {
          ...team,
          userRole: membership!.role
        }
      })

      setTeams(teamsWithRoles)
      
      // Set first team as current if none selected
      if (teamsWithRoles.length > 0) {
        setCurrentTeam(teamsWithRoles[0])
      }

    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données utilisateur",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading) {
        loadUserData(state.user)
      } else if (!state.isLoading) {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [loadUserData])

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false)
    if (user) {
      loadUserData(user)
    }
  }

  const handleTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (team) {
      setCurrentTeam(team)
    }
  }

  return (
    <AppLayout>
      {loading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      ) : needsOnboarding ? (
        <OnboardingFlow user={user} onComplete={handleOnboardingComplete} />
      ) : currentTeam ? (
        <div className="min-h-screen bg-background">
          <Header
            currentTeam={currentTeam}
            teams={teams}
            onTeamChange={handleTeamChange}
            user={user}
          />
          <main>
            <Dashboard currentTeam={currentTeam} user={user} />
          </main>
        </div>
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Aucune équipe trouvée</h1>
            <p className="text-muted-foreground mb-6">
              Vous n'êtes membre d'aucune équipe pour le moment.
            </p>
            <button
              onClick={handleOnboardingComplete}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Rejoindre ou créer une équipe
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}