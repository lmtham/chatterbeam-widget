
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FeaturesPanel from '@/components/FeaturesPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <main className="container py-12 px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Voice & Avatar Assistant</h1>
          <p className="text-muted-foreground text-lg">
            Interact with your AI assistant through voice and watch them respond with a lifelike avatar.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Avatar Assistant</h2>
              <p className="text-muted-foreground mb-4">
                Chat with our AI assistant and watch the avatar respond in real-time.
              </p>
              <Link to="/avatar-assistant">
                <Button>Open Avatar Assistant</Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Interactive Avatar</h2>
              <p className="text-muted-foreground mb-4">
                Experience our cutting-edge HeyGen avatars in real-time with voice interaction.
              </p>
              <Link to="/interactive-avatar">
                <Button variant="secondary">Try Interactive Avatar</Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">TTS Test</h2>
              <p className="text-muted-foreground mb-4">
                Test our text-to-speech capabilities with different voices and settings.
              </p>
              <Link to="/tts-test">
                <Button variant="outline">Open TTS Test</Button>
              </Link>
            </div>
          </div>
        </div>
        
        <FeaturesPanel />
      </main>
    </div>
  );
};

export default Index;
