
import React from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetToggleButtonProps {
  handleToggleWidget: () => void;
  isOpen: boolean;
  buttonLabel: string;
}

const WidgetToggleButton: React.FC<WidgetToggleButtonProps> = ({
  handleToggleWidget,
  isOpen,
  buttonLabel
}) => {
  return (
    <button
      onClick={handleToggleWidget}
      className={cn(
        "widget-button animate-breathe",
        isOpen && "scale-90 opacity-0 pointer-events-none",
        !isOpen && "scale-100 opacity-100"
      )}
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      <Mic size={24} />
    </button>
  );
};

export default WidgetToggleButton;
