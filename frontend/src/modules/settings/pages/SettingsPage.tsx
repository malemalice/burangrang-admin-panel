import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Switch } from '@/core/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import PageHeader from '@/core/components/ui/PageHeader';
import { useTheme, ThemeColor } from '@/core/lib/theme';
import { themeColors } from '@/core/lib/theme/colors';
import { useAppName } from '../hooks/useSettings';

// Define theme options
const themeOptions = Object.entries(themeColors).map(([id, colors]) => ({
  id: id as ThemeColor,
  label: id.charAt(0).toUpperCase() + id.slice(1),
  color: colors.primary,
  textColor: 'white',
}));

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const { theme, setTheme, mode, toggleMode } = useTheme();
  const { appName, updateAppName, isUpdating: isUpdatingAppName } = useAppName();
  const [tempAppName, setTempAppName] = useState<string>('');
  
  // Update temp app name when app name loads
  useEffect(() => {
    setTempAppName(appName);
  }, [appName]);


  const handleSaveAppName = async () => {
    if (!tempAppName.trim()) {
      toast.error('App name cannot be empty');
      return;
    }

    try {
      const success = await updateAppName(tempAppName.trim());
      if (success) {
        toast.success('App name updated successfully');
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };
  
  const handleSaveAppearance = async () => {
    try {
      // Dynamically import settings service to avoid circular dependencies
      const { default: settingsService } = await import('../services/settingsService');

      // Save theme settings to backend
      await settingsService.setThemeSettings(theme, mode);

      toast.success('Appearance settings saved successfully');
    } catch (error: any) {
      console.error('Error saving appearance settings:', error);

      // Handle specific error cases
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        toast.error('You do not have permission to save settings');
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error('Please log in again to save settings');
      } else {
        toast.error('Failed to save appearance settings');
      }
    }
  };
  
  return (
    <div>
      <PageHeader 
        title="Settings" 
        subtitle="Configure application settings and appearance"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Name</CardTitle>
              <CardDescription>
                Set the application name that appears throughout the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="app-name" className="block text-sm font-medium mb-2">
                    Application Name
                  </Label>
                  <Input
                    id="app-name"
                    value={tempAppName}
                    onChange={(e) => setTempAppName(e.target.value)}
                    placeholder="Enter application name"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This name will be displayed in the sidebar, login page, and page title
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ThemeButton
                    onClick={handleSaveAppName}
                    disabled={isUpdatingAppName || tempAppName === appName}
                    className="w-24"
                  >
                    {isUpdatingAppName ? 'Saving...' : 'Save'}
                  </ThemeButton>
                </div>
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Theme Color</CardTitle>
              <CardDescription>
                Set your preferred theme color for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={theme} 
                onValueChange={value => setTheme(value as ThemeColor)}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
              >
                {themeOptions.map((themeOption) => (
                  <div key={themeOption.id} className="space-y-2">
                    <RadioGroupItem 
                      value={themeOption.id} 
                      id={`theme-${themeOption.id}`} 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor={`theme-${themeOption.id}`}
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 
                        hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary 
                        [&:has([data-state=checked])]:border-primary cursor-pointer h-24"
                    >
                      <div 
                        className="h-12 w-12 rounded-full mb-2"
                        style={{ backgroundColor: themeOption.color }}
                      >
                        {theme === themeOption.id && (
                          <div className="h-full w-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" style={{ color: themeOption.textColor }} />
                          </div>
                        )}
                      </div>
                      <span>{themeOption.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="flex items-center space-x-2 mt-6 pt-4 border-t">
                <Switch 
                  id="dark-mode" 
                  checked={mode === 'dark'} 
                  onCheckedChange={toggleMode} 
                />
                <Label htmlFor="dark-mode">Enable Dark Mode</Label>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <ThemeButton onClick={handleSaveAppearance}>
              Save Changes
            </ThemeButton>
          </div>
        </TabsContent>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage general application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                General settings will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Notification settings will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 