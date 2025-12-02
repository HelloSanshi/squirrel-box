import React, { useState, useEffect, useRef } from 'react';
import { SquirrelLook } from './SquirrelLook';

interface PetProps {
  initialPosition?: { x: number; y: number };
  onCollect?: (target?: Element) => void;
}

type PetState = 'IDLE' | 'WALK' | 'SLEEP' | 'DRAGGING' | 'EATING' | 'HAPPY';

export const Pet: React.FC<PetProps> = ({ initialPosition, onCollect }) => {
  const [state, setState] = useState<PetState>('IDLE');
  // 初始位置：右下角
  const [position, setPosition] = useState(initialPosition || { x: window.innerWidth - 80, y: window.innerHeight - 100 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const petRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 自动发呆/睡觉逻辑
  useEffect(() => {
    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (state !== 'SLEEP' && state !== 'EATING') {
            idleTimerRef.current = setTimeout(() => {
                setState('SLEEP');
            }, 30000); // 30秒无操作进入睡眠
        }
    };

    resetIdleTimer();
    window.addEventListener('pointermove', resetIdleTimer);
    return () => {
        window.removeEventListener('pointermove', resetIdleTimer);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [state]);

  // 拖拽逻辑
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    setState('DRAGGING');
    // 防止选中文字
    e.preventDefault();
    e.stopPropagation();
  };

  // 处理点击（区分拖拽和点击）
  const handleClick = () => {
    // 如果只是简单的点击（没有发生明显的位移），则触发交互
    if (state !== 'DRAGGING') {
        if (state === 'IDLE' || state === 'SLEEP') {
            setState('HAPPY');
            setTimeout(() => setState('IDLE'), 2000);
            if (onCollect) onCollect();
        }
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      
      // 如果是从睡眠中拖动，醒来
      setState('IDLE');

      // 检测释放位置
      // 1. 暂时隐藏 Shadow Host 以便检测底下的元素
      const host = document.getElementById('squirrel-pet-container');
      if (host) host.style.display = 'none';
      
      // 2. 获取释放点坐标下的元素
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      
      // 3. 恢复显示
      if (host) host.style.display = 'block';

      if (elementBelow) {
        // 查找最近的推文元素
        const tweetElement = elementBelow.closest('article[data-testid="tweet"]');
        if (tweetElement) {
          // 触发进食动画
          setState('EATING');
          setTimeout(() => setState('IDLE'), 3000); // 吃3秒
          
          // 触发收藏
          if (onCollect) onCollect(tweetElement);
        }
      }
      
      // 自动吸附边缘逻辑
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const currentX = e.clientX - dragOffset.current.x;
      const currentY = e.clientY - dragOffset.current.y;
      
      // 简单的边界检查，防止飞出屏幕
      let finalX = currentX;
      let finalY = currentY;
      
      if (finalX < 0) finalX = 10;
      if (finalX > windowWidth - 60) finalX = windowWidth - 60;
      if (finalY < 0) finalY = 10;
      if (finalY > windowHeight - 60) finalY = windowHeight - 60;
      
      setPosition({ x: finalX, y: finalY });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onCollect]);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: '60px',
    height: '60px',
    cursor: state === 'DRAGGING' ? 'grabbing' : 'grab',
    zIndex: 2147483647, // Max Z-Index
    userSelect: 'none',
    touchAction: 'none',
    // 使用 transition 实现平滑移动（拖拽时除外）
    transition: state === 'DRAGGING' ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out, transform 0.2s',
    transform: state === 'DRAGGING' ? 'scale(1.1)' : 'scale(1)',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
  };

  return (
    <div
      ref={petRef}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      style={containerStyle}
    >
      <SquirrelLook state={state} />
    </div>
  );
};
