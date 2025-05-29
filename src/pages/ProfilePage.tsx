import { useState } from 'react';

interface Discussion {
  id: string;
  topic: string;
  date: string;
  duration: string;
}

export default function ProfilePage() {
  const [user] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    joinDate: 'November 2023',
    bio: 'Passionate about technology and thoughtful discussions. I enjoy exploring different perspectives on complex topics.'
  });

  const [pastDiscussions] = useState<Discussion[]>([
    {
      id: '1',
      topic: 'The future of remote work',
      date: 'November 15, 2023',
      duration: '7 minutes'
    },
    {
      id: '2',
      topic: 'Artificial intelligence in everyday life',
      date: 'November 12, 2023',
      duration: '7 minutes'
    },
    {
      id: '3',
      topic: 'Climate change solutions',
      date: 'November 8, 2023',
      duration: '7 minutes'
    }
  ]);

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 md:h-48"></div>
          
          <div className="px-4 py-6 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="-mt-16 sm:-mt-24">
                <img
                  className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-gray-800 bg-gray-800"
                  src={user.avatar}
                  alt={user.name}
                />
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-sm text-gray-400">Member since {user.joinDate}</p>
                <p className="mt-2 text-gray-300 max-w-lg">{user.bio}</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('discussions')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'discussions'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Past Discussions
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
                
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Full Name</p>
                      <p className="text-white">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p className="text-white">{user.joinDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Discussions Participated</p>
                      <p className="text-white">{pastDiscussions.length}</p>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-4">Bio</h2>
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-white">{user.bio}</p>
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-4">Interests</h2>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Technology</span>
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">AI</span>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">Climate</span>
                    <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">Education</span>
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">Philosophy</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'discussions' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Past Discussions</h2>
                
                {pastDiscussions.length > 0 ? (
                  <div className="space-y-4">
                    {pastDiscussions.map((discussion) => (
                      <div key={discussion.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors duration-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-white">{discussion.topic}</h3>
                            <p className="text-sm text-gray-400">
                              {discussion.date} • {discussion.duration}
                            </p>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md">
                            View Summary
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-700 rounded-lg p-8 text-center">
                    <p className="text-gray-300 mb-4">You haven't participated in any discussions yet.</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                      Start Your First Discussion
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
                
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="bg-gray-800 text-white rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user.name}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="bg-gray-800 text-white rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user.email}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-1">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        rows={4}
                        className="bg-gray-800 text-white rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user.bio}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                      Save Changes
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Email Notifications</p>
                        <p className="text-sm text-gray-400">Receive emails about new discussions and updates</p>
                      </div>
                      <div className="relative inline-block w-12 h-6 rounded-full bg-gray-600">
                        <input type="checkbox" id="email-notifications" className="sr-only" defaultChecked />
                        <span className="block w-6 h-6 bg-white rounded-full transform transition-transform duration-200 ease-in-out translate-x-6"></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Discussion Summaries</p>
                        <p className="text-sm text-gray-400">Receive summaries of discussions you participated in</p>
                      </div>
                      <div className="relative inline-block w-12 h-6 rounded-full bg-gray-600">
                        <input type="checkbox" id="discussion-summaries" className="sr-only" defaultChecked />
                        <span className="block w-6 h-6 bg-white rounded-full transform transition-transform duration-200 ease-in-out translate-x-6"></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Topic Suggestions</p>
                        <p className="text-sm text-gray-400">Receive suggestions for new discussion topics</p>
                      </div>
                      <div className="relative inline-block w-12 h-6 rounded-full bg-gray-600">
                        <input type="checkbox" id="topic-suggestions" className="sr-only" />
                        <span className="block w-6 h-6 bg-white rounded-full transform transition-transform duration-200 ease-in-out"></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-900 bg-opacity-30 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Danger Zone</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Delete Account</p>
                      <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                    </div>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
