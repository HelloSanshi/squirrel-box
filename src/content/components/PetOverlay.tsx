import React from 'react';
import { createRoot } from 'react-dom/client';
import { Pet } from './Pet';

export const mountPetOverlay = (onCollect: (target?: Element) => void) => {
  // 创建容器
  const containerId = 'squirrel-pet-container';
  let container = document.getElementById(containerId);
  
  if (container) {
    // 如果已存在，先移除（避免热更新重复）
    container.remove();
  }

  container = document.createElement('div');
  container.id = containerId;
  document.body.appendChild(container);

  // 创建 Shadow DOM
  const shadow = container.attachShadow({ mode: 'open' });
  
  // 创建挂载点
  const rootElement = document.createElement('div');
  shadow.appendChild(rootElement);

  // 挂载 React 应用
  const root = createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <Pet onCollect={onCollect} />
    </React.StrictMode>
  );
};

