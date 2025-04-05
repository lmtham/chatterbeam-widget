
import React from 'react';
import { X, MinusCircle, UserCircle } from 'lucide-react';

interface WidgetHeaderProps {
  handleToggleWidget: () => void;
  handleMinimize: () => void;
  handleToggleAvatar: () => void;
  showingAvatar: boolean;
}

const WidgetHeader: React.FC<WidgetHeaderProps> = ({
  handleToggleWidget,
  handleMinimize,
  handleToggleAvatar,
  showingAvatar
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h3 className="font-medium">Voice Assistant</h3>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleToggleAvatar}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showingAvatar ? "Hide Avatar" : "Show Avatar"}
          title={showingAvatar ? "Hide Avatar" : "Show Avatar"}
        >
          <UserCircle size={18} />
        </button>
        <button 
          onClick={handleMinimize}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Minimize"
        >
          <MinusCircle size={18} />
        </button>
        <button 
          onClick={handleToggleWidget}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default WidgetHeader;
