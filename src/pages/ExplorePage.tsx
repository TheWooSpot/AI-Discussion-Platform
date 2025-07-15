import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FireIcon, 
  ClockIcon, 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface Discussion {
  id: string;
  title: string;
  description: string;
  category: string;
  participants: number;
  messages: number;
  lastActivity: string;
  isHot: boolean;
  tags: string[];
}

const mockDiscussions: Discussion[] = [
  {
    id: '1',
    title: 'The Future of Artificial Intelligence',
    description: 'Exploring the potential impacts and ethical considerations of advanced AI systems.',
    category: 'Technology',
    participants: 24,
    messages: 156,
    lastActivity: '2 minutes ago',
    isHot: true,
    tags: ['AI', 'Ethics', 'Future']
  },
  {
    id: '2',
    title: 'Climate Change Solutions',
    description: 'Discussing innovative approaches to combat climate change and environmental challenges.',
    category: 'Environment',
    participants: 18,
    messages: 89,
    lastActivity: '15 minutes ago',
    isHot: true,
    tags: ['Climate', 'Environment', 'Solutions']
  },
  {
    id: '3',
    title: 'Space Exploration and Colonization',
    description: 'The possibilities and challenges of human expansion beyond Earth.',
    category: 'Science',
    participants: 31,
    messages: 203,
    lastActivity: '1 hour ago',
    isHot: false,
    tags: ['Space', 'Mars', 'Technology']
  },
  {
    id: '4',
    title: 'The Evolution of Work in the Digital Age',
    description: 'How remote work and automation are reshaping the modern workplace.',
    category: 'Business',
    participants: 15,
    messages: 67,
    lastActivity: '3 hours ago',
    isHot: false,
    tags: ['Work', 'Remote', 'Digital']
  },
  {
    id: '5',
    title: 'Mental Health in Modern Society',
    description: 'Addressing the growing mental health challenges and potential solutions.',
    category: 'Health',
    participants: 22,
    messages: 134,
    lastActivity: '5 hours ago',
    isHot: false,
    tags: ['Mental Health', 'Society', 'Wellness']
  },
  {
    id: '6',
    title: 'Cryptocurrency and Digital Finance',
    description: 'The impact of blockchain technology on traditional financial systems.',
    category: 'Finance',
    participants: 28,
    messages: 178,
    lastActivity: '1 day ago',
    isHot: false,
    tags: ['Crypto', 'Blockchain', 'Finance']
  }
];

const categories = ['All', 'Technology', 'Science', 'Environment', 'Business', 'Health', 'Finance'];

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  const filteredDiscussions = mockDiscussions
    .filter(discussion => {
      const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           discussion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           discussion.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || discussion.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.participants - a.participants;
        case 'messages':
          return b.messages - a.messages;
        case 'recent':
        default:
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      }
    });

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Explore Discussions
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join engaging conversations powered by AI hosts Alex and Jordan. 
            Discover new perspectives and connect with curious minds.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search discussions, topics, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="messages">Most Messages</option>
            </select>
          </div>
        </div>

        {/* Discussion Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDiscussions.map((discussion) => (
            <Link
              key={discussion.id}
              to={`/discussion/${discussion.id}`}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {discussion.isHot && (
                      <FireIcon className="h-4 w-4 text-orange-500 mr-2" />
                    )}
                    <span className="text-sm text-blue-400 font-medium">
                      {discussion.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {discussion.title}
                  </h3>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {discussion.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {discussion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    {discussion.participants}
                  </div>
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                    {discussion.messages}
                  </div>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {discussion.lastActivity}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredDiscussions.length === 0 && (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No discussions found</h3>
            <p className="text-gray-400">
              Try adjusting your search terms or filters to find more discussions.
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Start Your Own Discussion
            </h2>
            <p className="text-blue-100 mb-6">
              Have a topic you'd like to explore? Create a new discussion and let our AI hosts guide the conversation.
            </p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Create Discussion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
