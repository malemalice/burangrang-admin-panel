import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/core/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Switch } from '@/core/components/ui/switch';
import { Textarea } from '@/core/components/ui/textarea';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
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
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAllSettings({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        isActive: true
      });

      setSettings(response.data || []);
      setTotalSettings(response.meta?.total || 0);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [currentPage, searchTerm]);

  // Create setting
  const handleCreateSetting = async () => {
    try {
      await settingsService.createSetting(newSetting);
      toast.success('Setting created successfully');
      setIsCreateDialogOpen(false);
      setNewSetting({ key: '', value: '', isActive: true });
      loadSettings();
    } catch (error) {
      console.error('Error creating setting:', error);
      toast.error('Failed to create setting');
    }
  };

  // Update setting
  const handleUpdateSetting = async () => {
    if (!selectedSetting) return;

    try {
      await settingsService.updateSetting(selectedSetting.id, {
        key: editSetting.key,
        value: editSetting.value,
        isActive: editSetting.isActive
      });
      toast.success('Setting updated successfully');
      setIsEditDialogOpen(false);
      setSelectedSetting(null);
      loadSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
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
      />

      {/* Search and Create */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
      </div>

      {/* Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            View and manage all application settings ({totalSettings} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading settings...</div>
          ) : settings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No settings found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.key}</TableCell>
                    <TableCell className="max-w-xs truncate" title={setting.value}>
                      {setting.value}
                    </TableCell>
                    <TableCell>
                      <Badge variant={setting.isActive ? 'default' : 'secondary'}>
                        {setting.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(setting.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
