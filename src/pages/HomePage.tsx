import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/solid';

interface Discussion {
  id: string;
  title: string;
  description: string;
  category: string;
  participants: number;
  duration: string;
  status: 'live' | 'upcoming' | 'completed';
  color: string;
}

const featuredDiscussions: Discussion[] = [
  {
    id: '1',
    title: 'The Future of Artificial Intelligence',
    description: 'Exploring the potential impacts and ethical considerations of AI advancement',
    category: 'Technology',
    participants: 1247,
    duration: '45 min',
    status: 'live',
    color: 'blue'
  },
  {
    id: '2',
    title: 'Climate Change Solutions',
    description: 'Innovative approaches to combat global warming',
    category: 'Environment',
    participants: 892,
    duration: '30 min',
    status: 'upcoming',
    color: 'green'
  },
  {
    id: '3',
    title: 'Space Exploration Breakthroughs',
    description: 'Recent discoveries and future missions',
    category: 'Science',
    participants: 654,
    duration: '40 min',
    status: 'live',
    color: 'purple'
  }
];

const HomePage: React.FC = () => {
  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Technology': 'text-blue-400',
      'Environment': 'text-green-400',
      'Science': 'text-purple-400',
      'Business': 'text-orange-400',
      'Health': 'text-pink-400',
      'Finance': 'text-yellow-400'
    };
    return colors[category] || 'text-gray-400';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'live':
        return 'bg-red-600 text-white';
      case 'upcoming':
        return 'bg-yellow-600 text-white';
      case 'completed':
        return 'bg-gray-600 text-gray-300';
      default:
        return 'bg-gray-600 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Discussion Platform
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience the future of conversations with AI-powered discussions that bring topics to life through intelligent dialogue
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/discussion/explore"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
              >
                <PlayIcon className="h-6 w-6 mr-2" />
                Explore Discussions
              </Link>
              <Link
                to="/register"
                className="border border-gray-600 hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
              >
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Discussions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Discussions</h2>
          <p className="text-gray-400 text-lg">Join AI-powered conversations on trending topics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredDiscussions.map((discussion) => (
            <div key={discussion.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-700 ${getCategoryColor(discussion.category)}`}>
                  {discussion.category}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(discussion.status)}`}>
                  {discussion.status.toUpperCase()}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-white">
                {discussion.title}
              </h3>
              
              <p className="text-gray-400 mb-4 line-clamp-2">
                {discussion.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {discussion.participants.toLocaleString()}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {discussion.duration}
                </div>
              </div>
              
              <Link
                to={`/discussion/${discussion.id}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Join Discussion
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose AI Discussions?</h2>
            <p className="text-gray-400 text-lg">Experience conversations like never before</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Conversations</h3>
              <p className="text-gray-400">
                Experience natural, engaging discussions powered by advanced AI technology
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Driven</h3>
              <p className="text-gray-400">
                Join a vibrant community of learners and thinkers exploring diverse topics
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Always Available</h3>
              <p className="text-gray-400">
                Access discussions anytime, anywhere with our 24/7 AI-powered platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
