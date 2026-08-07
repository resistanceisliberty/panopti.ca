import { ReactNode, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { useT } from '../../i18n';

export type SnapPoint = 'minimized' | 'peek' | 'full';

interface BottomSheetProps {
  children: ReactNode;
  snapPoint?: SnapPoint;
  onSnapPointChange?: (snapPoint: SnapPoint) => void;
  /** Content to show in the drag header area (visible in minimized/peek states) */
  headerContent?: ReactNode;
  /** When true, tapping the header does NOT toggle the sheet (drag still works) */
  disableHeaderTap?: boolean;
  minimizedHeight?: number;
  peekHeight?: number;
  fullHeight?: number;
}

// Default heights
const DEFAULT_MINIMIZED_HEIGHT = 72; // px - just the header
const DEFAULT_PEEK_HEIGHT = 220; // px - shows route summary
const DEFAULT_FULL_HEIGHT = 85; // vh percentage

export function BottomSheet({
  children,
  snapPoint = 'minimized',
  onSnapPointChange,
  headerContent,
  disableHeaderTap = false,
  minimizedHeight = DEFAULT_MINIMIZED_HEIGHT,
  peekHeight = DEFAULT_PEEK_HEIGHT,
  fullHeight = DEFAULT_FULL_HEIGHT,
}: BottomSheetProps) {
  const t = useT();

  // Calculate actual pixel heights
  const getSnapPointHeight = useCallback((point: SnapPoint): number => {
    const vh = window.innerHeight;
    switch (point) {
      case 'minimized':
        return minimizedHeight;
      case 'peek':
        return peekHeight;
      case 'full':
        return (fullHeight / 100) * vh;
    }
  }, [minimizedHeight, peekHeight, fullHeight]);

  // Motion value for sheet height
  const height = useMotionValue(getSnapPointHeight(snapPoint));

  // Opacity for backdrop based on height (only show when approaching full)
  const backdropOpacity = useTransform(
    height,
    [getSnapPointHeight('minimized'), getSnapPointHeight('peek'), getSnapPointHeight('full')],
    [0, 0, 0.5]
  );

  // Animate to snap point when it changes externally
  useEffect(() => {
    const targetHeight = getSnapPointHeight(snapPoint);
    animate(height, targetHeight, {
      type: 'tween',
      duration: 0.3,
      ease: [0.25, 1, 0.5, 1],
    });
  }, [snapPoint, getSnapPointHeight, height]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const targetHeight = getSnapPointHeight(snapPoint);
      height.set(targetHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [snapPoint, getSnapPointHeight, height]);

  // Active snap points — skip peek when it equals minimized
  const activeSnapPoints = useCallback((): SnapPoint[] => {
    if (getSnapPointHeight('peek') === getSnapPointHeight('minimized')) {
      return ['minimized', 'full'];
    }
    return ['minimized', 'peek', 'full'];
  }, [getSnapPointHeight]);

  // Find closest snap point for a given height
  const getClosestSnapPoint = useCallback((currentHeight: number): SnapPoint => {
    const points = activeSnapPoints();
    const distances = points.map(point => ({
      point,
      distance: Math.abs(currentHeight - getSnapPointHeight(point)),
    }));
    return distances.sort((a, b) => a.distance - b.distance)[0].point;
  }, [getSnapPointHeight, activeSnapPoints]);

  // Get next snap point in a direction
  const getNextSnapPoint = useCallback((current: SnapPoint, direction: 'up' | 'down'): SnapPoint => {
    const order = activeSnapPoints();
    const idx = order.indexOf(current);
    if (idx === -1) return order[0]; // fallback
    if (direction === 'up') {
      return order[Math.min(idx + 1, order.length - 1)];
    } else {
      return order[Math.max(idx - 1, 0)];
    }
  }, [activeSnapPoints]);

  // Tween config for smooth ease-out-quart animation
  const tweenConfig = {
    type: 'tween' as const,
    duration: 0.3,
    ease: [0.25, 1, 0.5, 1] as const,
  };

  // Track drag start height to calculate total drag distance
  const dragStartHeight = useMotionValue(0);

  // Track whether we're actively dragging (for interrupted-drag recovery)
  const isDragging = useRef(false);

  // Handle drag start - record starting height
  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    dragStartHeight.set(height.get());
  }, [height, dragStartHeight]);

  // Handle drag end - snap based on velocity OR drag distance
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = false;
    const currentHeight = height.get();
    const startHeight = dragStartHeight.get();
    const velocity = info.velocity.y;
    const dragDistance = currentHeight - startHeight; // positive = expanded, negative = collapsed

    // Determine direction from either velocity or drag distance
    const hasSignificantVelocity = Math.abs(velocity) > 200;
    const hasSignificantDrag = Math.abs(dragDistance) > 40; // 40px threshold

    let newPoint: SnapPoint;

    if (hasSignificantVelocity || hasSignificantDrag) {
      // Determine direction: prefer velocity, fall back to drag distance
      const direction = hasSignificantVelocity
        ? (velocity < 0 ? 'up' : 'down')
        : (dragDistance > 0 ? 'up' : 'down');

      // Get the snap point we were closest to at drag start
      const startPoint = getClosestSnapPoint(startHeight);
      newPoint = getNextSnapPoint(startPoint, direction);
    } else {
      // Very small movement - snap to closest
      newPoint = getClosestSnapPoint(currentHeight);
    }

    const targetHeight = getSnapPointHeight(newPoint);
    animate(height, targetHeight, tweenConfig);
    onSnapPointChange?.(newPoint);
  }, [height, dragStartHeight, getClosestSnapPoint, getNextSnapPoint, getSnapPointHeight, onSnapPointChange]);

  // Handle drag - update height
  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newHeight = height.get() - info.delta.y;
    const minH = getSnapPointHeight('minimized');
    const maxH = getSnapPointHeight('full');

    // Clamp strictly: never go below minimized height (no rubber-band downward)
    // Allow slight overshoot above full for elastic feel
    const clampedHeight = Math.max(minH, Math.min(maxH * 1.05, newHeight));
    height.set(clampedHeight);
  }, [height, getSnapPointHeight]);

  // Recovery: if a drag is interrupted (system gesture, touch cancel) without
  // onDragEnd firing, the height can get stuck at an intermediate value.
  // Listen for pointer-up/cancel at the document level as a safety net.
  useEffect(() => {
    const recover = () => {
      if (isDragging.current) {
        isDragging.current = false;
        const targetHeight = getSnapPointHeight(snapPoint);
        animate(height, targetHeight, {
          type: 'tween',
          duration: 0.25,
          ease: [0.25, 1, 0.5, 1],
        });
      }
    };

    document.addEventListener('pointerup', recover);
    document.addEventListener('pointercancel', recover);
    return () => {
      document.removeEventListener('pointerup', recover);
      document.removeEventListener('pointercancel', recover);
    };
  }, [snapPoint, getSnapPointHeight, height]);

  // Handle tap on header to toggle between collapsed and full
  const handleHeaderTap = useCallback(() => {
    if (snapPoint === 'full') {
      onSnapPointChange?.('minimized');
    } else {
      onSnapPointChange?.('full');
    }
  }, [snapPoint, onSnapPointChange]);

  return (
    <>
      {/* Backdrop - tap to collapse */}
      <motion.div
        className="fixed inset-0 bg-black z-[55] lg:hidden"
        style={{ opacity: backdropOpacity, pointerEvents: snapPoint === 'full' ? 'auto' : 'none' }}
        onClick={() => onSnapPointChange?.('minimized')}
      />

      {/* Bottom Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-dark-900 rounded-t-xl flex flex-col"
        role="dialog"
        aria-label={t('x_bottomsheet_aria')}
        style={{
          height,
          maxHeight: '95vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxSizing: 'content-box',
        }}
      >
        {/* Drag Header - entire area is draggable, min 48px for touch target */}
        <motion.div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onTap={disableHeaderTap ? undefined : handleHeaderTap}
        >
          {/* Visual drag indicator */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-[3px] rounded-full bg-dark-500" />
          </div>

          {/* Header content area - shows preview when collapsed */}
          {headerContent && (
            <div className="px-4 pb-3">
              {headerContent}
            </div>
          )}

          {/* Minimum touch area if no header content */}
          {!headerContent && <div className="h-6" />}
        </motion.div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 touch-pan-y">
          {children}
          {/* Safe area spacer inside scroll area so content clears home indicator */}
          <div className="flex-shrink-0 h-safe-bottom" />
        </div>
      </motion.div>
    </>
  );
}

// Hook for controlling bottom sheet from child components
export function useBottomSheet() {
  // This can be extended to use context for more complex scenarios
  return {
    expand: () => {},
    collapse: () => {},
    setSnapPoint: (_point: SnapPoint) => {},
  };
}

