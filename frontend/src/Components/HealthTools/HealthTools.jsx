import { Link } from 'react-router-dom';

const HealthTools = () => {
  const tools = [
    {
      id: 1,
      title: 'BMI Calculator',
      description: 'Calculate your Body Mass Index and track your weight trends over time.',
      icon: '⚖️',
      path: '/health-tools/bmi',
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 2,
      title: 'Water Intake Tracker',
      description: 'Set daily hydration goals and monitor your water consumption throughout the day.',
      icon: '💧',
      path: '/health-tools/water',
      color: 'bg-cyan-50 hover:bg-cyan-100'
    },
    {
      id: 3,
      title: 'Sleep Duration Tracker',
      description: 'Log your sleep patterns and track sleep quality for better rest habits.',
      icon: '😴',
      path: '/health-tools/sleep',
      color: 'bg-purple-50 hover:bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Health Tools & Insights
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Take control of your health with our comprehensive tracking tools. Monitor your BMI, hydration, and sleep patterns all in one place.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className={`${tool.color} rounded-2xl shadow-lg p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-gray-200`}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{tool.icon}</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  {tool.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="mt-6 text-center">
                <span className="inline-flex items-center text-indigo-600 font-semibold">
                  Get Started
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Track Your Health?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-800 mb-2">Data-Driven Insights</h4>
              <p className="text-gray-600 text-sm">Make informed decisions based on your health trends</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-800 mb-2">Goal Achievement</h4>
              <p className="text-gray-600 text-sm">Set and reach your health goals with consistent tracking</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💪</div>
              <h4 className="font-semibold text-gray-800 mb-2">Better Habits</h4>
              <p className="text-gray-600 text-sm">Build healthier routines through regular monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthTools;
