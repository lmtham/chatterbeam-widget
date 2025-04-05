
import React from 'react';
import { Mic, UserCircle, Settings } from 'lucide-react';

interface FeaturesPanelProps {
  webhookUrl: string;
}

const FeaturesPanel: React.FC<FeaturesPanelProps> = ({ webhookUrl }) => {
  return (
    <div className="glass-panel h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold">Features</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic size={16} className="text-primary" />
            </div>
            <h3 className="font-medium">Start a Conversation</h3>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Click the microphone button and speak clearly to interact with the voice assistant.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle size={16} className="text-primary" />
            </div>
            <h3 className="font-medium">
              <a href="/avatar" className="text-primary hover:underline">Interactive Avatar</a>
            </h3>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Try our new interactive avatar assistant with realistic facial expressions and lip-syncing!
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings size={16} className="text-primary" />
            </div>
            <h3 className="font-medium">Configure n8n</h3>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Use your own n8n workflow to customize how the assistant processes your voice commands.
          </p>
        </div>
        
        <div className="p-4 bg-secondary rounded-md mt-8">
          <h3 className="font-medium mb-2">Embeddable Widget</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add this voice assistant to any website by including the following code:
          </p>
          
          <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
            {`<script src="${window.location.origin}/voicewidget.js"></script>
<script>
  new VoiceWidget({
    webhookUrl: "${webhookUrl}",
    position: "bottom-right",
    showAvatar: true
  });
</script>`}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <a 
              href="/embed-demo.html" 
              target="_blank" 
              className="text-sm text-primary hover:underline"
            >
              View embedding demo
            </a>
            <a 
              href="/voicewidget.js" 
              target="_blank" 
              className="text-sm text-primary hover:underline"
            >
              Download widget script
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPanel;
