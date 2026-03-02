import { Hono } from 'hono';
import type { Env } from '../types';

const progress = new Hono<{ Bindings: Env }>();

// GET /api/progress/:userId/summary
progress.get('/:userId/summary', async (c) => {
  try {
    const userId = c.req.param('userId');

    // Total study time from quiz attempts (time_taken is in seconds)
    const totalTimeResult = await c.env.DB.prepare(
      'SELECT SUM(time_taken) as total_seconds FROM quiz_attempts WHERE user_id = ?'
    ).bind(userId).first();
    const totalStudyTimeMinutes = Math.round(((totalTimeResult as any)?.total_seconds || 0) / 60);

    // Streaks
    const { results: sessions } = await c.env.DB.prepare(
      'SELECT completed_at FROM quiz_attempts WHERE user_id = ? ORDER BY completed_at DESC'
    ).bind(userId).all();
    
    const uniqueDays = new Set(sessions.map((s: any) => new Date(s.completed_at).toDateString()));
    const sortedDays = [...uniqueDays].map(d => new Date(d).getTime()).sort((a, b) => b - a);

    let currentStreak = 0;
    let longestStreak = 0;
    let lastStudyDate = sortedDays.length > 0 ? new Date(sortedDays[0]).getTime() : null;

    if (sortedDays.length > 0) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        if (new Date(sortedDays[0]).toDateString() === today.toDateString() || new Date(sortedDays[0]).toDateString() === yesterday.toDateString()) {
            currentStreak = 1;
            longestStreak = 1;

            for (let i = 0; i < sortedDays.length - 1; i++) {
                const day = sortedDays[i];
                const nextDay = sortedDays[i+1];
                const diff = (day - nextDay) / (1000 * 60 * 60 * 24);

                if (diff <= 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            longestStreak = currentStreak; // Simplified for this example
        }
    }

    // Completion percentage (mocked for now since learning modules aren't tracked yet)
    const completionPercentage = (uniqueDays.size * 5.5) % 100;

    return c.json({
      userId,
      totalStudyTimeMinutes,
      completionPercentage,
      currentStreak,
      longestStreak,
      lastStudyDate,
      badges: [] // Achievements table doesn't exist yet
    });
  } catch (error) {
    console.error('Get progress summary error:', error);
    return c.json({ error: 'Failed to fetch progress summary' }, 500);
  }
});

// POST /api/progress/record-session
progress.post('/record-session', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, lessonId, startTime, endTime, durationMinutes, completed } = body;
    
    if (!userId || !lessonId || !startTime || !endTime || !durationMinutes) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const id = `session-${crypto.randomUUID()}`;
    
    await c.env.DB.prepare(`
      INSERT INTO study_sessions (id, user_id, lesson_id, start_time, end_time, duration_minutes, completed) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userId, lessonId, startTime, endTime, durationMinutes, completed ? 1 : 0).run();
    
    return c.json({ success: true, id });
  } catch (error) {
    console.error('Record session error:', error);
    return c.json({ error: 'Failed to record session' }, 500);
  }
});

// The rest of your progress routes...

export default progress;
