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
      console.log('🔄 Loading user data for:', user.id)
      console.log('👤 User object:', user)

      // Check if user exists in our database
      console.log('📋 Checking user in database...')
      const users = await blink.db.users.list({
        where: { id: user.id }
      })
      console.log('✅ Users found:', users)

      if (users.length === 0) {
        console.log('❌ User not found in database - creating user record...')
        // Create user record
        const newUser = await blink.db.users.create({
          id: user.id,
          email: user.email,
          display_name: user.displayName || user.email,
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          avatar_url: user.avatarUrl || ''
        })
        console.log('✅ User record created:', newUser)
        setUserProfile(newUser)
      } else {
        setUserProfile(users[0])
        console.log('✅ User profile set:', users[0])
      }

      // Load user's teams with roles
      console.log('🏢 Loading team memberships...')
      const memberships = await blink.db.team_members.list({
        where: { 
          user_id: user.id
        }
      })
      console.log('✅ Team memberships found:', memberships)

      if (memberships.length === 0) {
        console.log('❌ No team memberships found - onboarding required')
        setNeedsOnboarding(true)
        setLoading(false)
        return
      }

      // Get team details for each membership
      console.log('📋 Loading team details...')
      const teamIds = memberships.map(m => m.team_id)
      console.log('🆔 Team IDs to load:', teamIds)
      
      // Load teams one by one to avoid issues with 'in' clause
      const teamData = []
      for (const teamId of teamIds) {
        console.log(`🔍 Loading team: ${teamId}`)
        const teams = await blink.db.teams.list({
          where: { id: teamId }
        })
        if (teams.length > 0) {
          teamData.push(teams[0])
          console.log(`✅ Team loaded: ${teams[0].name}`)
        } else {
          console.log(`❌ Team not found: ${teamId}`)
        }
      }
      console.log('✅ All team data loaded:', teamData)

      // Combine team data with user roles
      const teamsWithRoles: TeamWithRole[] = teamData.map(team => {
        const membership = memberships.find(m => m.team_id === team.id)
        return {
          ...team,
          userRole: membership!.role,
          invitation_code: team.invitation_code
        }
      })
      console.log('🎭 Teams with roles:', teamsWithRoles)

      setTeams(teamsWithRoles)
      
      // Set first team as current if none selected
      if (teamsWithRoles.length > 0) {
        setCurrentTeam(teamsWithRoles[0])
        console.log('🎯 Current team set:', teamsWithRoles[0])
        setNeedsOnboarding(false)
      } else {
        console.log('❌ No teams found after loading - requiring onboarding')
        setNeedsOnboarding(true)
        setCurrentTeam(null)
      }

      console.log('🎉 User data loading completed successfully!')

    } catch (error) {
      console.error('❌ Error loading user data:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      toast({
        title: "Erreur",
        description: `Impossible de charger vos données utilisateur: ${error.message}`,
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

  const handleOnboardingComplete = async () => {
    console.log('🎯 Onboarding completed - reloading user data...')
    setNeedsOnboarding(false)
    setLoading(true)
    
    // Force reload user data
    if (user) {
      try {
        await loadUserData(user)
      } catch (error) {
        console.error('❌ Error reloading user data:', error)
        // If there's an error, reset to onboarding
        setNeedsOnboarding(true)
        setLoading(false)
      }
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