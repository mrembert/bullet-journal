import { useEffect, useRef, type KeyboardEvent } from 'react';

interface UsePopupNavigationProps {
    /**
     * Selector for the focusable elements within the container.
     * Defaults to 'button'.
     */
    selector?: string;
    /**
     * Callback when the Escape key is pressed.
     */
    onClose?: () => void;
    /**
     * Whether to auto-focus the first enabled element on mount.
     * Defaults to true.
     */
    autoFocus?: boolean;
}

export function usePopupNavigation({
    selector = 'button',
    onClose,
    autoFocus = true
}: UsePopupNavigationProps = {}) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-focus management
    useEffect(() => {
        if (!autoFocus) return;

        // Use timeout to ensure it runs after render/mounting is fully complete
        // especially important when rendering into Portals
        const timer = setTimeout(() => {
            if (containerRef.current) {
                // Find all matching elements
                const elements = Array.from(containerRef.current.querySelectorAll(selector));
                // Find the first one that is NOT disabled
                const firstEnabled = elements.find(el => !(el as HTMLElement).hasAttribute('disabled')) as HTMLElement;

                if (firstEnabled) {
                    firstEnabled.focus();
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [autoFocus, selector]);

    // Keyboard navigation handler
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent background interaction for navigation keys
        const checkKeys = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'];
        if (checkKeys.includes(e.key)) {
            e.stopPropagation();
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            onClose?.();
            return;
        }

        // Get all focusable enabled elements
        const elements = Array.from(containerRef.current?.querySelectorAll(`${selector}:not([disabled])`) || []) as HTMLElement[];
        if (elements.length === 0) return;

        const index = elements.findIndex(el => el === document.activeElement);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = index + 1 < elements.length ? index + 1 : 0;
            elements[nextIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = index - 1 >= 0 ? index - 1 : elements.length - 1;
            elements[prevIndex]?.focus();
        }
        // Enter is handled natively by the button click usually, 
        // effectively triggering the onClick. We just stopPropagation above.
    };

    return {
        containerRef,
        handleKeyDown
    };
}
