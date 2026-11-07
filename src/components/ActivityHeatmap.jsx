import React, { useMemo } from 'react';
import { Flame, Calendar as CalendarIcon, Award, Zap } from 'lucide-react';
import './ActivityHeatmap.css';

/**
 * ActivityHeatmap Component
 * Displays a LeetCode / GitHub style interactive contribution heatmap
 * strictly adhering to the 60-30-10 color palette (Obsidian + Emerald Glow).
 */
export default function ActivityHeatmap({ entries = [] }) {
  // Aggregate solves per date (YYYY-MM-DD)
  const { dateCounts, streakInfo, totalSolves } = useMemo(() => {
    const counts = {};
    let total = 0;

    entries.forEach(entry => {
      const dateVal = entry.completedAt || entry.updatedAt || entry.date;
      if (!dateVal) return;
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return;
        const key = d.toISOString().split('T')[0];
        counts[key] = (counts[key] || 0) + 1;
        total += 1;
      } catch (e) {
        // ignore invalid dates
      }
    });

    // Calculate streaks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check last 365 days
    for (let i = 365; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const key = checkDate.toISOString().split('T')[0];
      if (counts[key] && counts[key] > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Current streak going back from today / yesterday
    let checkDate = new Date(today);
    let key = checkDate.toISOString().split('T')[0];
    if (!counts[key]) {
      // Check yesterday if haven't solved today yet
      checkDate.setDate(checkDate.getDate() - 1);
      key = checkDate.toISOString().split('T')[0];
    }

    while (counts[key] && counts[key] > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      key = checkDate.toISOString().split('T')[0];
    }

    return {
      dateCounts: counts,
      streakInfo: { current: currentStreak, longest: longestStreak },
      totalSolves: total
    };
  }, [entries]);

  // Generate grid for the past 24 weeks (~6 months)
  const weeks = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End on upcoming Saturday to complete current week column
    const dayOfWeek = today.getDay(); // 0 is Sun, 6 is Sat
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek));

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (24 * 7 - 1)); // 24 weeks

    let curr = new Date(startDate);
    let currentWeek = [];

    while (curr <= endDate) {
      const dateKey = curr.toISOString().split('T')[0];
      const count = dateCounts[dateKey] || 0;
      const isFuture = curr > today;

      currentWeek.push({
        date: dateKey,
        count: isFuture ? 0 : count,
        isFuture,
        day: curr.getDay(),
        dateFormatted: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [dateCounts]);

  const getLevelClass = (count, isFuture) => {
    if (isFuture) return 'future';
    if (count === 0) return 'level-0';
    if (count === 1) return 'level-1';
    if (count === 2) return 'level-2';
    if (count <= 4) return 'level-3';
    return 'level-4';
  };

  return (
    <div className="activity-heatmap-card">
      <div className="heatmap-header">
        <div className="heatmap-title-group">
          <div className="heatmap-badge">
            <CalendarIcon size={14} />
            <span>Consistency Tracker</span>
          </div>
          <h3 className="heatmap-title">Activity & Study Streaks</h3>
        </div>

        <div className="streak-stats-row">
          <div className="streak-pill">
            <Flame size={16} className={streakInfo.current > 0 ? "flame-active" : "flame-inactive"} />
            <div>
              <span className="streak-value">{streakInfo.current}</span>
              <span className="streak-label"> Day Streak</span>
            </div>
          </div>

          <div className="streak-pill">
            <Award size={16} className="trophy-gold" />
            <div>
              <span className="streak-value">{streakInfo.longest}</span>
              <span className="streak-label"> Max Streak</span>
            </div>
          </div>

          <div className="streak-pill">
            <Zap size={16} className="zap-emerald" />
            <div>
              <span className="streak-value">{totalSolves}</span>
              <span className="streak-label"> Total Submissions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-matrix-wrapper">
        <div className="day-labels">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        <div className="weeks-grid">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="week-column">
              {week.map((cell, dIdx) => (
                <div
                  key={dIdx}
                  className={`heatmap-cell ${getLevelClass(cell.count, cell.isFuture)}`}
                  title={cell.isFuture ? 'Future' : `${cell.count} question${cell.count === 1 ? '' : 's'} solved on ${cell.dateFormatted}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-footer">
        <span className="legend-label">Less</span>
        <div className="legend-cells">
          <div className="heatmap-cell level-0" />
          <div className="heatmap-cell level-1" />
          <div className="heatmap-cell level-2" />
          <div className="heatmap-cell level-3" />
          <div className="heatmap-cell level-4" />
        </div>
        <span className="legend-label">More</span>
      </div>
    </div>
  );
}

