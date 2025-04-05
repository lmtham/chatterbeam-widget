
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import avatarService, { AvatarConfig } from '@/services/AvatarService';

interface AvatarConfigPanelProps {
  onConfigSaved: () => void;
}

const AvatarConfigPanel: React.FC<AvatarConfigPanelProps> = ({ onConfigSaved }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'did' | 'heygen'>('did');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  const handleSave = () => {
    if (!apiKey && !avatarUrl) {
      toast.warning('Please provide either an API key or avatar URL');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const config: AvatarConfig = {
        provider,
        apiKey,
        avatarUrl: avatarUrl || undefined
      };
      
      avatarService.initialize(config);
      
      // Save to localStorage for persistence
      localStorage.setItem('avatarConfig', JSON.stringify({
        provider,
        apiKey,
        avatarUrl: avatarUrl || undefined
      }));
      
      setIsConfigured(true);
      toast.success('Avatar configuration saved');
      
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error) {
      console.error('Error saving avatar config:', error);
      toast.error('Failed to save avatar configuration');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Try to load saved config on mount
  React.useEffect(() => {
    const savedConfig = localStorage.getItem('avatarConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setProvider(config.provider || 'did');
        setApiKey(config.apiKey || '');
        setAvatarUrl(config.avatarUrl || '');
        
        // Initialize service with saved config
        avatarService.initialize({
          provider: config.provider || 'did',
          apiKey: config.apiKey || '',
          avatarUrl: config.avatarUrl
        });
        
        setIsConfigured(true);
      } catch (error) {
        console.error('Error loading saved avatar config:', error);
      }
    }
  }, []);

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-medium">Avatar Configuration</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Provider</label>
        <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="did">D-ID</SelectItem>
            <SelectItem value="heygen">HeyGen</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {provider === 'did' ? 
            'D-ID provides realistic digital avatar APIs for video creation.' : 
            'HeyGen offers AI-powered video generation with digital humans.'}
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">API Key {apiKey ? <CheckCircle className="inline w-4 h-4 text-green-500" /> : <XCircle className="inline w-4 h-4 text-red-500" />}</label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Enter your ${provider} API key`}
        />
        <p className="text-xs text-muted-foreground">
          {provider === 'did' ? 
            'Get your D-ID API key from https://studio.d-id.com/' : 
            'Get your HeyGen API key from https://app.heygen.com/settings'}
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Avatar URL (optional)</label>
        <Input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="text-xs text-muted-foreground">
          URL to an image of the avatar you want to use (optional)
        </p>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        {isConfigured && (
          <p className="text-xs flex items-center text-green-500 mr-auto">
            <CheckCircle className="w-4 h-4 mr-1" /> Avatar service configured
          </p>
        )}
        
        <Button
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default AvatarConfigPanel;
