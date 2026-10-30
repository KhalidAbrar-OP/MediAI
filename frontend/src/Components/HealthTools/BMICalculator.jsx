import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const BMICalculator = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/health/bmi/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateBMI = async (e) => {
    e.preventDefault();

    if (!weight || !height || weight <= 0 || height <= 0) {
      toast.error('Please enter valid weight and height values');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        '/health/bmi',
        { weight: parseFloat(weight), height: parseFloat(height) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(response.data.data);
      toast.success('BMI calculated and saved successfully!');
      fetchHistory(); // Refresh history
      setWeight('');
      setHeight('');
    } catch (error) {
      console.error('Error calculating BMI:', error);
      toast.error(error.response?.data?.message || 'Failed to save your data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Underweight':
        return 'text-blue-600 bg-blue-100';
      case 'Normal':
        return 'text-green-600 bg-green-100';
      case 'Overweight':
        return 'text-yellow-600 bg-yellow-100';
      case 'Obese':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to="/health-tools" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Health Tools
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BMI Calculator</h1>
          <p className="text-gray-600">Calculate and track your Body Mass Index</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Calculate Your BMI</h2>

            <form onSubmit={calculateBMI} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your weight"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your height"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? 'Calculating...' : 'Calculate BMI'}
              </button>
            </form>

            {/* Current Result */}
            {result && (
              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Result</h3>
                <div className="text-center">
                  <div className="text-5xl font-bold text-indigo-600 mb-2">{result.bmi}</div>
                  <span className={`inline-block px-4 py-2 rounded-full font-semibold ${getCategoryColor(result.category)}`}>
                    {result.category}
                  </span>
                </div>
              </div>
            )}

            {/* BMI Categories Reference */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">BMI Categories:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Underweight:</span>
                  <span className="font-semibold text-blue-600">&lt; 18.5</span>
                </div>
                <div className="flex justify-between">
                  <span>Normal:</span>
                  <span className="font-semibold text-green-600">18.5 - 24.9</span>
                </div>
                <div className="flex justify-between">
                  <span>Overweight:</span>
                  <span className="font-semibold text-yellow-600">25 - 29.9</span>
                </div>
                <div className="flex justify-between">
                  <span>Obese:</span>
                  <span className="font-semibold text-red-600">≥ 30</span>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your BMI History</h2>

            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-600">No BMI records yet. Calculate your first BMI!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {history.map((record, index) => (
                  <div key={record._id || index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-2xl font-bold text-indigo-600">{record.bmi}</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(record.category)}`}>
                          {record.category}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {new Date(record.calculatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>Weight: {record.weight} kg</span>
                      <span>Height: {record.height} cm</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;
