'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LICENSE_CATEGORIES } from '@/lib/constants';
import JsonEditor from '@/components/JsonEditor';
import ContentRenderer from '@/components/ContentRenderer';

interface ContentObject {
  format: 'text' | 'html' | 'latex';
  value: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    position: 'before' | 'after';
    alt?: string;
  };
}

interface Question {
  id: string;
  type: string;
  question: string | ContentObject;
  points: number;
  difficulty?: string;
}

export default function QuizQuestionsPage() {
  const params = useParams();
  const category = params.category as string;
  const quizId = params.quizId as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [fullQuizData, setFullQuizData] = useState<any>(null);

  const categoryInfo = LICENSE_CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    loadQuestions();
  }, [category, quizId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}/content`);
      const data = await res.json();
      setFullQuizData(data);
      setQuestions(data.questions || []);
      setQuizTitle(data.title || quizId);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionText = (question: Question['question']): string => {
    if (typeof question === 'string') {
      return question;
    }
    return question.value || '';
  };

  const handleSaveQuestion = async (updatedQuestion: Question) => {
    try {
      console.log('Saving question:', updatedQuestion);
      
      // Update the question in the full quiz data
      const updatedQuestions = questions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      );
      const updatedQuizData = { ...fullQuizData, questions: updatedQuestions };

      console.log('Updated quiz data:', updatedQuizData);

      // Get the json_url from the database by fetching quiz metadata
      const metaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}`);
      if (!metaRes.ok) {
        throw new Error('Failed to fetch quiz metadata');
      }
      const metaData = await metaRes.json();
      const jsonUrl = metaData.jsonUrl;

      console.log('Uploading to:', jsonUrl);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: jsonUrl,
          content: JSON.stringify(updatedQuizData, null, 2),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      setQuestions(updatedQuestions);
      setFullQuizData(updatedQuizData);
      setEditingQuestion(null);
      alert('Question updated successfully!');
    } catch (err: any) {
      console.error('Failed to save question:', err);
      alert(`Failed to save: ${err.message}`);
      throw err;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading questions...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/content/categories/${category}/quiz-banks`}
          className="text-blue-600 hover:underline text-sm mb-2 inline-block"
        >
          ← Back to Quiz Banks
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          ❓ Questions - {quizTitle}
        </h1>
        <p className="text-gray-600 mt-2">
          {categoryInfo?.label || category} • {questions.length} questions
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No questions available for this quiz</p>
          <p className="text-gray-400 text-sm mt-2">Questions are stored in the quiz JSON file</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {question.type}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{question.points} points</span>
                </div>
                <button
                  onClick={() => setEditingQuestion(question)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
              <div className="px-6 py-4">
                <ContentRenderer content={question.question} className="text-gray-900" />
                <div className="text-xs text-gray-500 mt-3">{question.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingQuestion && (
        <JsonEditor
          title={`Edit Question: ${getQuestionText(editingQuestion.question)}`}
          initialValue={editingQuestion}
          onSave={handleSaveQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
}
