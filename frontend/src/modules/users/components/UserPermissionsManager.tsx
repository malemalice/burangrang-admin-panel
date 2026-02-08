import { useState, useMemo } from 'react';
import { Check, Search, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { usePermissions } from '@/core/hooks/usePermissions'; // To get all available permissions list if needed, or assume fixed list

// Permission definition interface
interface PermissionDef {
  name: string;
  description: string;
}

// Grouped permissions interface
interface GroupedPermissions {
  [key: string]: PermissionDef[];
}

interface UserPermissionsManagerProps {
  userId: string;
  userName: string;
}

// TODO: In a real app, fetch available permissions from an API endpoint
// For now, we'll use a subset of permissions related to the request + common ones
const AVAILABLE_PERMISSIONS: PermissionDef[] = [
  // Quiz
  { name: 'quiz:create', description: 'Create new quizzes' },
  { name: 'quiz:read', description: 'View quiz details' },
  { name: 'quiz:update', description: 'Edit quizzes' },
  { name: 'quiz:delete', description: 'Delete quizzes' },
  { name: 'quiz:publish', description: 'Publish/unpublish quizzes' },
  { name: 'quiz:assign', description: 'Assign quizzes to users' },
  { name: 'quiz:attempt', description: 'Take quizzes' },
  
  // User
  { name: 'user:create', description: 'Create users' },
  { name: 'user:read', description: 'View user details' },
  { name: 'user:update', description: 'Edit users' },
  { name: 'user:delete', description: 'Delete users' },
  
  // Role
  { name: 'role:create', description: 'Create roles' },
  { name: 'role:read', description: 'View role details' },
  { name: 'role:update', description: 'Edit roles' },
  { name: 'role:delete', description: 'Delete roles' },
];

export const UserPermissionsManager = ({ userId, userName }: UserPermissionsManagerProps) => {
  const { permissions: userPermissions, isLoading, assignPermissions, removePermission, isUpdating } = useUserPermissions(userId);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  // Group permissions by prefix (e.g., 'quiz', 'user')
  const groupedPermissions = useMemo(() => {
    const filtered = AVAILABLE_PERMISSIONS.filter(
      p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce<GroupedPermissions>((acc, curr) => {
      const prefix = curr.name.split(':')[0];
      if (!acc[prefix]) {
        acc[prefix] = [];
      }
      acc[prefix].push(curr);
      return acc;
    }, {});
  }, [searchTerm]);

  const userPermissionNames = useMemo(() => {
    return new Set(userPermissions.map((p: any) => p.name));
  }, [userPermissions]);

  const handleToggle = (permissionName: string, checked: boolean) => {
    setPendingChanges(prev => {
      const currentStatus = userPermissionNames.has(permissionName);
      // If returning to original state, remove from pending
      if (currentStatus === checked) {
        const newState = { ...prev };
        delete newState[permissionName];
        return newState;
      }
      return { ...prev, [permissionName]: checked };
    });
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const handleSave = async () => {
    const toAdd: string[] = [];
    const toRemove: string[] = [];

    Object.entries(pendingChanges).forEach(([name, checked]) => {
      if (checked) toAdd.push(name);
      else toRemove.push(name);
    });

    try {
      if (toAdd.length > 0) {
        await assignPermissions(toAdd);
      }
      
      // Remove one by one as API currently supports single removal
      // In a real optimized scenario, we'd have a bulk remove endpoint
      if (toRemove.length > 0) {
        await Promise.all(toRemove.map(name => removePermission(name)));
      }
      
      setPendingChanges({});
    } catch (error) {
      console.error('Failed to save permissions', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Permissions</CardTitle>
        <CardDescription>
          Manage specific permissions for {userName}. These apply in addition to role-based permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search permissions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex-1" />
          {hasPendingChanges && (
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isUpdating && <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          )}
        </div>

        <div className="h-[500px] pr-4 overflow-y-auto">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([group, perms]) => (
              <div key={group} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                  {group} 
                  <Badge variant="outline" className="ml-2 text-xs">{perms.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map((permission) => {
                    const isOriginallyHas = userPermissionNames.has(permission.name);
                    const isPending = pendingChanges[permission.name] !== undefined;
                    const isChecked = isPending ? pendingChanges[permission.name] : isOriginallyHas;

                    return (
                      <div 
                        key={permission.name} 
                        className={`flex items-start space-x-3 p-3 rounded-md border transition-colors ${
                          isChecked ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox 
                          id={permission.name} 
                          checked={isChecked}
                          onCheckedChange={(checked) => handleToggle(permission.name, checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={permission.name}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {permission.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                          {isOriginallyHas && !isPending && (
                            <div className="flex items-center text-[10px] text-green-600 font-medium mt-1">
                              <Check className="h-3 w-3 mr-1" /> Assigned
                            </div>
                          )}
                          {isPending && (
                            <div className="text-[10px] text-orange-600 font-medium mt-1">
                              {isChecked ? 'Pending Addition' : 'Pending Removal'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedPermissions).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No permissions found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
