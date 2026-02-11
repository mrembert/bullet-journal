import { Circle, X, Minus, ChevronRight } from 'lucide-react';
import type { BulletType, BulletState } from '../types';

interface BulletIconProps {
    type: BulletType;
    state: BulletState;
}

export const BulletIcon = ({ type, state }: BulletIconProps) => {
    switch (type) {
        case 'task':
            if (state === 'completed') return <X size={18} />;
            if (state === 'migrated') return <ChevronRight size={18} />;
            return <span style={{ fontSize: '24px', lineHeight: '18px' }}>•</span>;
        case 'event':
            return <Circle size={16} fill={state === 'completed' ? 'currentColor' : 'none'} />;
        case 'note':
            return <Minus size={18} />;
        default:
            return <span style={{ fontSize: '24px', lineHeight: '18px' }}>•</span>;
    }
};
