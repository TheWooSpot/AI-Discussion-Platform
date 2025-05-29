import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { suggestDiscussionTopics } from '../services/gemini';

export default function HomePage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const suggestedTopics = await suggestDiscussionTopics();
        setTopics(suggestedTopics);
      } catch (error) {
        console.error('Error loading topics:', error);
        // Fallback topics
        setTopics([
          'The future of remote work',
          'Artificial intelligence in everyday life',
          'Climate change solutions',
          'The importance of digital literacy',
          "Social media's impact on society",
          'Space exploration in the 21st century',
          'The future of education',
          'Sustainable living practices',
          'Technology and privacy concerns',
          'The evolution of entertainment'
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTopics();
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gray-900 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Engage in AI-guided</span>
                  <span className="block text-blue-500">discussions</span>
                </h1>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Join our platform where you can participate in thoughtful conversations with AI hosts. 
                  Explore diverse perspectives on interesting topics in a respectful environment.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/discussion/explore"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      Start a Discussion
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-gray-800 hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-blue-600 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full opacity-70"></div>
        </div>
      </div>

      {/* Featured Topics Section */}
      <div className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Featured Discussion Topics
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
              Choose from our curated list of thought-provoking topics or suggest your own.
            </p>
          </div>

          {isLoading ? (
            <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-gray-700 animate-pulse">
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
              {topics.slice(0, 6).map((topic, index) => (
                <Link
                  key={index}
                  to={`/discussion/${encodeURIComponent(topic)}`}
                  className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                >
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <p className="text-xl font-semibold text-white">{topic}</p>
                      <p className="mt-3 text-base text-gray-300">
                        Join a 7-minute discussion with our AI hosts Alex and Jordan on this engaging topic.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500">
                          <span className="text-sm font-medium text-white">{index + 1}</span>
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-300">
                          {Math.floor(Math.random() * 50) + 10} discussions
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/discussion/explore"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Topics
              <svg
                className="ml-2 -mr-1 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-500 font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Participate in AI-guided discussions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-300 lg:mx-auto">
              Our platform makes it easy to engage in meaningful conversations with AI hosts that present different perspectives.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">Choose a Topic</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-300">
                  Browse our curated list of discussion topics or suggest your own. We cover everything from technology to philosophy.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">Join the Discussion</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-300">
                  Participate in a 7-minute conversation with our AI hosts, Alex and Jordan, who present different perspectives on the topic.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">Get a Summary</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-300">
                  After the discussion, receive a comprehensive summary with key points and a transcript that you can save or share.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start discussing?</span>
            <span className="block text-blue-200">Join our platform today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
