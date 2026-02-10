import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BulletItem } from './BulletItem';
import type { Bullet } from '../types';
import { motion } from 'framer-motion';

interface SortableBulletItemProps {
    bullet: Bullet;
}

export function SortableBulletItem({ bullet }: SortableBulletItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: bullet.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 2 : 1,
        width: '100%',
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2 }}
        >
            <BulletItem bullet={bullet} />
        </motion.div>
    );
}
