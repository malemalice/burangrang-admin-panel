import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PageHeader from '@/components/ui/PageHeader';

const colorThemes = [
  { id: 'blue', label: 'Blue', color: '#1a56db', textColor: 'white' },
  { id: 'green', label: 'Green', color: '#0e9f6e', textColor: 'white' },
  { id: 'purple', label: 'Purple', color: '#7e3af2', textColor: 'white' },
  { id: 'red', label: 'Red', color: '#e02424', textColor: 'white' },
  { id: 'orange', label: 'Orange', color: '#ff5a1f', textColor: 'white' },
  { id: 'indigo', label: 'Indigo', color: '#5850ec', textColor: 'white' },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [darkMode, setDarkMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveAppearance = () => {
    // In a real app, this would save to backend or localStorage
    toast.success('Appearance settings saved successfully');
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
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Upload your organization's logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 border rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm text-center p-2">
                      No logo uploaded
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 flex-1">
                  <Label htmlFor="logo-upload" className="block">Upload new logo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full max-w-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={!logoFile}
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Recommended: SVG, PNG or JPG (max. 1MB)
                  </p>
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
                value={selectedTheme} 
                onValueChange={setSelectedTheme}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
              >
                {colorThemes.map((theme) => (
                  <div key={theme.id} className="space-y-2">
                    <RadioGroupItem 
                      value={theme.id} 
                      id={`theme-${theme.id}`} 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor={`theme-${theme.id}`}
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 
                        hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary 
                        [&:has([data-state=checked])]:border-primary cursor-pointer h-24"
                    >
                      <div 
                        className="h-12 w-12 rounded-full mb-2"
                        style={{ backgroundColor: theme.color }}
                      >
                        {selectedTheme === theme.id && (
                          <div className="h-full w-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" style={{ color: theme.textColor }} />
                          </div>
                        )}
                      </div>
                      <span>{theme.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="flex items-center space-x-2 mt-6 pt-4 border-t">
                <Switch 
                  id="dark-mode" 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
                <Label htmlFor="dark-mode">Enable Dark Mode</Label>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveAppearance}>
              Save Changes
            </Button>
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