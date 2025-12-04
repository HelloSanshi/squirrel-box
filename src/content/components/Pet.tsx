import React, { useState, useEffect, useRef } from 'react';

interface PetProps {
  initialPosition?: { x: number; y: number };
  onCollect?: (target?: Element) => Promise<void>;
}

// 唯一的松鼠图片
const SQUIRREL_IMAGE = 'gif/squirrel_eating_consistent_frame_01.png';

// 松鼠尺寸
const PET_SIZE = 60;

export const Pet: React.FC<PetProps> = ({ initialPosition, onCollect }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  // 初始位置：右下角
  const [position, setPosition] = useState(initialPosition || { 
    x: window.innerWidth - PET_SIZE - 20, 
    y: window.innerHeight - PET_SIZE - 20 
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const petRef = useRef<HTMLDivElement>(null);
  const clickStartTime = useRef(0);

  // 窗口大小变化时，保持松鼠在可视区域内
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let newX = prev.x;
        let newY = prev.y;
        
        // 如果超出右边界，调整到右边界
        if (newX > windowWidth - PET_SIZE - 10) {
          newX = windowWidth - PET_SIZE - 10;
        }
        // 如果超出下边界，调整到下边界
        if (newY > windowHeight - PET_SIZE - 10) {
          newY = windowHeight - PET_SIZE - 10;
        }
        
        return { x: newX, y: newY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 拖拽逻辑
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    clickStartTime.current = Date.now();
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    
    // 防止选中文字
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = async (e: PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      
      const clickDuration = Date.now() - clickStartTime.current;
      const wasClick = clickDuration < 200;
      
      // 如果是短促的点击（不是拖拽），直接收集当前悬停的推文
      if (wasClick && onCollect) {
        setIsCollecting(true);
        try {
          await onCollect();
        } finally {
          setIsCollecting(false);
        }
        return;
      }
      
      // 自动吸附边缘逻辑
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const currentX = e.clientX - dragOffset.current.x;
      const currentY = e.clientY - dragOffset.current.y;
      
      let finalX = currentX;
      let finalY = currentY;
      
      if (finalX < 0) finalX = 10;
      if (finalX > windowWidth - PET_SIZE) finalX = windowWidth - PET_SIZE - 10;
      if (finalY < 0) finalY = 10;
      if (finalY > windowHeight - PET_SIZE) finalY = windowHeight - PET_SIZE - 10;
      
      setPosition({ x: finalX, y: finalY });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onCollect]);

  // 获取图片 URL
  const getImageUrl = () => {
    try {
      return chrome.runtime.getURL(SQUIRREL_IMAGE);
    } catch {
      return SQUIRREL_IMAGE;
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: `${PET_SIZE}px`, 
    height: `${PET_SIZE}px`,
    cursor: 'pointer',
    zIndex: 2147483647,
    userSelect: 'none',
    touchAction: 'none',
    transition: 'left 0.3s ease-out, top 0.3s ease-out, transform 0.2s',
    transform: isCollecting ? 'scale(1.1)' : 'scale(1)',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  };

  return (
    <div
      ref={petRef}
      onPointerDown={handlePointerDown}
      style={containerStyle}
    >
      <img 
        src={getImageUrl()} 
        alt="松鼠"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          pointerEvents: 'none',
          opacity: isCollecting ? 0.8 : 1,
          transition: 'opacity 0.2s',
        }}
      />
    </div>
  );
};
