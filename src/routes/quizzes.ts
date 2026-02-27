import { Hono } from 'hono';
import type { Env } from '../types';

const quizzes = new Hono<{ Bindings: Env }>();

// GET /api/quizzes - Get all quiz banks
quizzes.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    const isPremium = c.req.query('isPremium');
    
    let query = 'SELECT * FROM quiz_banks WHERE 1=1';
    const params: any[] = [];
    
    if (category) {
      query += ' AND license_category = ?';
      params.push(category);
    }
    
    if (isPremium !== undefined) {
      query += ' AND is_premium = ?';
      params.push(isPremium === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY display_order ASC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    // Transform to camelCase for frontend
    const quizzes = (results || []).map((quiz: any) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      licenseCategory: quiz.license_category,
      topicArea: quiz.topic_area,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.total_questions,
      timeLimit: quiz.time_limit,
      passingScore: quiz.passing_score,
      isPremium: quiz.is_premium === 1,
      jsonUrl: quiz.json_url,
      version: quiz.version,
      order: quiz.display_order,
      createdAt: quiz.created_at,
      updatedAt: quiz.updated_at
    }));
    
    return c.json({ quizzes });
  } catch (error) {
    console.error('Get quiz banks error:', error);
    return c.json({ error: 'Failed to fetch quiz banks' }, 500);
  }
});

// GET /api/quizzes/:id - Get quiz bank metadata
quizzes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const quiz = await c.env.DB.prepare(
      'SELECT * FROM quiz_banks WHERE id = ?'
    ).bind(id).first();
    
    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }
    
    // Transform to camelCase
    const quizData = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      licenseCategory: quiz.license_category,
      topicArea: quiz.topic_area,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.total_questions,
      timeLimit: quiz.time_limit,
      passingScore: quiz.passing_score,
      isPremium: quiz.is_premium === 1,
      jsonUrl: quiz.json_url,
      version: quiz.version,
      order: quiz.display_order,
      createdAt: quiz.created_at,
      updatedAt: quiz.updated_at
    };
    
    return c.json(quizData);
  } catch (error) {
    console.error('Get quiz bank error:', error);
    return c.json({ error: 'Failed to fetch quiz bank' }, 500);
  }
});

// GET /api/quizzes/:id/content - Get full quiz content from R2
quizzes.get('/:id/content', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId'); // Optional - may be undefined for guests
    
    // Get quiz metadata
    const quiz = await c.env.DB.prepare(
      'SELECT * FROM quiz_banks WHERE id = ?'
    ).bind(id).first();
    
    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }
    
    // Check if quiz is premium and user has access
    if (quiz.is_premium === 1) {
      if (!userId) {
        return c.json({ 
          error: 'Premium content requires authentication',
          requiresAuth: true,
          isPremium: true
        }, 401);
      }
      
      // Check user subscription
      const user = await c.env.DB.prepare(
        'SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?'
      ).bind(userId).first();
      
      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }
      
      const hasActiveSubscription = user.subscription_status === 'PREMIUM' && 
        (!user.subscription_expiry_date || user.subscription_expiry_date > Date.now());
      
      if (!hasActiveSubscription) {
        return c.json({ 
          error: 'Premium content requires active subscription',
          requiresSubscription: true,
          isPremium: true
        }, 403);
      }
    }
    
    // Fetch quiz JSON from R2 using binding
    const object = await c.env.MEDIA_BUCKET.get(quiz.json_url);
    
    if (!object) {
      console.error('Quiz content not found in R2:', quiz.json_url);
      return c.json({ error: 'Quiz content not found in storage' }, 404);
    }
    
        const quizContent: any = await object.json();
    
        // Fix relative media URLs to be absolute R2 public URLs
        const publicR2Url = 'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev';
        const baseUrlPath = quiz.json_url.substring(0, quiz.json_url.lastIndexOf('/') + 1);
        const absoluteBaseUrl = `${publicR2Url}/${baseUrlPath}`;
    
        if (quizContent.questions && Array.isArray(quizContent.questions)) {
          quizContent.questions.forEach((q: any) => {
            // Fix top-level media (legacy)
            if (q.media && q.media.url) {
              if (q.media.url.startsWith('./')) {
                q.media.url = absoluteBaseUrl + q.media.url.substring(2);
              } else if (q.media.url.startsWith('/')) {
                q.media.url = publicR2Url + q.media.url;
              }
            }
            // Fix ContentObject media in question
            if (q.question && q.question.media && q.question.media.url) {
              if (q.question.media.url.startsWith('./')) {
                q.question.media.url = absoluteBaseUrl + q.question.media.url.substring(2);
              } else if (q.question.media.url.startsWith('/')) {
                q.question.media.url = publicR2Url + q.question.media.url;
              }
            }
          });
        }
    
        return c.json(quizContent);  } catch (error) {
    console.error('Get quiz content error:', error);
    return c.json({ error: 'Failed to fetch quiz content' }, 500);
  }
});

