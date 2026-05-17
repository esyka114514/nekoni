import { useState, useEffect } from 'react';

function NProgress({ visible }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer;
    if (visible && progress < 90) {
      timer = setTimeout(() => {
        setProgress(prev => prev + Math.random() * 15);
      }, 200);
    }
    return () => clearTimeout(timer);
  }, [visible, progress]);

  useEffect(() => {
    if (visible) {
      setProgress(10);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [visible]);

  if (!visible && progress === 0) return null;

  return (
    <div className={`nprogress ${visible ? 'active' : ''}`}>
      <div className="nprogress-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
}

export const startProgress = () => {
  const event = new CustomEvent('nprogress-start');
  window.dispatchEvent(event);
};

export const stopProgress = () => {
  const event = new CustomEvent('nprogress-stop');
  window.dispatchEvent(event);
};

export default NProgress;
