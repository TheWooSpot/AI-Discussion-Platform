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
  tags: string[];
  isActive: boolean;
}

const mockDiscussions: Discussion[] = [
  {
    id: '1',
    title: 'The Future of Artificial Intelligence',
    description: 'Exploring the potential impacts and ethical considerations of AI development',
    category: 'Technology',
    participants: 24,
    messages: 156,
    lastActivity: '2 minutes ago',
    tags: ['AI', 'Ethics', 'Future'],
    isActive: true
  },
  {
    id: '2',
    title: 'Climate Change Solutions',
    description: 'Discussing innovative approaches to combat climate change',
    category: 'Environment',
    participants: 18,
    messages: 89,
    lastActivity: '15 minutes ago',
    tags: ['Climate', 'Environment', 'Solutions'],
    isActive: true
  },
  {
    id: '3',
    title: 'Space Exploration and Colonization',
    description: 'The challenges and opportunities of human space exploration',
    category: 'Science',
    participants: 31,
    messages: 203,
    lastActivity: '1 hour ago',
    tags: ['Space', 'Mars', 'Technology'],
    isActive: false
  },
  {
    id: '4',
    title: 'Digital Privacy Rights',
    description: 'Balancing convenience and privacy in the digital age',
    category: 'Technology',
    participants: 12,
    messages: 67,
    lastActivity: '3 hours ago',
    tags: ['Privacy', 'Digital Rights', 'Security'],
    isActive: false
  },
  {
    id: '5',
    title: 'Universal Basic Income',
    description: 'Examining the feasibility and implications of UBI',
    category: 'Economics',
    participants: 27,
    messages: 134,
    lastActivity: '5 hours ago',
    tags: ['UBI', 'Economics', 'Policy'],
    isActive: false
  },
  {
    id: '6',
    title: 'Gene Editing Ethics',
    description: 'The moral implications of CRISPR and genetic modification',
    category: 'Science',
    participants: 19,
    messages: 92,
    lastActivity: '1 day ago',
    tags: ['CRISPR', 'Ethics', 'Medicine'],
    isActive: false
  }
];

const categories = ['All', 'Technology', 'Science', 'Environment', 'Economics', 'Philosophy'];

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
        case 'active':
          return b.messages - a.messages;
        default:
          return 0; // Keep original order for 'recent'
      }
    });

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Explore Discussions
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join engaging conversations powered by AI hosts Alex and Jordan
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search discussions, topics, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="active">Most Active</option>
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
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    discussion.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-gray-400">{discussion.category}</span>
                </div>
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </div>

              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {discussion.title}
              </h3>

              <p className="text-gray-300 mb-4 line-clamp-2">
                {discussion.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {discussion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-200"
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
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No discussions found</h3>
            <p className="text-gray-400">Try adjusting your search terms or filters</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8">
            <FireIcon className="h-12 w-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Start Your Own Discussion
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Have a topic you're passionate about? Create a new discussion and let our AI hosts Alex and Jordan help facilitate an engaging conversation.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors">
              Create Discussion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
