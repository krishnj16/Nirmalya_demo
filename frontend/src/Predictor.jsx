import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the components Chart.js needs
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Predictor = () => {
  const [formData, setFormData] = useState({
    trash_type: 'plastic',
    weight_kg: 1,
    location_type: 'residential',
    citizen_type: 'taxpayer',
    area_dirtiness_level: 3,
  });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['weight_kg', 'area_dirtiness_level'].includes(name) ? Number(value) : value,
    });
  };

  // New function to handle clicks on the stepper buttons
  const handleWeightStep = (direction) => {
    setFormData(prevData => {
      const currentWeight = Number(prevData.weight_kg) || 0;
      let newWeight;
      if (direction === 'inc') {
        newWeight = currentWeight + 1;
      } else {
        // Ensure the weight doesn't go below the minimum of 0.1
        newWeight = Math.max(0.1, currentWeight - 1);
      }
      // Round to one decimal place to avoid floating point issues
      newWeight = Math.round(newWeight * 10) / 10;
      return { ...prevData, weight_kg: newWeight };
    });
  };

  const [metamaskConnected, setMetamaskConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setWalletAddress(accounts[0]);
        setMetamaskConnected(true);
        setError('');
      } catch (err) {
        setError('Failed to connect to MetaMask');
        console.error(err);
      }
    } else {
      setError('Please install MetaMask to use this feature');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    if (!metamaskConnected) {
      await connectMetaMask();
      if (!metamaskConnected) {
        setIsLoading(false);
        return;
      }
    }

    try {
      // First get the prediction from the ML model
      const response = await fetch('http://127.0.0.1:5000/predict-and-store-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          wallet_address: walletAddress
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResult(data);

      // Wait for blockchain transaction to complete
      if (data.transaction_hash) {
        await window.ethereum.request({
          method: 'eth_waitForTransactionReceipt',
          params: [data.transaction_hash],
        });
      }

    } catch (err) {
      setError('Failed to process submission. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data and options
  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Top Factors Influencing Reward', color: '#fff', font: {size: 16} },
    },
    scales: {
      x: { ticks: { color: '#ddd' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { ticks: { color: '#ddd' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
  };

  const chartData = {
    labels: result?.top_factors.map(factor => factor.feature) || [],
    datasets: [
      {
        label: 'SHAP Value (Impact)',
        data: result?.top_factors.map(factor => factor.impact) || [],
        backgroundColor: result?.top_factors.map(factor =>
          factor.impact > 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
        ),
        borderColor: result?.top_factors.map(factor =>
          factor.impact > 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="predictor-container">
      <div className="header">
        <h1>Reward Predictor</h1>
        <div className="wallet-status">
          {metamaskConnected ? (
            <div className="connected">
              <span className="dot green"></span>
              {`${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`}
            </div>
          ) : (
            <button className="connect-wallet" onClick={connectMetaMask}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="predictor-form">
        <label>
          Trash Type
          <select name="trash_type" value={formData.trash_type} onChange={handleInputChange}>
            <option value="plastic">Plastic</option>
            <option value="glass">Glass</option>
            <option value="organic">Organic</option>
            <option value="metal">Metal</option>
          </select>
        </label>
        <label>
          Weight (kg)
          {/* --- UPDATED INPUT WITH STEPPER BUTTONS --- */}
          <div className="stepper-input">
            <button type="button" onClick={() => handleWeightStep('dec')}>-</button>
            <input name="weight_kg" type="number" value={formData.weight_kg} onChange={handleInputChange} min="0.1" />
            <button type="button" onClick={() => handleWeightStep('inc')}>+</button>
          </div>
        </label>
        <label>
          Location Type
          <select name="location_type" value={formData.location_type} onChange={handleInputChange}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        </label>
        <label>
          Citizen Type
          <select name="citizen_type" value={formData.citizen_type} onChange={handleInputChange}>
            <option value="taxpayer">Tax Payer</option>
            <option value="ration_card_holder">Ration Card Holder</option>
          </select>
        </label>
        <label className="full-width-label">
          Area Dirtiness Level (1=Clean, 5=Very Dirty)
          <div className="slider-container">
            <span>{formData.area_dirtiness_level}</span>
            <input 
              name="area_dirtiness_level" 
              type="range" 
              value={formData.area_dirtiness_level} 
              onChange={handleInputChange} 
              min="1" 
              max="5" 
              step="1"
            />
          </div>
        </label>
        <button type="submit" disabled={isLoading} className={`submit-button ${isLoading ? 'loading' : ''}`}>
          {isLoading ? 'Processing Transaction...' : 'Submit & Get Reward'}
          {isLoading && <div className="spinner"></div>}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {result && (
        <div className="result-container">
          <h2>Prediction Result</h2>
          <div className="reward-display">
            <h3>
              {formData.citizen_type === 'taxpayer' 
                ? 'Tax Benefit' 
                : 'Ration Subsidy'}
            </h3>
            <p className="reward-value">
              {formData.citizen_type === 'taxpayer' ? (
                <span>₹{result.predicted_reward.toFixed(2)}</span>
              ) : (
                <span>{(result.predicted_reward / 10).toFixed(2)} units</span>
              )}
            </p>
          </div>
          <div className="chart-container">
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictor;
