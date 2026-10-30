import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const WaterIntakeTracker = () => {
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [amount, setAmount] = useState('');
  const [todayData, setTodayData] = useState({
    intake: 0,
    dailyGoal: 2000,
    logs: [],
    progress: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchTodayData();
    fetchWeeklyData();
  }, []);

  const fetchTodayData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/health/water/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayData(response.data);
      setDailyGoal(response.data.dailyGoal);
    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/health/water/weekly', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklyData(response.data);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    }
  };

  const setGoal = async (e) => {
    e.preventDefault();
    if (dailyGoal <= 0) {
      toast.error('Please enter a valid goal');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/health/water/goal',
        { dailyGoal: parseInt(dailyGoal) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Daily goal updated!');
      fetchTodayData();
    } catch (error) {
      toast.error('Failed to update goal');
    }
  };

  const logWater = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/health/water/log',
        { amount: parseInt(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Added ${amount}ml to your intake!`);
      setAmount('');
      fetchTodayData();
      fetchWeeklyData();
    } catch (error) {
      toast.error('Failed to log water intake');
    } finally {
      setLoading(false);
    }
  };

  const quickAdd = async (ml) => {
    try {
      await axios.post(
        'http://localhost:5000/health/water/log',
        { amount: ml },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Added ${ml}ml!`);
      fetchTodayData();
      fetchWeeklyData();
    } catch (error) {
      toast.error('Failed to log water intake');
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to="/health-tools" className="inline-flex items-center text-cyan-600 hover:text-cyan-800 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Health Tools
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💧 Water Intake Tracker</h1>
          <p className="text-gray-600">Stay hydrated and track your daily water consumption</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Today's Progress */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's Progress</h2>

            {/* Progress Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg className="w-64 h-64 transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="110"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                    fill="none"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="110"
                    stroke="#06b6d4"
                    strokeWidth="20"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 110}`}
                    strokeDashoffset={`${2 * Math.PI * 110 * (1 - todayData.progress / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-cyan-600">{todayData.intake}</div>
                  <div className="text-gray-600">ml / {todayData.dailyGoal}ml</div>
                  <div className="text-2xl font-semibold text-cyan-600 mt-2">{todayData.progress}%</div>
                </div>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[250, 500, 750, 1000].map((ml) => (
                <button
                  key={ml}
                  onClick={() => quickAdd(ml)}
                  className="bg-cyan-100 hover:bg-cyan-200 text-cyan-700 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  +{ml}ml
                </button>
              ))}
            </div>

            {/* Custom Amount Form */}
            <form onSubmit={logWater} className="flex gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Custom amount (ml)"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-cyan-600 text-white px-8 py-3 rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-semibold transition-colors"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </form>

            {/* Today's Logs */}
            <div className="mt-8">
              <h3 className="font-semibold text-gray-800 mb-4">Today's Log</h3>
              {todayData.logs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No water logged yet today</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {todayData.logs.map((log, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                      <span className="font-semibold text-cyan-700">+{log.amount}ml</span>
                      <span className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Goal Setting */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Goal</h2>

            <form onSubmit={setGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Your Goal (ml)
                </label>
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., 2000"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-600 text-white py-3 px-6 rounded-lg hover:bg-cyan-700 font-semibold transition-colors"
              >
                Update Goal
              </button>
            </form>

            <div className="mt-8 p-4 bg-cyan-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">💡 Hydration Tips:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Drink water before meals</li>
                <li>• Carry a water bottle</li>
                <li>• Set hourly reminders</li>
                <li>• Aim for 8-10 glasses/day</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Weekly Summary</h2>
          {weeklyData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data for this week yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {weeklyData.map((day, index) => (
                <div key={index} className="text-center p-4 bg-cyan-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-2">
                    {new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
                  </div>
                  <div className="text-2xl font-bold text-cyan-600">{day.intake || 0}</div>
                  <div className="text-xs text-gray-600">ml</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-cyan-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((day.intake / day.dailyGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaterIntakeTracker;
