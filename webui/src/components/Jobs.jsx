import { useState, useEffect } from 'react';
import { getJobs } from '../api';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await getJobs();
        setJobs(response.data.jobs);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1 className="section-title">定时任务</h1>
      
      <div className="list-container">
        <div className="list-header">
          共 {jobs.length} 个任务
        </div>
        
        {jobs.length === 0 ? (
          <div className="list-item">
            <span className="list-item-name">暂无任务</span>
          </div>
        ) : (
          jobs.map((job, index) => (
            <div key={index} className="list-item">
              <div>
                <div className="list-item-name">{job.name}</div>
                <div className="list-item-meta">Cron: {job.cron}</div>
              </div>
              <span className={`badge ${job.running ? 'badge-running' : 'badge-stopped'}`}>
                {job.running ? '运行中' : '已停止'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Jobs;
