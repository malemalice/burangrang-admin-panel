import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Lock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import roleService from '@/services/roleService';
import { Role, Permission } from '@/lib/types';

const RoleDetailPage = () => {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchRoleData = async () => {
      setIsLoading(true);
      try {
        if (!roleId) {
          throw new Error('Role ID is required');
        }
        
        const roleData = await roleService.getRoleById(roleId);
        setRole(roleData);
      } catch (error) {
        console.error('Failed to fetch role:', error);
        toast.error('Failed to load role data');
      } finally {
        setIsLoading(false);
      }
    };

    if (roleId) {
      fetchRoleData();
    }
  }, [roleId]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleId) return;
    
    setIsDeleting(true);
    try {
      await roleService.deleteRole(roleId);
      toast.success('Role deleted successfully');
      navigate('/roles');
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error('Failed to delete role');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-8">
        <h2 className="text-lg font-medium">Role not found</h2>
        <p className="text-gray-500 mt-2">The role you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/roles')} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roles
        </Button>
      </div>
    );
  }

  // Group permissions by alphabetical order
  const sortedPermissions = [...role.permissions].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />

      <PageHeader
        title={role.name}
        subtitle={role.description || 'No description available'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/roles')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roles
            </Button>
            <Button variant="outline" onClick={() => navigate(`/roles/${roleId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Role
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick} disabled={isDeleting}>
              {isDeleting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role Name</h3>
              <p className="mt-1">{role.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{role.description || 'No description available'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="mt-1">
                <Badge variant={role.isActive ? 'default' : 'destructive'} className="capitalize">
                  {role.isActive ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <X className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1">{new Date(role.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="mt-1">{new Date(role.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permissions ({role.permissions.length})</CardTitle>
            <CardDescription>List of permissions assigned to this role</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedPermissions.length === 0 ? (
              <p className="text-center py-6 text-gray-500">No permissions assigned to this role.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedPermissions.map(permission => (
                    <div key={permission.id} className="p-3 border rounded-md">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                          <Lock className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{permission.name}</h4>
                          {permission.description && (
                            <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RoleDetailPage; 