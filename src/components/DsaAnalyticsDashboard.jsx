import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Layers } from 'lucide-react';
import './DsaAnalyticsDashboard.css';

const DIFFICULTY_COLORS = {
  Easy: '#10b981',    // Emerald
  Medium: '#f59e0b',  // Warm Amber
  Hard: '#ef4444'     // Coral Red
};

export default function DsaAnalyticsDashboard({ entries = [] }) {
  // 1. Difficulty Distribution Data
  const difficultyData = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;

    entries.forEach(e => {
      const diff = (e.difficulty || 'Medium').toLowerCase();
      if (diff.includes('easy')) easy++;
      else if (diff.includes('hard')) hard++;
      else medium++;
    });

    const total = easy + medium + hard || 1;

    return [
      { name: 'Easy', count: easy, color: DIFFICULTY_COLORS.Easy, pct: Math.round((easy / total) * 100) },
      { name: 'Medium', count: medium, color: DIFFICULTY_COLORS.Medium, pct: Math.round((medium / total) * 100) },
      { name: 'Hard', count: hard, color: DIFFICULTY_COLORS.Hard, pct: Math.round((hard / total) * 100) },
    ];
  }, [entries]);

  // 2. Topic Proficiency Radar Data
  const radarData = useMemo(() => {
    const TOPICS_TO_TRACK = [
      'Arrays',
      'Dynamic Programming',
      'Graphs',
      'Trees',
      'Strings',
      'Two Pointers',
      'Sliding Window',
      'Greedy'
    ];

    const counts = {};
    TOPICS_TO_TRACK.forEach(t => { counts[t] = 0; });

    entries.forEach(e => {
      if (Array.isArray(e.topics)) {
        e.topics.forEach(t => {
          const match = TOPICS_TO_TRACK.find(track => track.toLowerCase() === t.toLowerCase());
          if (match) counts[match]++;
        });
      }
    });

    return TOPICS_TO_TRACK.map(topic => ({
      subject: topic,
      solved: counts[topic] || 0,
      fullMark: Math.max(...Object.values(counts), 10)
    }));
  }, [entries]);

  // 3. 30-Day Velocity Data
  const timelineData = useMemo(() => {
    const map = {};
    const days = 30;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map[key] = {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 0
      };
    }

    entries.forEach(e => {
      const dateVal = e.completedAt || e.updatedAt || e.date;
      if (!dateVal) return;
      try {
        const key = new Date(dateVal).toISOString().split('T')[0];
        if (map[key]) {
          map[key].count++;
        }
      } catch (err) {
        // ignore
      }
    });

    return Object.values(map);
  }, [entries]);

  return (
    <div className="analytics-dashboard-grid">
      {/* Card 1: Radar Chart for Topic Mastery */}
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-badge indigo">
            <Layers size={14} />
            <span>Topic Mastery</span>
          </div>
          <h4 className="analytics-card-title">Algorithmic Balance</h4>
        </div>
        <div className="analytics-chart-container">
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              />
              <Radar
                name="Solved"
                dataKey="solved"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card 2: Donut Chart for Difficulty */}
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-badge emerald">
            <PieIcon size={14} />
            <span>Difficulty Ratio</span>
          </div>
          <h4 className="analytics-card-title">Problem Spread</h4>
        </div>
        <div className="analytics-donut-container">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={difficultyData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121722',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="donut-legend-row">
            {difficultyData.map(item => (
              <div key={item.name} className="donut-legend-item">
                <span className="legend-dot" style={{ backgroundColor: item.color }} />
                <span className="legend-name">{item.name}</span>
                <span className="legend-val">{item.count} ({item.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: 30-Day Activity Area Chart */}
      <div className="analytics-card span-full">
        <div className="analytics-card-header">
          <div className="analytics-badge sky">
            <TrendingUp size={14} />
            <span>30-Day Velocity</span>
          </div>
          <h4 className="analytics-card-title">Daily Problem Momentum</h4>
        </div>
        <div className="analytics-chart-container" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="velocityEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121722',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Solved"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#velocityEmerald)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

