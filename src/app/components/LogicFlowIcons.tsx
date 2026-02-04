import React from 'react';

interface LogicFlowIconProps {
  className?: string;
}

export function DataFlowIcon({ className = '' }: LogicFlowIconProps) {
  return (
    <svg viewBox="0 0 200 100" className={className} fill="none" stroke="currentColor">
      <circle cx="30" cy="50" r="15" strokeWidth="2" />
      <circle cx="100" cy="50" r="15" strokeWidth="2" />
      <circle cx="170" cy="50" r="15" strokeWidth="2" />
      <path d="M 45 50 L 85 50" strokeWidth="2" markerEnd="url(#arrowhead)" />
      <path d="M 115 50 L 155 50" strokeWidth="2" markerEnd="url(#arrowhead)" />
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

export function BranchFlowIcon({ className = '' }: LogicFlowIconProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} fill="none" stroke="currentColor">
      <circle cx="30" cy="60" r="15" strokeWidth="2" />
      <circle cx="100" cy="30" r="15" strokeWidth="2" />
      <circle cx="100" cy="90" r="15" strokeWidth="2" />
      <circle cx="170" cy="60" r="15" strokeWidth="2" />
      <path
        d="M 45 60 L 65 60 Q 70 60 75 55 L 85 40"
        strokeWidth="2"
        markerEnd="url(#arrowhead2)"
      />
      <path
        d="M 45 60 L 65 60 Q 70 60 75 65 L 85 80"
        strokeWidth="2"
        markerEnd="url(#arrowhead2)"
      />
      <path
        d="M 115 30 L 135 30 Q 140 30 145 40 L 155 55"
        strokeWidth="2"
        markerEnd="url(#arrowhead2)"
      />
      <path
        d="M 115 90 L 135 90 Q 140 90 145 80 L 155 65"
        strokeWidth="2"
        markerEnd="url(#arrowhead2)"
      />
      <defs>
        <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

export function LoopFlowIcon({ className = '' }: LogicFlowIconProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} fill="none" stroke="currentColor">
      <circle cx="100" cy="40" r="15" strokeWidth="2" />
      <circle cx="100" cy="90" r="15" strokeWidth="2" />
      <path d="M 100 55 L 100 75" strokeWidth="2" markerEnd="url(#arrowhead3)" />
      <path
        d="M 115 90 Q 140 90 140 65 Q 140 40 115 40"
        strokeWidth="2"
        markerEnd="url(#arrowhead3)"
      />
      <defs>
        <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

export function ApiFlowIcon({ className = '' }: LogicFlowIconProps) {
  return (
    <svg viewBox="0 0 200 100" className={className} fill="none" stroke="currentColor">
      <rect x="15" y="35" width="30" height="30" rx="4" strokeWidth="2" />
      <rect x="85" y="35" width="30" height="30" rx="4" strokeWidth="2" />
      <rect x="155" y="35" width="30" height="30" rx="4" strokeWidth="2" />
      <path d="M 45 50 L 85 50" strokeWidth="2" markerEnd="url(#arrowhead4)" />
      <path d="M 115 50 L 155 50" strokeWidth="2" markerEnd="url(#arrowhead4)" />
      <path d="M 100 35 L 100 20" strokeWidth="2" />
      <path d="M 100 65 L 100 80" strokeWidth="2" />
      <defs>
        <marker id="arrowhead4" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}
