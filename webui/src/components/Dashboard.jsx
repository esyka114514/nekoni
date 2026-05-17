import { useState, useEffect } from 'react';
import { getSystemStats } from '../api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getSystemStats();
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!stats) {
    return <div>加载失败</div>;
  }

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div>
      <h1 className="section-title">系统监控</h1>
      
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">CPU 使用率</div>
          <div className="card-value">{stats.cpu.usage.toFixed(1)}%</div>
          <div className="card-subtitle">{stats.cpu.cores} 核心 - {stats.cpu.model}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.cpu.usage}%` }}></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">内存使用率</div>
          <div className="card-value">{stats.memory.usagePercent.toFixed(1)}%</div>
          <div className="card-subtitle">{stats.memory.used} GB / {stats.memory.total} GB</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.memory.usagePercent}%` }}></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">运行时间</div>
          <div className="card-value">{formatUptime(stats.uptime)}</div>
          <div className="card-subtitle">进程运行时长</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-title">资源占用</div>
        <div className="table-container">
          <table className="process-table">
            <thead>
              <tr>
                <th>进程名</th>
                <th>PID</th>
                <th>CPU 时间 (秒)</th>
                <th>内存 (MB)</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProcesses && stats.topProcesses.length > 0 ? (
                stats.topProcesses.map((proc, index) => (
                  <tr key={index}>
                    <td className="process-name">{proc.name}</td>
                    <td>{proc.pid}</td>
                    <td>{proc.cpu.toFixed(2)}</td>
                    <td>{proc.memory.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">暂无进程数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stats.disks && stats.disks.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-title">磁盘使用率</div>
          {stats.disks.map((disk, index) => (
            <div key={index} style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{disk.label} ({disk.mount})</span>
                <span>{disk.usagePercent}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${disk.usagePercent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
