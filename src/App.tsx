import { useState } from 'react';
import IndexedDBViewer from './IndexedDBViewer';
import Quiz from './Quiz';
import { Menu } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('quiz');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <span className="text-xl font-semibold text-blue-600">QuizMaster</span>
            </div>
            
            {/* Menu Button for Small Screens */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Navigation Buttons - Desktop */}
            <div className="hidden md:flex space-x-2">
              <button
                onClick={() => setActiveTab('quiz')}
                className={`py-2 px-4 rounded-md flex items-center transition-all duration-200 ${
                  activeTab === 'quiz'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">📝</span> Take Quiz
              </button>

              <button
                onClick={() => setActiveTab('previous')}
                className={`py-2 px-4 rounded-md flex items-center transition-all duration-200 ${
                  activeTab === 'previous'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">📜</span> History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div 
        className={`md:hidden bg-white border-b border-gray-200 transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="px-4 py-2 space-y-1">
          <button
            onClick={() => {
              setActiveTab('quiz');
              setIsMenuOpen(false);
            }}
            className={`w-full text-left py-3 px-4 rounded-md flex items-center transition-colors ${
              activeTab === 'quiz'
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">📝</span> Take Quiz
          </button>

          <button
            onClick={() => {
              setActiveTab('previous');
              setIsMenuOpen(false);
            }}
            className={`w-full text-left py-3 px-4 rounded-md flex items-center transition-colors ${
              activeTab === 'previous'
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">📜</span> History
          </button>
        </div>
      </div>

      {/* Page Title Section */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {activeTab === 'quiz' ? 'Assessment Center' : 'Previous Attempts'}
          </h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'quiz' 
              ? 'Test your knowledge with our interactive quizzes' 
              : 'Review your quiz history and performance metrics'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'quiz' ? <Quiz /> : <IndexedDBViewer />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-6 text-sm text-black text-center">
          © 2025 QuizMaster. Made by Sayan Das.
        </div>
      </footer>
    </div>
  );
}

export default App;