import { useState } from 'react'
import { blink } from '@/blink/client'
import { TeamWithRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bell, ChevronDown, LogOut, Settings, Users } from 'lucide-react'

interface HeaderProps {
  currentTeam: TeamWithRole | null
  teams: TeamWithRole[]
  onTeamChange: (teamId: string) => void
  user: any
}

export function Header({ currentTeam, teams, onTeamChange, user }: HeaderProps) {
  const [notificationCount] = useState(3) // TODO: Get from API

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'team_admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'team_admin':
        return 'Admin'
      case 'member':
        return 'Membre'
      default:
        return role
    }
  }

  return (
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Team Selector */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="musical-gradient w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🎵</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Musical Workspace</h1>
              {currentTeam && (
                <p className="text-sm text-muted-foreground">
                  {currentTeam.name}
                </p>
              )}
            </div>
          </div>

          {/* Team Selector */}
          {teams.length > 0 && (
            <div className="flex items-center space-x-3">
              <Select
                value={currentTeam?.id || ''}
                onValueChange={onTeamChange}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{team.name}</span>
                        <Badge
                          variant="outline"
                          className={`ml-2 ${getRoleBadgeColor(team.userRole)}`}
                        >
                          {getRoleLabel(team.userRole)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentTeam && (
                <Badge
                  variant="outline"
                  className={getRoleBadgeColor(currentTeam.userRole)}
                >
                  {getRoleLabel(currentTeam.userRole)}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user?.email}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => blink.auth.logout()}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}