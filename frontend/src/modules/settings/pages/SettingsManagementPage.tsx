import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/core/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Switch } from '@/core/components/ui/switch';
import { Textarea } from '@/core/components/ui/textarea';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { useTheme } from '@/core/lib/theme';
import settingsService from '../services/settingsService';

interface Setting {
  id: string;
  key: string;
  value: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SettingsManagementPage = () => {
  const { setMode } = useTheme();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalSettings, setTotalSettings] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);

  // Form states
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    isActive: true
  });

  const [editSetting, setEditSetting] = useState({
    key: '',
    value: '',
    isActive: true
  });

  // Validation: Check if key contains only allowed characters (alphanumeric, dots, underscores, hyphens)
  const isValidKey = (key: string): boolean => {
    if (!key.trim()) return false;
    // Allow: alphanumeric, dots, underscores, hyphens
    // Must start with alphanumeric or underscore
    const keyPattern = /^[a-zA-Z0-9_][a-zA-Z0-9._-]*$/;
    return keyPattern.test(key);
  };

  // Validation: Check if value is not empty (allow all characters including special characters)
  const isValidValue = (value: string): boolean => {
    // Allow all characters in value field, just check it's not empty
    return value.trim().length > 0;
  };

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      // Trim search term and only send if not empty
      const trimmedSearch = searchTerm.trim();
      const response = await settingsService.getAllSettings({
        page: currentPage,
        limit: pageSize,
        search: trimmedSearch || undefined,
        // Remove isActive filter to show all settings (active and inactive)
      });

      setSettings(response.data || []);
      setTotalSettings(response.meta?.total || 0);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Create setting
  const handleCreateSetting = async () => {
    // Validate key
    if (!isValidKey(newSetting.key)) {
      toast.error('Invalid key format. Key must start with alphanumeric or underscore and contain only alphanumeric characters, dots, underscores, or hyphens.');
      return;
    }

    // Validate value
    if (!isValidValue(newSetting.value)) {
      toast.error('Value cannot be empty.');
      return;
    }

    try {
      await settingsService.createSetting(newSetting);
      toast.success('Setting created successfully');
      setIsCreateDialogOpen(false);
      setNewSetting({ key: '', value: '', isActive: true });
      // Reset to first page and reload
      setCurrentPage(1);
      await loadSettings();
    } catch (error) {
      console.error('Error creating setting:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create setting';
      toast.error(errorMessage);
    }
  };

  // Update setting
  const handleUpdateSetting = async () => {
    if (!selectedSetting) return;

    // Validate key
    if (!isValidKey(editSetting.key)) {
      toast.error('Invalid key format. Key must start with alphanumeric or underscore and contain only alphanumeric characters, dots, underscores, or hyphens.');
      return;
    }

    // Validate value
    if (!isValidValue(editSetting.value)) {
      toast.error('Value cannot be empty.');
      return;
    }

    try {
      await settingsService.updateSetting(selectedSetting.id, {
        key: editSetting.key,
        value: editSetting.value,
        isActive: editSetting.isActive
      });
      
      // If updating theme.mode, trigger theme change
      if (editSetting.key === 'theme.mode' && (editSetting.value === 'dark' || editSetting.value === 'light')) {
        setMode(editSetting.value as 'dark' | 'light');
      }
      
      toast.success('Setting updated successfully');
      setIsEditDialogOpen(false);
      setSelectedSetting(null);
      await loadSettings();
    } catch (error: unknown) {
      console.error('Error updating setting:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update setting';
      toast.error(errorMessage);
    }
  };

  // Delete setting
  const handleDeleteSetting = async () => {
    if (!settingToDelete) return;

    try {
      await settingsService.deleteSetting(settingToDelete.id);
      toast.success('Setting deleted successfully');
      setDeleteConfirmOpen(false);
      setSettingToDelete(null);
      loadSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Failed to delete setting');
    }
  };

  // Open edit dialog
  const openEditDialog = (setting: Setting) => {
    setSelectedSetting(setting);
    setEditSetting({
      key: setting.key,
      value: setting.value,
      isActive: setting.isActive
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (setting: Setting) => {
    setSettingToDelete(setting);
    setDeleteConfirmOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Settings Management"
        subtitle="Manage application settings and configuration"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Setting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Setting</DialogTitle>
                <DialogDescription>
                  Add a new application setting
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-key">Key</Label>
                  <Input
                    id="new-key"
                    value={newSetting.key}
                    onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                    placeholder="e.g., app.name"
                  />
                </div>
                <div>
                  <Label htmlFor="new-value">Value</Label>
                  <Textarea
                    id="new-value"
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                    placeholder="Setting value"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-active"
                    checked={newSetting.isActive}
                    onCheckedChange={(checked) => setNewSetting({ ...newSetting, isActive: checked })}
                  />
                  <Label htmlFor="new-active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSetting} disabled={!newSetting.key || !newSetting.value}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            View and manage all application settings ({totalSettings} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: 'key',
                header: 'Key',
                cell: (setting: Setting) => (
                  <div className="font-medium">{setting.key}</div>
                ),
                isSortable: true
              },
              {
                id: 'value',
                header: 'Value',
                cell: (setting: Setting) => (
                  <div className="max-w-xs truncate" title={setting.value}>
                    {setting.value}
                  </div>
                ),
                isSortable: false
              },
              {
                id: 'status',
                header: 'Status',
                cell: (setting: Setting) => (
                  <Badge 
                    variant={setting.isActive ? 'default' : 'secondary'}
                    className={setting.isActive ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}
                  >
                    {setting.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                ),
                isSortable: true
              },
              {
                id: 'updatedAt',
                header: 'Updated',
                cell: (setting: Setting) => (
                  <div>{new Date(setting.updatedAt).toLocaleDateString()}</div>
                ),
                isSortable: true
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (setting: Setting) => (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(setting)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(setting)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
                isSortable: false
              }
            ]}
            data={settings}
            isLoading={loading}
            pagination={{
              pageIndex: currentPage - 1, // DataTable uses 0-based index
              limit: pageSize,
              pageCount: Math.ceil(totalSettings / pageSize),
              onPageChange: (page) => setCurrentPage(page + 1), // Convert back to 1-based
              onPageSizeChange: (size) => {
                setPageSize(size);
                setCurrentPage(1); // Reset to first page when page size changes
              },
              total: totalSettings
            }}
            onSearch={(term) => {
              setSearchTerm(term);
              setCurrentPage(1); // Reset to first page when searching
            }}
            activeFilters={{}}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update the setting configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-key">Key</Label>
              <Input
                id="edit-key"
                value={editSetting.key}
                onChange={(e) => setEditSetting({ ...editSetting, key: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-value">Value</Label>
              <Textarea
                id="edit-value"
                value={editSetting.value}
                onChange={(e) => setEditSetting({ ...editSetting, value: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editSetting.isActive}
                onCheckedChange={(checked) => setEditSetting({ ...editSetting, isActive: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSetting}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Setting"
        description={`Are you sure you want to delete the setting "${settingToDelete?.key}"? This action cannot be undone.`}
        onConfirm={handleDeleteSetting}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default SettingsManagementPage;
