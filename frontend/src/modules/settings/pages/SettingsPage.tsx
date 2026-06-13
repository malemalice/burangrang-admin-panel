import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Copy, RefreshCw } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Switch } from '@/core/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import PageHeader from '@/core/components/ui/PageHeader';
import { useTheme, ThemeColor } from '@/core/lib/theme';
import { themeColors } from '@/core/lib/theme/colors';
import { useAppName } from '../hooks/useSettings';
import settingsService from '../services/settingsService';
import api from '@/core/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import ImageUpload from '@/modules/uploads/components/ImageUpload';

interface ZohoHealthData {
  configStatus: {
    webhookEnabled: boolean;
    syncEnabled: boolean;
    authMode: string;
    hasWebhookSecret: boolean;
    hasSdpAuthtoken: boolean;
    hasSdpBaseUrl: boolean;
    hasDefaultDepartmentId: boolean;
    hasIntegrationUserId: boolean;
  };
  connectionTest: {
    ok: boolean;
    statusCode?: number;
    latencyMs: number;
    error?: string;
  };
  recentWebhookLogCount: number;
  pendingJobCount: number;
  deadLetterJobCount: number;
}

const StatusIndicator = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className="flex items-center gap-2 text-sm">
    <Badge className={ok ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
      {ok ? 'OK' : 'Missing'}
    </Badge>
    <span className="text-muted-foreground">{label}</span>
  </div>
);

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
  const loginTaglineKey = 'app.login.tagline';
  const [loginTagline, setLoginTagline] = useState<string>('made by your company');
  const [tempLoginTagline, setTempLoginTagline] = useState<string>('');
  const [isSavingLoginTagline, setIsSavingLoginTagline] = useState<boolean>(false);
  // Email setup states
  const [mailProvider, setMailProvider] = useState<'smtp' | 'gmail' | 'mailgun'>('smtp');
  const [mailHost, setMailHost] = useState<string>('');
  const [mailPort, setMailPort] = useState<string>('');
  const [mailSecure, setMailSecure] = useState<boolean>(false);
  const [mailUser, setMailUser] = useState<string>('');
  const [mailPassword, setMailPassword] = useState<string>('');
  const [mailFrom, setMailFrom] = useState<string>('');
  const [isSavingEmail, setIsSavingEmail] = useState<boolean>(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(false);
  const [testEmail, setTestEmail] = useState<string>('');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState<boolean>(false);
  // Embed tab state
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isGeneratingEmbed, setIsGeneratingEmbed] = useState<boolean>(false);

  // Zoho Integration tab state
  const [zohoHealth, setZohoHealth] = useState<ZohoHealthData | null>(null);
  const [isLoadingZohoHealth, setIsLoadingZohoHealth] = useState(false);
  const [isLoadingZoho, setIsLoadingZoho] = useState(false);
  const [zohoSyncEnabled, setZohoSyncEnabled] = useState(false);
  const [zohoWebhookEnabled, setZohoWebhookEnabled] = useState(false);
  const [webhookAuthMode, setWebhookAuthMode] = useState<'secret' | 'signature' | 'jwt'>('secret');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookJwt, setWebhookJwt] = useState('');
  const [defaultDepartmentId, setDefaultDepartmentId] = useState('');
  const [integrationUserId, setIntegrationUserId] = useState('');
  const [inboundDefaultStatus, setInboundDefaultStatus] = useState('OPEN');
  const [inboundStatusMap, setInboundStatusMap] = useState('');
  const [inboundStatusMapError, setInboundStatusMapError] = useState('');
  const [isSavingInbound, setIsSavingInbound] = useState(false);
  const [sdpBaseUrl, setSdpBaseUrl] = useState('');
  const [sdpAuthtoken, setSdpAuthtoken] = useState('');
  const [sdpApiVersion, setSdpApiVersion] = useState('v3');
  const [sdpAllowSelfSigned, setSdpAllowSelfSigned] = useState(false);
  const [outboundStatusMap, setOutboundStatusMap] = useState('');
  const [outboundStatusMapError, setOutboundStatusMapError] = useState('');
  const [isSavingOutbound, setIsSavingOutbound] = useState(false);
  const [maxRetries, setMaxRetries] = useState('6');
  const [retryBaseMs, setRetryBaseMs] = useState('2000');
  const [retryMaxMs, setRetryMaxMs] = useState('60000');
  const [workerBatchSize, setWorkerBatchSize] = useState('5');
  const [isSavingWorker, setIsSavingWorker] = useState(false);
  const [isTestingInbound, setIsTestingInbound] = useState(false);
  const [isTestingOutbound, setIsTestingOutbound] = useState(false);

  // App branding states (logos)
  const [logoCacheBust, setLogoCacheBust] = useState<number>(() => Date.now());
  const [logoPortraitUrl, setLogoPortraitUrl] = useState<string>('');
  const [logoLandscapeUrl, setLogoLandscapeUrl] = useState<string>('');
  const [isSavingLogos, setIsSavingLogos] = useState<boolean>(false);

  const logoPortraitKey = 'app.logo.portraitUrl';
  const logoLandscapeKey = 'app.logo.landscapeUrl';

  const portraitUrlWithBust = useMemo(() => {
    if (!logoPortraitUrl) return '';
    const hasQuery = logoPortraitUrl.includes('?');
    return `${logoPortraitUrl}${hasQuery ? '&' : '?'}v=${logoCacheBust}`;
  }, [logoPortraitUrl, logoCacheBust]);

  const landscapeUrlWithBust = useMemo(() => {
    if (!logoLandscapeUrl) return '';
    const hasQuery = logoLandscapeUrl.includes('?');
    return `${logoLandscapeUrl}${hasQuery ? '&' : '?'}v=${logoCacheBust}`;
  }, [logoLandscapeUrl, logoCacheBust]);

  // Update temp app name when app name loads
  useEffect(() => {
    setTempAppName(appName);
  }, [appName]);

  // Load login tagline setting (non-blocking)
  useEffect(() => {
    const loadLoginTagline = async () => {
      try {
        const value = await settingsService.getSettingValue(loginTaglineKey);
        const normalized = (value || '').trim() || 'made by your company';
        setLoginTagline(normalized);
        setTempLoginTagline(normalized);
      } catch {
        setLoginTagline('made by your company');
        setTempLoginTagline('made by your company');
      }
    };
    loadLoginTagline();
  }, []);

  // Load existing logo settings (non-blocking)
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const [portrait, landscape] = await Promise.all([
          settingsService.getSettingValue(logoPortraitKey),
          settingsService.getSettingValue(logoLandscapeKey),
        ]);
        setLogoPortraitUrl(portrait || '');
        setLogoLandscapeUrl(landscape || '');
      } catch {
        // ignore
      }
    };
    loadLogos();
  }, []);

  const persistLogoSetting = async (key: string, value: string) => {
    setIsSavingLogos(true);
    try {
      await settingsService.setSettingValue(key, value || '');
      setLogoCacheBust(Date.now());
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save logo');
      throw e;
    } finally {
      setIsSavingLogos(false);
    }
  };

  // Load email settings
  useEffect(() => {
    const loadEmailSettings = async () => {
      try {
        setIsLoadingEmail(true);
        const mail = await settingsService.getMailSettings();
        setMailProvider(mail.provider);
        setMailHost(mail.host);
        setMailPort(mail.port);
        setMailSecure(mail.secure === 'true');
        setMailUser(mail.user);
        setMailPassword(mail.password);
        setMailFrom(mail.from);
      } catch {
        // ignore
      } finally {
        setIsLoadingEmail(false);
      }
    };
    loadEmailSettings();
  }, []);

  // Apply defaults when switching to gmail or mailgun
  useEffect(() => {
    if (mailProvider === 'gmail') {
      setMailHost('smtp.gmail.com');
      setMailPort('465');
      setMailSecure(true);
    } else if (mailProvider === 'mailgun') {
      setMailHost('smtp.mailgun.org');
      setMailPort('587');
      setMailSecure(false);
    }
  }, [mailProvider]);


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

  const handleSaveLoginTagline = async () => {
    const next = (tempLoginTagline || '').trim();
    if (!next) {
      toast.error('Login footer text cannot be empty');
      return;
    }
    setIsSavingLoginTagline(true);
    try {
      await settingsService.setSettingValue(loginTaglineKey, next);
      setLoginTagline(next);
      setTempLoginTagline(next);
      toast.success('Login footer text updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update login footer text');
    } finally {
      setIsSavingLoginTagline(false);
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
  
  const handleSaveEmail = async () => {
    try {
      setIsSavingEmail(true);
      await settingsService.setMailSettings({
        provider: mailProvider,
        host: mailHost,
        port: mailPort,
        secure: mailSecure ? 'true' : 'false',
        user: mailUser,
        password: mailPassword,
        from: mailFrom,
      });
      toast.success('Email settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save email settings');
    } finally {
      setIsSavingEmail(false);
    }
  };
  
  const handleSendTestEmail = async () => {
    try {
      if (!testEmail.trim()) {
        toast.error('Enter a test recipient email');
        return;
      }
      setIsSendingTest(true);
      const response = await api.post('/mail/test', {
        email: testEmail.trim(),
        template: 'verification',
        subject: 'Test Email - Verification',
        context: {
          name: 'Test User',
          verificationLink: 'https://example.com/verify?token=test'
        }
      });
      if (response?.data?.ok) {
        toast.success('Test email sent successfully');
        setIsTestDialogOpen(false);
      } else {
        const errMsg = response?.data?.error || 'Test email failed';
        toast.error(errMsg);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to send test email';
      toast.error(msg);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Zoho Integration handlers
  const fetchZohoHealth = async () => {
    setIsLoadingZohoHealth(true);
    try {
      const res = await api.get('/integrations/zoho/health');
      setZohoHealth(res.data as ZohoHealthData);
    } catch {
      toast.error('Failed to load Zoho integration status');
    } finally {
      setIsLoadingZohoHealth(false);
    }
  };

  const handleTestInbound = async () => {
    setIsTestingInbound(true);
    try {
      const res = await api.get('/integrations/zoho/test-inbound');
      const data = res.data as { ok: boolean; issues: string[] };
      if (data.ok) {
        toast.success('Inbound config looks good — all checks passed');
      } else {
        toast.error(`Inbound config issues: ${data.issues.join(', ')}`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Test failed');
    } finally {
      setIsTestingInbound(false);
    }
  };

  const handleTestOutbound = async () => {
    setIsTestingOutbound(true);
    try {
      const res = await api.get('/integrations/zoho/test-outbound');
      const data = res.data as { ok: boolean; statusCode?: number; latencyMs: number; error?: string };
      if (data.ok) {
        toast.success(`Connected to Zoho SDP — HTTP ${data.statusCode ?? '2xx'} in ${data.latencyMs}ms`);
      } else {
        toast.error(`Zoho SDP unreachable: ${data.error ?? 'Unknown error'} (${data.latencyMs}ms)`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Test failed');
    } finally {
      setIsTestingOutbound(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'zoho') return;
    const load = async () => {
      setIsLoadingZoho(true);
      try {
        const keys = [
          'zoho.sync.enabled',
          'zoho.webhook.enabled',
          'zoho.webhook.auth_mode',
          'zoho.sdp.base_url',
          'zoho.sdp.api_version',
          'zoho.sdp.allow_self_signed',
          'zoho.inbound.default_department_id',
          'zoho.inbound.integration_user_id',
          'zoho.inbound.default_status',
          'zoho.inbound.status_map',
          'zoho.outbound.status_map',
          'zoho.retry.max_retries',
          'zoho.retry.base_ms',
          'zoho.retry.max_ms',
          'zoho.worker.batch_size',
        ];
        const values = await Promise.all(keys.map(k => settingsService.getSettingValue(k)));
        setZohoSyncEnabled(values[0] === 'true');
        setZohoWebhookEnabled(values[1] === 'true');
        setWebhookAuthMode((values[2] as 'secret' | 'signature' | 'jwt') || 'secret');
        // sensitive: secret, jwt, authtoken are never pre-filled
        setWebhookSecret('');
        setWebhookJwt('');
        setSdpBaseUrl(values[3] || '');
        setSdpApiVersion(values[4] || 'v3');
        setSdpAllowSelfSigned(values[5] === 'true');
        setDefaultDepartmentId(values[6] || '');
        setIntegrationUserId(values[7] || '');
        setInboundDefaultStatus(values[8] || 'OPEN');
        setInboundStatusMap(values[9] || '');
        setOutboundStatusMap(values[10] || '');
        setMaxRetries(values[11] || '6');
        setRetryBaseMs(values[12] || '2000');
        setRetryMaxMs(values[13] || '60000');
        setWorkerBatchSize(values[14] || '5');
        setSdpAuthtoken('');
      } catch {
        toast.error('Failed to load Zoho settings');
      } finally {
        setIsLoadingZoho(false);
      }
    };
    load();
    fetchZohoHealth();
  }, [activeTab]);

  const handleToggleSync = async (checked: boolean) => {
    setZohoSyncEnabled(checked);
    try {
      await settingsService.setSettingValue('zoho.sync.enabled', checked ? 'true' : 'false');
      toast.success(`Zoho sync ${checked ? 'enabled' : 'disabled'}`);
    } catch {
      setZohoSyncEnabled(!checked);
      toast.error('Failed to update sync setting');
    }
  };

  const handleToggleWebhook = async (checked: boolean) => {
    setZohoWebhookEnabled(checked);
    try {
      await settingsService.setSettingValue('zoho.webhook.enabled', checked ? 'true' : 'false');
      toast.success(`Webhook ${checked ? 'enabled' : 'disabled'}`);
    } catch {
      setZohoWebhookEnabled(!checked);
      toast.error('Failed to update webhook setting');
    }
  };

  const handleSaveInbound = async () => {
    if (inboundStatusMap.trim()) {
      try {
        JSON.parse(inboundStatusMap);
        setInboundStatusMapError('');
      } catch {
        setInboundStatusMapError('Invalid JSON — please check the format');
        return;
      }
    }
    setIsSavingInbound(true);
    try {
      const saves: Promise<void>[] = [
        settingsService.setSettingValue('zoho.webhook.auth_mode', webhookAuthMode),
        settingsService.setSettingValue('zoho.inbound.default_department_id', defaultDepartmentId),
        settingsService.setSettingValue('zoho.inbound.integration_user_id', integrationUserId),
        settingsService.setSettingValue('zoho.inbound.default_status', inboundDefaultStatus),
        settingsService.setSettingValue('zoho.inbound.status_map', inboundStatusMap),
      ];
      if (webhookSecret.trim()) {
        saves.push(settingsService.setSettingValue('zoho.webhook.secret', webhookSecret));
      }
      if (webhookJwt.trim()) {
        saves.push(settingsService.setSettingValue('zoho.webhook.jwt', webhookJwt));
      }
      await Promise.all(saves);
      toast.success('Inbound settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save inbound settings');
    } finally {
      setIsSavingInbound(false);
    }
  };

  const handleSaveOutbound = async () => {
    if (outboundStatusMap.trim()) {
      try {
        JSON.parse(outboundStatusMap);
        setOutboundStatusMapError('');
      } catch {
        setOutboundStatusMapError('Invalid JSON — please check the format');
        return;
      }
    }
    setIsSavingOutbound(true);
    try {
      const saves: Promise<void>[] = [
        settingsService.setSettingValue('zoho.sdp.base_url', sdpBaseUrl),
        settingsService.setSettingValue('zoho.sdp.api_version', sdpApiVersion),
        settingsService.setSettingValue('zoho.sdp.allow_self_signed', sdpAllowSelfSigned ? 'true' : 'false'),
        settingsService.setSettingValue('zoho.outbound.status_map', outboundStatusMap),
      ];
      if (sdpAuthtoken.trim()) {
        saves.push(settingsService.setSettingValue('zoho.sdp.authtoken', sdpAuthtoken));
      }
      await Promise.all(saves);
      toast.success('Outbound settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save outbound settings');
    } finally {
      setIsSavingOutbound(false);
    }
  };

  const handleSaveWorker = async () => {
    setIsSavingWorker(true);
    try {
      await Promise.all([
        settingsService.setSettingValue('zoho.retry.max_retries', maxRetries),
        settingsService.setSettingValue('zoho.retry.base_ms', retryBaseMs),
        settingsService.setSettingValue('zoho.retry.max_ms', retryMaxMs),
        settingsService.setSettingValue('zoho.worker.batch_size', workerBatchSize),
      ]);
      toast.success('Worker settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save worker settings');
    } finally {
      setIsSavingWorker(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Settings" 
        subtitle="Configure application settings and appearance"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email Setup</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="zoho">Zoho Integration</TabsTrigger>
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
              <CardTitle>Login Footer Text</CardTitle>
              <CardDescription>
                Text shown under the app name/logo on the login page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="login-tagline" className="block text-sm font-medium mb-2">
                    Footer text
                  </Label>
                  <Input
                    id="login-tagline"
                    value={tempLoginTagline}
                    onChange={(e) => setTempLoginTagline(e.target.value)}
                    placeholder="e.g. made by your company"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Current: {loginTagline}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ThemeButton
                    onClick={handleSaveLoginTagline}
                    disabled={isSavingLoginTagline || tempLoginTagline.trim() === (loginTagline || '').trim()}
                    className="w-24"
                  >
                    {isSavingLoginTagline ? 'Saving...' : 'Save'}
                  </ThemeButton>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Logo</CardTitle>
              <CardDescription>
                Upload portrait (icon) and landscape (logo with title) assets. If not uploaded, the app will keep using the app name text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="block text-sm font-medium">Portrait logo (icon)</Label>
                  <ImageUpload
                    id="app-logo-portrait"
                    value={portraitUrlWithBust}
                    onChange={async (value) => {
                      // ImageUpload calls onChange('') on remove
                      setLogoPortraitUrl(value || '');
                      try {
                        await persistLogoSetting(logoPortraitKey, value || '');
                        toast.success(value ? 'Portrait logo updated' : 'Portrait logo removed');
                      } catch {
                        // revert to last known good value by reloading
                        const portrait = await settingsService.getSettingValue(logoPortraitKey);
                        setLogoPortraitUrl(portrait || '');
                      }
                    }}
                    categoryName="system-assets"
                    isPublic
                    allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    placeholder="Upload portrait logo"
                    disabled={isSavingLogos}
                    entityId="app-branding"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in the sidebar as the icon (with app name text when expanded).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="block text-sm font-medium">Landscape logo (logo + title)</Label>
                  <ImageUpload
                    id="app-logo-landscape"
                    value={landscapeUrlWithBust}
                    onChange={async (value) => {
                      setLogoLandscapeUrl(value || '');
                      try {
                        await persistLogoSetting(logoLandscapeKey, value || '');
                        toast.success(value ? 'Landscape logo updated' : 'Landscape logo removed');
                      } catch {
                        const landscape = await settingsService.getSettingValue(logoLandscapeKey);
                        setLogoLandscapeUrl(landscape || '');
                      }
                    }}
                    categoryName="system-assets"
                    isPublic
                    allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    placeholder="Upload landscape logo"
                    disabled={isSavingLogos}
                    entityId="app-branding"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used on the login page and PDF export header.
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

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Setup</CardTitle>
              <CardDescription>
                Configure email provider and SMTP credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="block text-sm font-medium mb-2">Provider</Label>
                <RadioGroup
                  value={mailProvider}
                  onValueChange={(v) => setMailProvider(v as 'smtp' | 'gmail' | 'mailgun')}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {['smtp', 'gmail', 'mailgun'].map((opt) => (
                    <div key={opt} className="space-y-2">
                      <RadioGroupItem value={opt} id={`prov-${opt}`} className="peer sr-only" />
                      <Label
                        htmlFor={`prov-${opt}`}
                        className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 
                          hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer h-12"
                      >
                        {opt.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-xs text-gray-500 mt-2">
                  Selecting Gmail or Mailgun auto-fills host, port, and secure.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mail-host">Host</Label>
                  <Input
                    id="mail-host"
                    value={mailHost}
                    onChange={(e) => setMailHost(e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="mail-port">Port</Label>
                  <Input
                    id="mail-port"
                    type="number"
                    value={mailPort}
                    onChange={(e) => setMailPort(e.target.value)}
                    placeholder="587"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="mail-secure"
                    checked={mailSecure}
                    onCheckedChange={setMailSecure}
                  />
                  <Label htmlFor="mail-secure">Secure (TLS/SSL)</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mail-user">User</Label>
                  <Input
                    id="mail-user"
                    value={mailUser}
                    onChange={(e) => setMailUser(e.target.value)}
                    placeholder="SMTP username or email"
                  />
                </div>
                <div>
                  <Label htmlFor="mail-password">Password</Label>
                  <Input
                    id="mail-password"
                    type="password"
                    value={mailPassword}
                    onChange={(e) => setMailPassword(e.target.value)}
                    placeholder="SMTP password or app password"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mail-from">From</Label>
                <Input
                  id="mail-from"
                  value={mailFrom}
                  onChange={(e) => setMailFrom(e.target.value)}
                  placeholder="Burangrang Admin <no-reply@example.com>"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="bg-white text-gray-900"
                  onClick={() => setIsTestDialogOpen(true)}
                  disabled={isLoadingEmail}
                >
                  Send Test Email
                </Button>
                <ThemeButton onClick={handleSaveEmail} disabled={isSavingEmail || isLoadingEmail}>
                  {isSavingEmail ? 'Saving...' : 'Save Email Settings'}
                </ThemeButton>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
                <DialogDescription>
                  Enter a recipient address to send a test email using the current configuration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-email">Recipient Email</Label>
                  <Input
                    id="test-email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <ThemeButton onClick={handleSendTestEmail} disabled={isSendingTest}>
                    {isSendingTest ? 'Sending...' : 'Send'}
                  </ThemeButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="embed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Embed Dashboard in Google Sites</CardTitle>
              <CardDescription>
                Generate a secure embed URL to display this dashboard in Google Sites. The token never expires.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeButton
                onClick={async () => {
                  try {
                    setIsGeneratingEmbed(true);
                    const url = await settingsService.generateEmbedToken();
                    setEmbedUrl(url);
                    toast.success('Embed URL generated');
                  } catch (e: any) {
                    const msg = e?.response?.data?.message || e?.message || 'Failed to generate embed URL';
                    toast.error(msg);
                  } finally {
                    setIsGeneratingEmbed(false);
                  }
                }}
                disabled={isGeneratingEmbed}
              >
                {isGeneratingEmbed ? 'Generating...' : 'Generate Embed URL'}
              </ThemeButton>

              {embedUrl && (
                <>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={embedUrl} className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(embedUrl);
                          toast.success('URL copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>HTML Snippet</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`<iframe src="${embedUrl}" width="100%" height="900" frameborder="0" allowfullscreen></iframe>`}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `<iframe src="${embedUrl}" width="100%" height="900" frameborder="0" allowfullscreen></iframe>`,
                          );
                          toast.success('HTML copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">How to embed</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Copy the URL or HTML snippet above</li>
                      <li>In Google Sites: Insert → Embed</li>
                      <li>Paste the URL or HTML code</li>
                    </ol>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="zoho" className="space-y-6">

          {/* Card 1 — Integration Health */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Health</CardTitle>
              <CardDescription>
                Live status of the Zoho SDP integration configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    readOnly
                    value={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/integrations/zoho/webhook`}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/integrations/zoho/webhook`);
                      toast.success('Webhook URL copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Configure this URL in Zoho SDP as the webhook target for Ticket_Add and Ticket_Update events.</p>
              </div>

              {isLoadingZohoHealth ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : zohoHealth ? (
                <>
                  <div className={`flex items-center gap-3 rounded-md border p-3 ${zohoHealth.connectionTest.ok ? 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800' : 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800'}`}>
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${zohoHealth.connectionTest.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${zohoHealth.connectionTest.ok ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                        {zohoHealth.connectionTest.ok ? 'Connected to Zoho SDP' : 'Cannot reach Zoho SDP'}
                      </p>
                      {zohoHealth.connectionTest.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 truncate">{zohoHealth.connectionTest.error}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                      {zohoHealth.connectionTest.statusCode && (
                        <span className="block">HTTP {zohoHealth.connectionTest.statusCode}</span>
                      )}
                      <span>{zohoHealth.connectionTest.latencyMs}ms</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatusIndicator label="Webhook Endpoint" ok={zohoHealth.configStatus.webhookEnabled} />
                    <StatusIndicator label="Outbound Sync" ok={zohoHealth.configStatus.syncEnabled} />
                    <StatusIndicator label="Webhook Secret" ok={zohoHealth.configStatus.hasWebhookSecret} />
                    <StatusIndicator label="SDP Auth Token" ok={zohoHealth.configStatus.hasSdpAuthtoken} />
                    <StatusIndicator label="SDP Base URL" ok={zohoHealth.configStatus.hasSdpBaseUrl} />
                    <StatusIndicator label="Default Department" ok={zohoHealth.configStatus.hasDefaultDepartmentId} />
                    <StatusIndicator label="Integration User" ok={zohoHealth.configStatus.hasIntegrationUserId} />
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{zohoHealth.configStatus.authMode}</Badge>
                      <span className="text-muted-foreground">Auth Mode</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="rounded-md border p-3 text-center">
                      <p className="text-2xl font-bold">{zohoHealth.recentWebhookLogCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">Webhooks (24h)</p>
                    </div>
                    <div className="rounded-md border p-3 text-center">
                      <p className="text-2xl font-bold">{zohoHealth.pendingJobCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">Pending Jobs</p>
                    </div>
                    <div className={`rounded-md border p-3 text-center ${zohoHealth.deadLetterJobCount > 0 ? 'border-amber-300 bg-amber-50 dark:bg-amber-950' : ''}`}>
                      <p className={`text-2xl font-bold ${zohoHealth.deadLetterJobCount > 0 ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                        {zohoHealth.deadLetterJobCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Dead-Letter Jobs</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Click Refresh to load status.</p>
              )}

              <Button variant="outline" onClick={fetchZohoHealth} disabled={isLoadingZohoHealth} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isLoadingZohoHealth ? 'animate-spin' : ''}`} />
                {isLoadingZohoHealth ? 'Refreshing...' : 'Refresh Status'}
              </Button>
            </CardContent>
          </Card>

          {/* Card 2 — Master Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Master Toggles</CardTitle>
              <CardDescription>Enable or disable the integration globally</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Outbound Sync</Label>
                  <p className="text-sm text-muted-foreground">Push HSE Risk Assessment status changes to Zoho SDP</p>
                </div>
                <Switch checked={zohoSyncEnabled} onCheckedChange={handleToggleSync} disabled={isLoadingZoho} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Inbound Webhook</Label>
                  <p className="text-sm text-muted-foreground">Accept incoming Zoho SDP webhook events at the webhook URL above</p>
                </div>
                <Switch checked={zohoWebhookEnabled} onCheckedChange={handleToggleWebhook} disabled={isLoadingZoho} />
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — Inbound Webhook */}
          <Card>
            <CardHeader>
              <CardTitle>Inbound Webhook</CardTitle>
              <CardDescription>Authentication and routing settings for incoming Zoho SDP events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="block mb-2">Auth Mode</Label>
                <RadioGroup
                  value={webhookAuthMode}
                  onValueChange={(v) => setWebhookAuthMode(v as 'secret' | 'signature' | 'jwt')}
                  className="grid grid-cols-3 gap-3"
                >
                  {(['secret', 'signature', 'jwt'] as const).map((mode) => (
                    <div key={mode}>
                      <RadioGroupItem value={mode} id={`auth-${mode}`} className="peer sr-only" />
                      <Label
                        htmlFor={`auth-${mode}`}
                        className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                      >
                        {mode}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {(webhookAuthMode === 'secret' || webhookAuthMode === 'signature') && (
                <div>
                  <Label htmlFor="webhook-secret">Webhook Secret</Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Enter new value to replace (leave blank to keep current)"
                    className="mt-1"
                  />
                </div>
              )}

              {webhookAuthMode === 'jwt' && (
                <div>
                  <Label htmlFor="webhook-jwt">Webhook JWT Token</Label>
                  <Input
                    id="webhook-jwt"
                    type="password"
                    value={webhookJwt}
                    onChange={(e) => setWebhookJwt(e.target.value)}
                    placeholder="Enter new value to replace (leave blank to keep current)"
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="default-dept">Default Department ID</Label>
                  <Input
                    id="default-dept"
                    value={defaultDepartmentId}
                    onChange={(e) => setDefaultDepartmentId(e.target.value)}
                    placeholder="Internal department UUID fallback"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="integration-user">Integration User ID</Label>
                  <Input
                    id="integration-user"
                    value={integrationUserId}
                    onChange={(e) => setIntegrationUserId(e.target.value)}
                    placeholder="HSE user UUID for inbound record creator"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="inbound-status">Default Inbound Status</Label>
                <Select value={inboundDefaultStatus} onValueChange={setInboundDefaultStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="WAITING_APPROVAL">WAITING_APPROVAL</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">HSE status assigned to newly created Risk Assessments from Zoho tickets.</p>
              </div>

              <div>
                <Label htmlFor="inbound-map">Inbound Status Map (JSON)</Label>
                <Textarea
                  id="inbound-map"
                  value={inboundStatusMap}
                  onChange={(e) => { setInboundStatusMap(e.target.value); setInboundStatusMapError(''); }}
                  className="font-mono min-h-[120px] mt-1"
                  placeholder='{"Open":"OPEN","Resolved":"DONE","Closed":"CLOSE","Cancelled":"REJECTED"}'
                />
                {inboundStatusMapError && (
                  <p className="text-sm text-destructive mt-1">{inboundStatusMapError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Maps Zoho ticket status strings to HSE GeneralStatusEnum values.</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleTestInbound} disabled={isTestingInbound || isLoadingZoho}>
                  {isTestingInbound ? 'Testing...' : 'Test Inbound'}
                </Button>
                <ThemeButton onClick={handleSaveInbound} disabled={isSavingInbound || isLoadingZoho}>
                  {isSavingInbound ? 'Saving...' : 'Save Inbound Settings'}
                </ThemeButton>
              </div>
            </CardContent>
          </Card>

          {/* Card 4 — Outbound (Zoho SDP API) */}
          <Card>
            <CardHeader>
              <CardTitle>Outbound — Zoho SDP API</CardTitle>
              <CardDescription>Connection settings for pushing status updates to Zoho ServiceDesk Plus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="sdp-url">SDP Base URL</Label>
                  <Input
                    id="sdp-url"
                    value={sdpBaseUrl}
                    onChange={(e) => setSdpBaseUrl(e.target.value)}
                    placeholder="https://servicedesk.example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sdp-version">API Version</Label>
                  <Input
                    id="sdp-version"
                    value={sdpApiVersion}
                    onChange={(e) => setSdpApiVersion(e.target.value)}
                    placeholder="v3"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sdp-token">Auth Token</Label>
                <Input
                  id="sdp-token"
                  type="password"
                  value={sdpAuthtoken}
                  onChange={(e) => setSdpAuthtoken(e.target.value)}
                  placeholder="Enter new value to replace (leave blank to keep current)"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">API auth token issued by Zoho SDP. Required for outbound status updates.</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="sdp-self-signed" checked={sdpAllowSelfSigned} onCheckedChange={setSdpAllowSelfSigned} />
                <Label htmlFor="sdp-self-signed">Allow Self-Signed SSL Certificates</Label>
              </div>

              <div>
                <Label htmlFor="outbound-map">Outbound Status Map (JSON)</Label>
                <Textarea
                  id="outbound-map"
                  value={outboundStatusMap}
                  onChange={(e) => { setOutboundStatusMap(e.target.value); setOutboundStatusMapError(''); }}
                  className="font-mono min-h-[120px] mt-1"
                  placeholder='{"OPEN":"On Hold","DONE":"Closed","CLOSE":"Closed","REJECTED":"Open"}'
                />
                {outboundStatusMapError && (
                  <p className="text-sm text-destructive mt-1">{outboundStatusMapError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Maps HSE GeneralStatusEnum values to Zoho SDP status strings.</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleTestOutbound} disabled={isTestingOutbound || isLoadingZoho}>
                  {isTestingOutbound ? 'Testing...' : 'Test Outbound'}
                </Button>
                <ThemeButton onClick={handleSaveOutbound} disabled={isSavingOutbound || isLoadingZoho}>
                  {isSavingOutbound ? 'Saving...' : 'Save Outbound Settings'}
                </ThemeButton>
              </div>
            </CardContent>
          </Card>

          {/* Card 5 — Worker & Retry */}
          <Card>
            <CardHeader>
              <CardTitle>Worker & Retry</CardTitle>
              <CardDescription>Controls for the outbound job queue processing and retry behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="max-retries">Max Retries</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min="0"
                    max="20"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="retry-base">Base Delay (ms)</Label>
                  <Input
                    id="retry-base"
                    type="number"
                    min="100"
                    value={retryBaseMs}
                    onChange={(e) => setRetryBaseMs(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="retry-max">Max Delay (ms)</Label>
                  <Input
                    id="retry-max"
                    type="number"
                    min="1000"
                    value={retryMaxMs}
                    onChange={(e) => setRetryMaxMs(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="1"
                    max="50"
                    value={workerBatchSize}
                    onChange={(e) => setWorkerBatchSize(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Batch size controls how many outbound jobs are processed per 10-second cron tick. Retry uses exponential backoff with 25% jitter.</p>
              <div className="flex justify-end">
                <ThemeButton onClick={handleSaveWorker} disabled={isSavingWorker || isLoadingZoho}>
                  {isSavingWorker ? 'Saving...' : 'Save Worker Settings'}
                </ThemeButton>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

      </Tabs>
    </div>
  );
};

export default SettingsPage; 