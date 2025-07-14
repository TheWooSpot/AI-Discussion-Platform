import { Link } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon, 
  SparklesIcon, 
  UserGroupIcon,
  ArrowRightIcon,
  PlayIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'AI-Powered Discussions',
    description: 'Engage in meaningful conversations guided by our intelligent AI hosts Alex and Jordan.'
  },
  {
    icon: SpeakerWaveIcon,
    title: 'Voice AI Integration',
    description: 'Experience natural voice interactions with ElevenLabs-powered AI hosts that speak your responses.'
  },
  {
    icon: SparklesIcon,
    title: 'Dynamic Topics',
    description: 'Explore a wide range of topics from technology to philosophy, all facilitated by AI.'
  },
  {
    icon: UserGroupIcon,
    title: 'Community Driven',
    description: 'Join a community of curious minds exploring ideas together with AI assistance.'
  }
];

const recentDiscussions = [
  {
    id: '1',
    title: 'The Future of Artificial Intelligence',
    participants: 24,
    lastActivity: '2 minutes ago',
    isActive: true
  },
  {
    id: '2',
    title: 'Climate Change Solutions',
    participants: 18,
    lastActivity: '15 minutes ago',
    isActive: true
  },
  {
    id: '3',
    title: 'Space Exploration Ethics',
    participants: 31,
    lastActivity: '1 hour ago',
    isActive: false
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              AI-Powered
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {' '}Discussions
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join engaging conversations facilitated by our AI hosts Alex and Jordan. 
              Experience the future of interactive discussions with voice AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/discussion/explore"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold flex items-center justify-center transition-colors"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Start Exploring
              </Link>
              <Link
                to="/test-voice"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-md font-semibold flex items-center justify-center transition-colors border border-gray-600"
              >
                <SpeakerWaveIcon className="h-5 w-5 mr-2" />
                Test Voice AI
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose AI Discussions?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the next generation of online conversations with our advanced AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Discussions */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Recent Discussions
              </h2>
              <p className="text-xl text-gray-300">
                Join ongoing conversations or start your own
              </p>
            </div>
            <Link
              to="/discussion/explore"
              className="text-blue-400 hover:text-blue-300 flex items-center font-semibold"
            >
              View All
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentDiscussions.map((discussion) => (
              <Link
                key={discussion.id}
                to={`/discussion/${discussion.id}`}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    discussion.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-gray-400">
                    {discussion.participants} participants
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {discussion.title}
                </h3>
                
                <p className="text-gray-400 text-sm">
                  Last activity: {discussion.lastActivity}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience AI Discussions?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users already engaging in meaningful conversations with our AI hosts
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/discussion/explore"
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-md font-semibold transition-colors"
            >
              Explore Discussions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
