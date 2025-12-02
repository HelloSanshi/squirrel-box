import React, { useEffect, useState } from 'react';

// 颜色定义
const COLORS = {
  primary: '#FF9F43', // 橙色身体
  secondary: '#FFCC80', // 浅色肚皮/脸
  dark: '#E67E22', // 深色阴影/轮廓
  eye: '#4E342E', // 眼睛颜色
  nose: '#3E2723', // 鼻子
  cheek: '#FFAB91', // 腮红
};

export const SquirrelLook: React.FC<{ state: string }> = ({ state }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // 自动眨眼逻辑
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 4000 + Math.random() * 2000); // 随机眨眼间隔

    return () => clearInterval(blinkInterval);
  }, []);

  // 尾巴摇摆动画样式
  const tailStyle: React.CSSProperties = {
    animation: state === 'IDLE' ? 'tailWag 3s ease-in-out infinite' : 'none',
    transformOrigin: 'bottom left',
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      // 调试背景，之后移除
      // border: '1px solid red' 
    }}>
      <style>{`
        @keyframes tailWag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>

      {/* 身体容器：支持浮动动画 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        animation: state === 'IDLE' ? 'float 2s ease-in-out infinite' : 'none',
      }}>
        
        {/* 尾巴 (在大尾巴松鼠中，尾巴通常在身体后面) */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '0px',
          width: '40px',
          height: '50px',
          backgroundColor: COLORS.primary,
          borderRadius: '0 100% 100% 0 / 0 50% 50% 0', // 不规则形状
          transform: 'rotate(-10deg)',
          zIndex: 0,
          ...tailStyle
        }}>
          {/* 尾巴内圈 */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '5px',
            width: '25px',
            height: '30px',
            backgroundColor: COLORS.secondary,
            borderRadius: '50%',
            opacity: 0.6,
          }} />
        </div>

        {/* 身体 */}
        <div style={{
          position: 'absolute',
          bottom: '5px',
          left: '15px',
          width: '35px',
          height: '40px',
          backgroundColor: COLORS.primary,
          borderRadius: '40% 40% 45% 45%',
          zIndex: 1,
          boxShadow: 'inset -2px -2px 0px rgba(0,0,0,0.1)'
        }}>
          {/* 肚皮 */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '20%',
            width: '60%',
            height: '70%',
            backgroundColor: COLORS.secondary,
            borderRadius: '50% 50% 40% 40%',
          }} />
        </div>

        {/* 头 */}
        <div style={{
          position: 'absolute',
          top: '5px',
          left: '12px',
          width: '40px',
          height: '36px',
          backgroundColor: COLORS.primary,
          borderRadius: '45% 45% 40% 40%',
          zIndex: 2,
        }}>
          {/* 耳朵 左 */}
          <div style={{
            position: 'absolute',
            top: '-5px',
            left: '2px',
            width: '12px',
            height: '15px',
            backgroundColor: COLORS.primary,
            borderRadius: '50% 50% 0 0',
            transform: 'rotate(-15deg)',
            zIndex: -1,
          }} />
          {/* 耳朵 右 */}
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '2px',
            width: '12px',
            height: '15px',
            backgroundColor: COLORS.primary,
            borderRadius: '50% 50% 0 0',
            transform: 'rotate(15deg)',
            zIndex: -1,
          }} />

          {/* 脸部 (浅色区域) */}
          <div style={{
            position: 'absolute',
            bottom: '2px',
            left: '5px',
            width: '30px',
            height: '20px',
            backgroundColor: COLORS.secondary,
            borderRadius: '40% 40% 50% 50%',
          }} />

          {/* 眼睛 */}
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '10px',
            width: '4px',
            height: isBlinking || state === 'SLEEP' ? '1px' : '4px', // 眨眼/睡觉效果
            backgroundColor: COLORS.eye,
            borderRadius: '50%',
            transition: 'height 0.1s',
          }} />
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '10px',
            width: '4px',
            height: isBlinking || state === 'SLEEP' ? '1px' : '4px',
            backgroundColor: COLORS.eye,
            borderRadius: '50%',
            transition: 'height 0.1s',
          }} />

          {/* 鼻子 */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '4px',
            height: '3px',
            backgroundColor: COLORS.nose,
            borderRadius: '50%',
          }} />

          {/* 腮红 */}
          {(state === 'HAPPY' || state === 'EATING') && (
            <>
              <div style={{
                position: 'absolute',
                top: '22px',
                left: '6px',
                width: '6px',
                height: '4px',
                backgroundColor: COLORS.cheek,
                borderRadius: '50%',
                opacity: 0.6,
              }} />
              <div style={{
                position: 'absolute',
                top: '22px',
                right: '6px',
                width: '6px',
                height: '4px',
                backgroundColor: COLORS.cheek,
                borderRadius: '50%',
                opacity: 0.6,
              }} />
            </>
          )}
        </div>

        {/* 爪子 (抱着东西或者垂着) */}
        <div style={{
          position: 'absolute',
          bottom: '18px',
          left: '22px',
          width: '8px',
          height: '8px',
          backgroundColor: COLORS.primary,
          borderRadius: '50%',
          zIndex: 3,
          transform: state === 'EATING' ? 'translateY(-5px)' : 'none', // 进食时举起手
          transition: 'transform 0.2s'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '18px',
          right: '22px',
          width: '8px',
          height: '8px',
          backgroundColor: COLORS.primary,
          borderRadius: '50%',
          zIndex: 3,
          transform: state === 'EATING' ? 'translateY(-5px)' : 'none',
          transition: 'transform 0.2s'
        }} />

        {/* 坚果 (进食状态显示) */}
        {state === 'EATING' && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '10px',
            height: '12px',
            backgroundColor: '#8D6E63',
            borderRadius: '50% 50% 20% 20%',
            zIndex: 2,
          }} />
        )}

      </div>
    </div>
  );
};

