import React from 'react';

export type MidiConnectionStatus = 'connected' | 'disconnected' | 'denied' | 'reconnect';

export interface MidiStatusIndicatorProps {
  status: MidiConnectionStatus;
  deviceName?: string;
  className?: string;
}

const statusMessages: Record<MidiConnectionStatus, string> = {
  connected: 'MIDI drum kit connected',
  disconnected: 'No MIDI drum kit detected. Connect a drum kit to enable real-time validation.',
  denied: 'MIDI access denied. Enable permissions in your browser settings.',
  reconnect: 'MIDI drum kit disconnected. Please reconnect to continue.',
};

export const MidiStatusIndicator: React.FC<MidiStatusIndicatorProps> = ({
  status,
  deviceName,
  className = '',
}) => {
  const message =
    status === 'connected' && deviceName
      ? `MIDI drum kit connected: ${deviceName}`
      : statusMessages[status];

  return (
    <div
      aria-live="polite"
      className={[
        'flex items-center gap-2 text-sm',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'inline-block w-2.5 h-2.5 rounded-full shrink-0',
          status === 'connected' ? 'bg-green-500' : 'bg-gray-400',
        ].join(' ')}
        aria-hidden="true"
      />
      <span className="text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  );
};