// POST /api/quizzes/:id/attempts - Submit quiz attempt
quizzes.post('/:id/attempts', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId'); // Optional for guests
    const body = await c.req.json();
    
    const { answers, timeTaken } = body;
    
    if (!answers || !Array.isArray(answers)) {
      return c.json({ error: 'Invalid answers format' }, 400);
    }
    
    // Get quiz metadata
    const quiz = await c.env.DB.prepare(
      'SELECT * FROM quiz_banks WHERE id = ?'
    ).bind(id).first();
    
    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }
    
    // Check if premium quiz requires auth
    if (quiz.is_premium === 1 && !userId) {
      return c.json({ 
        error: 'Premium quiz requires authentication',
        requiresAuth: true 
      }, 401);
    }
    
    // Fetch quiz content to validate answers
    const object = await c.env.MEDIA_BUCKET.get(quiz.json_url);
    if (!object) {
      return c.json({ error: 'Quiz content not found' }, 404);
    }
    
    const quizContent: any = await object.json();
    const questions = quizContent.questions || [];
    
    // Calculate score
    let correctAnswers = 0;
    const feedback: any[] = [];
    
    for (const answer of answers) {
      const question = questions.find((q: any) => q.id === answer.questionId);
      if (!question) continue;
      
      let isCorrect = false;
      
      // Check answer based on question type
      switch (question.type) {
        case 'multiple-choice':
          const correctOption = question.options.find((opt: any) => opt.isCorrect);
          isCorrect = answer.answer === correctOption?.id;
          break;
          
        case 'true-false':
          isCorrect = answer.answer === question.correctAnswer;
          break;
          
        case 'multiple-select':
          const correctIds = question.options
            .filter((opt: any) => opt.isCorrect)
            .map((opt: any) => opt.id)
            .sort();
          const userIds = (answer.answer || []).sort();
          isCorrect = JSON.stringify(correctIds) === JSON.stringify(userIds);
          break;
          
        case 'fill-blank':
          const userAnswers = answer.answer || [];
          isCorrect = question.blanks.every((blank: any, idx: number) => {
            const userAnswer = userAnswers[idx]?.toLowerCase().trim();
            return blank.acceptedAnswers.some((accepted: string) => 
              accepted.toLowerCase().trim() === userAnswer
            );
          });
          break;
          
        case 'matching':
          const correctPairs = question.pairs.map((p: any) => `${p.left}:${p.right}`).sort();
          const userPairs = (answer.answer || []).map((p: any) => `${p.left}:${p.right}`).sort();
          isCorrect = JSON.stringify(correctPairs) === JSON.stringify(userPairs);
          break;
          
        case 'ordering':
          const correctOrder = question.items
            .sort((a: any, b: any) => a.correctPosition - b.correctPosition)
            .map((item: any) => item.id);
          const userOrder = answer.answer || [];
          isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
          break;
          
        case 'short-answer':
          const userAnswer = (answer.answer || '').toLowerCase().trim();
          isCorrect = question.acceptedAnswers.some((accepted: string) =>
            accepted.toLowerCase().trim() === userAnswer
          );
          break;
      }
      
      if (isCorrect) correctAnswers++;
      
      feedback.push({
        questionId: question.id,
        isCorrect,
        explanation: question.explanation,
        userAnswer: answer.answer
      });
    }
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= quiz.passing_score;
    
    // Save attempt to database only if user is authenticated
    let attemptId = null;
    if (userId) {
      attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const completedAt = Date.now();
      
      await c.env.DB.prepare(`
        INSERT INTO quiz_attempts (
          id, user_id, quiz_bank_id, started_at, completed_at,
          time_taken, total_questions, correct_answers, score, passed, answers_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        attemptId,
        userId,
        id,
        completedAt - (timeTaken * 1000),
        completedAt,
        timeTaken,
        questions.length,
        correctAnswers,
        score,
        passed ? 1 : 0,
        JSON.stringify(answers)
      ).run();
      
      // Share progress with school if user is linked to one
      const user = await c.env.DB.prepare(
        'SELECT driving_school_id FROM users WHERE id = ?'
      ).bind(userId).first();
      
      if (user && user.driving_school_id) {
        const progressId = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await c.env.DB.prepare(`
          INSERT INTO school_student_progress (
            id, school_id, user_id, quiz_attempt_id, quiz_bank_id,
            quiz_name, category, score, passed, total_questions,
            correct_answers, time_taken, completed_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          progressId,
          user.driving_school_id,
          userId,
          attemptId,
          id,
          quiz.name,
          quiz.category,
          score,
          passed ? 1 : 0,
          questions.length,
          correctAnswers,
          timeTaken,
          completedAt,
          completedAt
        ).run();
      }
    }
    
    return c.json({
      attemptId,
      score,
      passed,
      correctAnswers,
      totalQuestions: questions.length,
      timeTaken,
      feedback,
      isGuest: !userId
    });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    return c.json({ error: 'Failed to submit quiz attempt' }, 500);
  }
});

// GET /api/quizzes/:id/attempts - Get user's attempts for a quiz
quizzes.get('/:id/attempts', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM quiz_attempts 
      WHERE quiz_bank_id = ? AND user_id = ?
      ORDER BY completed_at DESC
      LIMIT 10
    `).bind(id, userId).all();
    
    const attempts = (results || []).map((attempt: any) => ({
      id: attempt.id,
      quizBankId: attempt.quiz_bank_id,
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
      timeTaken: attempt.time_taken,
      totalQuestions: attempt.total_questions,
      correctAnswers: attempt.correct_answers,
      score: attempt.score,
      passed: attempt.passed === 1
    }));
    
    return c.json({ attempts });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    return c.json({ error: 'Failed to fetch quiz attempts' }, 500);
  }
});

export default quizzes;
