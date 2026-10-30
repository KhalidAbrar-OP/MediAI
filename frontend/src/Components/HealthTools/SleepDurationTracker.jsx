import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const SleepDurationTracker = () => {
  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [quality, setQuality] = useState('Average');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchHistory();
    fetchWeeklySummary();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/health/sleep/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchWeeklySummary = async () => {
    try {
      const response = await axios.get('/health/sleep/weekly', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklySummary(response.data);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const logSleep = async (e) => {
    e.preventDefault();

    if (!bedtime || !wakeTime) {
      toast.error('Please enter both bedtime and wake time');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        '/health/sleep',
        { bedtime, wakeTime, quality },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Sleep logged: ${response.data.data.duration} hours (${quality})`);
      setBedtime('');
      setWakeTime('');
      setQuality('Average');
      fetchHistory();
      fetchWeeklySummary();
    } catch (error) {
      console.error('Error logging sleep:', error);
      toast.error(error.response?.data?.message || 'Failed to save sleep record');
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (qualityValue) => {
    switch (qualityValue) {
      case 'Poor':
        return 'text-red-600 bg-red-100';
      case 'Average':
        return 'text-yellow-600 bg-yellow-100';
      case 'Good':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityIcon = (qualityValue) => {
    switch (qualityValue) {
      case 'Poor':
        return '😴';
      case 'Average':
        return '😐';
      case 'Good':
        return '😊';
      default:
        return '😴';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to="/health-tools" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Health Tools
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">😴 Sleep Duration Tracker</h1>
          <p className="text-gray-600">Monitor your sleep patterns and quality</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Log Sleep Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Log Your Sleep</h2>

            <form onSubmit={logSleep} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedtime
                </label>
                <input
                  type="datetime-local"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wake Time
                </label>
                <input
                  type="datetime-local"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep Quality
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Poor', 'Average', 'Good'].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${quality === q
                        ? q === 'Poor'
                          ? 'bg-red-600 text-white'
                          : q === 'Average'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {getQualityIcon(q)} {q}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? 'Logging...' : 'Log Sleep'}
              </button>
            </form>

            {/* Sleep Tips */}
            <div className="mt-8 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">💡 Better Sleep Tips:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Aim for 7-9 hours nightly</li>
                <li>• Maintain consistent schedule</li>
                <li>• Avoid screens before bed</li>
                <li>• Keep room cool and dark</li>
                <li>• Limit caffeine after 2 PM</li>
              </ul>
            </div>
          </div>

          {/* Weekly Summary & History */}
          <div className="space-y-8">
            {/* Weekly Summary Card */}
            {weeklySummary && weeklySummary.totalRecords > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Weekly Summary</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-purple-50 rounded-xl">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {weeklySummary.averageDuration}h
                    </div>
                    <div className="text-gray-600 text-sm">Average Sleep</div>
                  </div>
                  <div className="text-center p-6 bg-indigo-50 rounded-xl">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                      {weeklySummary.totalRecords}
                    </div>
                    <div className="text-gray-600 text-sm">Nights Tracked</div>
                  </div>
                </div>
              </div>
            )}

            {/* Sleep History */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Sleep History</h2>

              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😴</div>
                  <p className="text-gray-600">No sleep records yet. Log your first night!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {history.map((record, index) => (
                    <div key={record._id || index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-3xl font-bold text-purple-600">
                              {record.duration}h
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getQualityColor(record.quality)}`}>
                              {getQualityIcon(record.quality)} {record.quality}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          {new Date(record.loggedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Bedtime:</span>
                          <br />
                          {new Date(record.bedtime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div>
                          <span className="font-medium">Wake Time:</span>
                          <br />
                          {new Date(record.wakeTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SleepDurationTracker;
