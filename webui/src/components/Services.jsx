import { useState, useEffect } from 'react';
import { getServices } from '../api';

function Services() {
  const [services, setServices] = useState([]);
  const [httpServerRunning, setHttpServerRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await getServices();
        setServices(response.data.services);
        setHttpServerRunning(response.data.httpServerRunning);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      }
    };

    fetchServices();
    const interval = setInterval(fetchServices, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1 className="section-title">HTTP 服务</h1>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">HTTP 服务器状态</div>
        <div className="card-value">
          <span className={`badge ${httpServerRunning ? 'badge-running' : 'badge-stopped'}`}>
            {httpServerRunning ? '运行中' : '已停止'}
          </span>
        </div>
      </div>

      <div className="list-container">
        <div className="list-header">
          共 {services.length} 个服务
        </div>
        
        {services.length === 0 ? (
          <div className="list-item">
            <span className="list-item-name">暂无服务</span>
          </div>
        ) : (
          services.map((service, index) => (
            <div key={index} className="list-item">
              <div>
                <div className="list-item-name">{service.name}</div>
              </div>
              <span className={`badge ${service.running ? 'badge-running' : 'badge-stopped'}`}>
                {service.running ? '活跃' : '未激活'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Services;
