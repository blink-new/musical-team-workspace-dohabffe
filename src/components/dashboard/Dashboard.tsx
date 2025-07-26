import { useState, useEffect, useCallback } from 'react'
import { blink } from '@/blink/client'
import { TeamWithRole, Assignment, Presence } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Calendar, 
  Users, 
  Music, 
  Clock, 
  MapPin, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DashboardProps {
  currentTeam: TeamWithRole
  user: any
}

export function Dashboard({ currentTeam, user }: DashboardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [presences, setPresences] = useState<Presence[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // Load upcoming assignments for the current team
      const teamAssignments = await blink.db.assignments.list({
        where: { team_id: currentTeam.id },
        orderBy: { assignment_date: 'asc' },
        limit: 10
      })

      // Filter to show only future assignments
      const now = new Date()
      const upcomingAssignments = teamAssignments.filter(assignment => {
        const assignmentDateTime = new Date(`${assignment.assignment_date}T${assignment.start_time}`)
        return assignmentDateTime >= now
      })

      setAssignments(upcomingAssignments)

      // Load user's presences for these assignments
      if (upcomingAssignments.length > 0) {
        const assignmentIds = upcomingAssignments.map(a => a.id)
        const userPresences = await blink.db.presences.list({
          where: {
            AND: [
              { user_id: user.id },
              { assignment_id: { in: assignmentIds } }
            ]
          }
        })
        setPresences(userPresences)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [currentTeam, user.id, toast])

  useEffect(() => {
    if (currentTeam) {
      loadDashboardData()
    }
  }, [currentTeam, loadDashboardData])

  const updatePresence = async (assignmentId: string, status: 'present' | 'absent' | 'late', justification?: string) => {
    try {
      // Check if presence already exists
      const existingPresence = presences.find(p => p.assignment_id === assignmentId)
      
      if (existingPresence) {
        // Update existing presence
        await blink.db.presences.update(existingPresence.id, {
          status,
          justification: justification || null,
          declared_by: user.id,
          declared_at: new Date().toISOString()
        })
      } else {
        // Create new presence
        await blink.db.presences.create({
          id: `presence_${Date.now()}`,
          assignment_id: assignmentId,
          user_id: user.id,
          status,
          justification: justification || null,
          declared_by: user.id,
          declared_at: new Date().toISOString(),
          admin_override: false
        })
      }

      // Reload presences
      const assignmentIds = assignments.map(a => a.id)
      const userPresences = await blink.db.presences.list({
        where: {
          AND: [
            { user_id: user.id },
            { assignment_id: { in: assignmentIds } }
          ]
        }
      })
      setPresences(userPresences)

      toast({
        title: "Présence mise à jour",
        description: "Votre statut de présence a été enregistré",
      })
    } catch (error) {
      console.error('Error updating presence:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre présence",
        variant: "destructive"
      })
    }
  }

  const getPresenceStatus = (assignmentId: string) => {
    return presences.find(p => p.assignment_id === assignmentId)
  }

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Aujourd\'hui'
    if (isTomorrow(date)) return 'Demain'
    return format(date, 'EEEE d MMMM', { locale: fr })
  }

  const getPresenceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const canManageTeam = currentTeam.userRole === 'super_admin' || currentTeam.userRole === 'team_admin'

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Bonjour ! 👋
          </h1>
          <p className="text-muted-foreground">
            Voici un aperçu de vos prochaines activités avec {currentTeam.name}
          </p>
        </div>
        {canManageTeam && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle assignation
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochaines assignations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              dans les 30 prochains jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres de l'équipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTeam.memberCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              membres actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répertoire</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              chants disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votre rôle</CardTitle>
            <Badge variant="outline" className="text-xs">
              {currentTeam.userRole === 'super_admin' ? 'Super Admin' :
               currentTeam.userRole === 'team_admin' ? 'Admin' : 'Membre'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {currentTeam.userRole === 'super_admin' ? 'Accès complet à toutes les équipes' :
               currentTeam.userRole === 'team_admin' ? 'Gestion complète de cette équipe' :
               'Consultation et déclaration de présence'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assignments">Mes assignations</TabsTrigger>
          {canManageTeam && <TabsTrigger value="management">Gestion</TabsTrigger>}
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prochaines assignations</CardTitle>
              <CardDescription>
                Vos assignations à venir et statuts de présence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune assignation</h3>
                  <p className="text-muted-foreground">
                    Vous n'avez pas d'assignations prévues pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const presence = getPresenceStatus(assignment.id)
                    return (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{assignment.title}</h3>
                              <Badge variant="outline">
                                {getDateLabel(assignment.assignment_date)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{assignment.start_time} - {assignment.end_time}</span>
                              </div>
                              {assignment.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{assignment.location}</span>
                                </div>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {presence && (
                              <div className="flex items-center space-x-1">
                                {getPresenceIcon(presence.status)}
                                <span className="text-sm capitalize">
                                  {presence.status === 'present' ? 'Présent' :
                                   presence.status === 'absent' ? 'Absent' : 'En retard'}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant={presence?.status === 'present' ? 'default' : 'outline'}
                                onClick={() => updatePresence(assignment.id, 'present')}
                              >
                                Présent
                              </Button>
                              <Button
                                size="sm"
                                variant={presence?.status === 'late' ? 'default' : 'outline'}
                                onClick={() => updatePresence(assignment.id, 'late')}
                              >
                                En retard
                              </Button>
                              <Button
                                size="sm"
                                variant={presence?.status === 'absent' ? 'default' : 'outline'}
                                onClick={() => updatePresence(assignment.id, 'absent')}
                              >
                                Absent
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canManageTeam && (
          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des membres</CardTitle>
                  <CardDescription>
                    Inviter et gérer les membres de votre équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Gérer les membres
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Créer une assignation</CardTitle>
                  <CardDescription>
                    Planifier une nouvelle session musicale
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle assignation
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répertoire musical</CardTitle>
                  <CardDescription>
                    Gérer les chants et partitions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    <Music className="mr-2 h-4 w-4" />
                    Gérer le répertoire
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Code d'invitation</CardTitle>
                  <CardDescription>
                    Partagez ce code pour inviter de nouveaux membres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="bg-muted p-3 rounded-lg font-mono text-lg font-bold mb-2">
                      {currentTeam.invitation_code}
                    </div>
                    <Button variant="outline" size="sm">
                      Copier le code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}