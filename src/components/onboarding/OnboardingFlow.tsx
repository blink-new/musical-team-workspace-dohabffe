import React, { useState } from 'react';
import { User, CreateTeamForm, JoinTeamForm } from '../../types';
import { blink, generateId, generateInvitationCode } from '../../blink/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Music, Users, Plus, UserPlus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
}

type OnboardingStep = 'choice' | 'create-team' | 'join-team';

export function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('choice');
  const [isLoading, setIsLoading] = useState(false);
  const [createTeamForm, setCreateTeamForm] = useState<CreateTeamForm>({
    name: '',
    description: '',
  });
  const [joinTeamForm, setJoinTeamForm] = useState<JoinTeamForm>({
    invitationCode: '',
  });
  const { toast } = useToast();

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTeamForm.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'équipe est requis",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const organizationId = generateId('org');
      const teamId = generateId('team');
      const invitationCode = generateInvitationCode();

      // First, create the organization
      await blink.db.organizations.create({
        id: organizationId,
        name: `Organisation de ${user.displayName}`,
        created_by: user.id,
      });

      // Then create the team
      await blink.db.teams.create({
        id: teamId,
        name: createTeamForm.name.trim(),
        description: createTeamForm.description?.trim() || null,
        organization_id: organizationId,
        invitation_code: invitationCode,
        created_by: user.id,
      });

      // Add user as team admin
      await blink.db.team_members.create({
        id: generateId('member'),
        team_id: teamId,
        user_id: user.id,
        role: 'team_admin',
      });

      toast({
        title: "Équipe créée !",
        description: `L'équipe "${createTeamForm.name}" a été créée avec succès.`,
      });

      onComplete();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'équipe. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTeamForm.invitationCode.trim()) {
      toast({
        title: "Erreur",
        description: "Le code d'invitation est requis",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find team by invitation code
      const teams = await blink.db.teams.list({
        where: { invitation_code: joinTeamForm.invitationCode.trim().toUpperCase() },
        limit: 1,
      });

      if (teams.length === 0) {
        toast({
          title: "Code invalide",
          description: "Le code d'invitation n'existe pas ou a expiré.",
          variant: "destructive",
        });
        return;
      }

      const team = teams[0];

      // Check if user is already a member
      const existingMembership = await blink.db.team_members.list({
        where: { 
          team_id: team.id,
          user_id: user.id 
        },
        limit: 1,
      });

      if (existingMembership.length > 0) {
        toast({
          title: "Déjà membre",
          description: "Vous êtes déjà membre de cette équipe.",
          variant: "destructive",
        });
        return;
      }

      // Add user as team member
      await blink.db.team_members.create({
        id: generateId('member'),
        team_id: team.id,
        user_id: user.id,
        role: 'member',
      });

      toast({
        title: "Équipe rejointe !",
        description: `Vous avez rejoint l'équipe "${team.name}" avec succès.`,
      });

      onComplete();
    } catch (error) {
      console.error('Error joining team:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejoindre l'équipe. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderChoiceStep = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Music className="h-12 w-12 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue dans Musical Team Workspace
        </h1>
        <p className="text-lg text-gray-600">
          Bonjour {user.displayName} ! Pour commencer, choisissez une option :
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-200">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <Plus className="h-10 w-10 text-indigo-600" />
            </div>
            <CardTitle className="text-xl">Créer une équipe</CardTitle>
            <CardDescription>
              Créez votre propre équipe musicale et invitez des membres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentStep('create-team')}
              className="w-full"
              size="lg"
            >
              Créer une équipe
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-200">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <UserPlus className="h-10 w-10 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Rejoindre une équipe</CardTitle>
            <CardDescription>
              Utilisez un code d'invitation pour rejoindre une équipe existante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentStep('join-team')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Rejoindre une équipe
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCreateTeamStep = () => (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <Users className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer votre équipe</h2>
        <p className="text-gray-600">Donnez un nom à votre équipe musicale</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <Label htmlFor="team-name">Nom de l'équipe *</Label>
              <Input
                id="team-name"
                type="text"
                placeholder="Ex: Chorale Saint-Martin"
                value={createTeamForm.name}
                onChange={(e) => setCreateTeamForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="team-description">Description (optionnel)</Label>
              <Textarea
                id="team-description"
                placeholder="Décrivez votre équipe musicale..."
                value={createTeamForm.description}
                onChange={(e) => setCreateTeamForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('choice')}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Création...' : 'Créer l\'équipe'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderJoinTeamStep = () => (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <UserPlus className="h-10 w-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rejoindre une équipe</h2>
        <p className="text-gray-600">Entrez le code d'invitation fourni par un administrateur</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <Label htmlFor="invitation-code">Code d'invitation *</Label>
              <Input
                id="invitation-code"
                type="text"
                placeholder="Ex: ABC12345"
                value={joinTeamForm.invitationCode}
                onChange={(e) => setJoinTeamForm(prev => ({ 
                  ...prev, 
                  invitationCode: e.target.value.toUpperCase() 
                }))}
                className="font-mono text-center text-lg tracking-wider"
                maxLength={8}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Le code fait 8 caractères (lettres et chiffres)
              </p>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('choice')}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Vérification...' : 'Rejoindre'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center">
      {currentStep === 'choice' && renderChoiceStep()}
      {currentStep === 'create-team' && renderCreateTeamStep()}
      {currentStep === 'join-team' && renderJoinTeamStep()}
    </div>
  );
}