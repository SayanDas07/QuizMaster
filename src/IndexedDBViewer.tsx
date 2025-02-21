/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint, QuizResult } from './utils/Types';



const IndexedDBViewer: React.FC = () => {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz results on component mount
  useEffect(() => {
    loadQuizResults();
  }, []);

  // Function to open the IndexedDB database
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('QuizDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      // it creates the object store when the database is first created
      // or when the version number is incremented
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains('quizResults')) {
          db.createObjectStore('quizResults', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };
    });
  };

  // Function to get all quiz results from the object store
  const getAllResults = (store: IDBObjectStore): Promise<QuizResult[]> => {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  // Function to load quiz results from the IndexedDB database
  const loadQuizResults = async (): Promise<void> => {
    try {
      const db = await openDB();

      // Check if the object store exists
      if (!db.objectStoreNames.contains('quizResults')) {
        throw new Error('Quiz results store not found');
      }

      const tx = db.transaction('quizResults', 'readonly');
      const store = tx.objectStore('quizResults');
      const results = await getAllResults(store);

      setQuizResults(results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    } catch (err) {
      console.error('Failed to load quiz history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz history');
      setLoading(false);
    }
  };

  //reset the database
  const deleteDatabase = async (): Promise<void> => {
    try {
      const request = indexedDB.deleteDatabase('QuizDB');
      request.onsuccess = () => {
        console.log('Database deleted successfully');
        window.location.reload();
      };
      request.onerror = () => {
        console.error('Error deleting database');
      };
    } catch (err) {
      console.error('Failed to delete database:', err);
    }
  };

  // Helper function to get color based on percentage
  const getScoreColor = (score: number, total: number): string => {
    const percentage = (score / total) * 100;
    if (percentage < 30) return 'text-red-600 bg-red-100';
    if (percentage < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return <div className="text-center py-8">Loading quiz history...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-red-600">{error}</div>
        <button
          onClick={deleteDatabase}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset Database
        </button>
      </div>
    );
  }

  if (quizResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No quiz attempts found. Take a quiz to see your history!
      </div>
    );
  }

  const chartData: ChartDataPoint[] = quizResults
    .map(result => ({
      date: new Date(result.date).toLocaleDateString(),
      score: (result.score / result.totalQuestions) * 100
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        {quizResults.map((result, index) => {
          const percentage = Math.round((result.score / result.totalQuestions) * 100);
          const scoreColorClass = getScoreColor(result.score, result.totalQuestions);

          // Display each quiz result in a card
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    {new Date(result.date).toLocaleDateString()} at{' '}
                    {new Date(result.date).toLocaleTimeString()}
                  </p>
                  <p className="text-lg font-medium mt-1">
                    Score: {result.score} / {result.totalQuestions}
                  </p>
                </div>
                <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${scoreColorClass}`}>
                  {percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndexedDBViewer;