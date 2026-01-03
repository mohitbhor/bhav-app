import React, { useState, useEffect } from 'react';
import { Plus, Check, Save, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';

const DEFAULT_VEGETABLES = [
  'Tomato', 'Onion', 'Potato', 'Cabbage', 'Cauliflower', 
  'Spinach', 'Coriander', 'Green Chilli', 'Ginger', 'Garlic',
  'Lady Finger', 'Brinjal', 'Capsicum', 'Peas', 'Carrot',
  'Radish', 'Cucumber', 'Bottle Gourd', 'Ridge Gourd', 'Pumpkin'
].sort();

const MANDIS = ['Azadpur', 'Ghazipur', 'Narela', 'Other'].sort();
const QUALITY_GRADES = ['High', 'Medium', 'Low'];
const UNITS = ['KG', 'Paseri', 'Piece', 'Quintal', 'Man'];

function App() {
  const [step, setStep] = useState(1);
  const [vegetables, setVegetables] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [mandis, setMandis] = useState(MANDIS);
  
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    mandi: '',
    dealer: ''
  });

  const [vegEntry, setVegEntry] = useState({
    vegetable: '',
    price: '',
    unit: 'KG',
    quality: 'Medium',
    notes: ''
  });

  const [entries, setEntries] = useState([]);
  const [showAddVeg, setShowAddVeg] = useState(false);
  const [showAddDealer, setShowAddDealer] = useState(false);
  const [showAddMandi, setShowAddMandi] = useState(false);
  const [newVeg, setNewVeg] = useState('');
  const [newMandi, setNewMandi] = useState('');
  const [newDealer, setNewDealer] = useState({ name: '', phone: '', mandi: '' });
  const [saved, setSaved] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load master data on mount
  useEffect(() => {
    loadMasterData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied')
      );
    }
  }, []);

  const loadMasterData = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://YOUR_FUNCTION_APP_NAME.azurewebsites.net';
      const response = await fetch(`${API_BASE_URL}/api/getMasterData`);
      const data = await response.json();
      
      setVegetables(data.vegetables || DEFAULT_VEGETABLES);
      setDealers(data.dealers || []);
      setMandis(data.mandis || MANDIS);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load master data, using defaults:', error);
      setVegetables(DEFAULT_VEGETABLES);
      setDealers([
        { name: 'Ram Traders', phone: '9876543210', mandi: 'Azadpur' },
        { name: 'Shyam & Sons', phone: '9876543211', mandi: 'Ghazipur' }
      ]);
      setLoading(false);
    }
  };

  const saveMasterData = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://YOUR_FUNCTION_APP_NAME.azurewebsites.net';
      await fetch(`${API_BASE_URL}/api/saveMasterData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vegetables,
          dealers,
          mandis
        })
      });
    } catch (error) {
      console.error('Failed to save master data:', error);
    }
  };

  const goToDealer = () => {
    if (!sessionData.mandi) {
      alert('Please select a mandi');
      return;
    }
    setStep(2);
  };

  const goToVegetables = () => {
    if (!sessionData.dealer) {
      alert('Please select a dealer');
      return;
    }
    setStep(3);
  };

  const addVegetableEntry = () => {
    if (!vegEntry.vegetable || !vegEntry.price) {
      alert('Please fill vegetable and price');
      return;
    }

    const entry = {
      ...sessionData,
      ...vegEntry,
      timestamp: new Date().toISOString(),
      location: location,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setEntries([...entries, entry]);
    setVegEntry({
      vegetable: '',
      price: '',
      unit: 'KG',
      quality: 'Medium',
      notes: ''
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const removeEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const moveToNextDealer = () => {
    setSessionData({ ...sessionData, dealer: '' });
    setStep(2);
  };

  const moveToNextMandi = () => {
    setSessionData({ ...sessionData, mandi: '', dealer: '' });
    setEntries([]);
    setStep(1);
  };

  const finishSession = async () => {
    if (entries.length === 0) {
      alert('No entries to save');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://YOUR_FUNCTION_APP_NAME.azurewebsites.net';
      const response = await fetch(`${API_BASE_URL}/api/saveEntries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });

      if (response.ok) {
        alert(`✅ ${entries.length} entries saved successfully!`);
        setEntries([]);
        setSessionData({
          date: new Date().toISOString().split('T')[0],
          mandi: '',
          dealer: ''
        });
        setStep(1);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving entries:', error);
      alert('Error saving. Please try again.');
    }
  };

  const addVegetable = () => {
    if (newVeg.trim()) {
      const updated = [...vegetables, newVeg.trim()].sort();
      setVegetables(updated);
      setVegEntry({ ...vegEntry, vegetable: newVeg.trim() });
      setNewVeg('');
      setShowAddVeg(false);
      saveMasterData();
    }
  };

  const addMandi = () => {
    if (newMandi.trim()) {
      const updated = [...mandis, newMandi.trim()].sort();
      setMandis(updated);
      setSessionData({ ...sessionData, mandi: newMandi.trim() });
      setNewMandi('');
      setShowAddMandi(false);
      saveMasterData();
    }
  };

  const addDealer = () => {
    if (newDealer.name.trim()) {
      const updated = [...dealers, newDealer].sort((a, b) => a.name.localeCompare(b.name));
      setDealers(updated);
      setSessionData({ ...sessionData, dealer: newDealer.name });
      setNewDealer({ name: '', phone: '', mandi: '' });
      setShowAddDealer(false);
      saveMasterData();
    }
  };

  const getCurrentDealerEntries = () => {
    return entries.filter(e => e.dealer === sessionData.dealer && e.mandi === sessionData.mandi);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-green-800 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-800 mb-2">भाव एंट्री</h1>
          <p className="text-green-600">Daily Mandi Price Entry</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`} />
        </div>

        {saved && (
          <div className="mb-4 p-3 bg-green-100 border-2 border-green-500 rounded-lg flex items-center justify-center gap-2">
            <Check className="text-green-600" size={20} />
            <span className="text-green-800 font-semibold">Added!</span>
          </div>
        )}

        {entries.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-sm text-blue-800 font-semibold mb-3 flex justify-between items-center">
              <span>Session Summary</span>
              <span className="text-blue-600">Total: {entries.length} entries</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.map((entry, idx) => (
                <div key={entry.id} className="bg-white p-2 rounded text-xs border border-blue-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-blue-900">#{idx + 1} {entry.vegetable}</span>
                    <button 
                      onClick={() => removeEntry(entry.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-blue-700 space-y-0.5">
                    <div>💰 ₹{entry.price}/{entry.unit} • Quality: {entry.quality}</div>
                    <div>🏪 {entry.mandi} • 👤 {entry.dealer}</div>
                    {entry.notes && <div className="italic text-blue-600">📝 {entry.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Date & Mandi</h2>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={sessionData.date}
                  onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mandi</label>
                {!showAddMandi ? (
                  <div className="space-y-2">
                    {mandis.map(m => (
                      <button
                        key={m}
                        onClick={() => setSessionData({ ...sessionData, mandi: m })}
                        className={`w-full p-4 rounded-lg text-lg font-semibold transition-all ${
                          sessionData.mandi === m
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowAddMandi(true)}
                      className="w-full p-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> Add New Mandi
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMandi}
                      onChange={(e) => setNewMandi(e.target.value)}
                      placeholder="Enter mandi name"
                      className="flex-1 p-4 border-2 border-green-500 rounded-lg text-lg focus:outline-none"
                    />
                    <button onClick={addMandi} className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Add
                    </button>
                    <button onClick={() => setShowAddMandi(false)} className="px-4 bg-gray-300 rounded-lg hover:bg-gray-400">
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={goToDealer}
                className="w-full p-4 bg-green-600 text-white rounded-xl text-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Next: Select Dealer <ChevronRight size={24} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setStep(1)} className="text-green-600 flex items-center gap-1">
                  <ChevronLeft size={20} /> Back
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Select Dealer</h2>
                <div className="w-16" />
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700">📅 {sessionData.date}</div>
                <div className="text-lg font-bold text-green-800">🏪 {sessionData.mandi}</div>
              </div>

              {!showAddDealer ? (
                <div className="space-y-2">
                  {dealers.filter(d => d.mandi === sessionData.mandi || sessionData.mandi === 'Other').map(d => (
                    <button
                      key={d.name}
                      onClick={() => setSessionData({ ...sessionData, dealer: d.name })}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        sessionData.dealer === d.name
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-semibold text-lg">{d.name}</div>
                      <div className="text-sm opacity-80">📞 {d.phone}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddDealer(true)}
                    className="w-full p-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Add New Dealer
                  </button>
                </div>
              ) : (
                <div className="space-y-2 p-4 bg-green-50 rounded-lg">
                  <input
                    type="text"
                    value={newDealer.name}
                    onChange={(e) => setNewDealer({ ...newDealer, name: e.target.value })}
                    placeholder="Dealer Name"
                    className="w-full p-3 border-2 border-green-500 rounded-lg text-lg focus:outline-none"
                  />
                  <input
                    type="tel"
                    value={newDealer.phone}
                    onChange={(e) => setNewDealer({ ...newDealer, phone: e.target.value })}
                    placeholder="Phone Number"
                    className="w-full p-3 border-2 border-green-500 rounded-lg text-lg focus:outline-none"
                  />
                  <select
                    value={newDealer.mandi}
                    onChange={(e) => setNewDealer({ ...newDealer, mandi: e.target.value })}
                    className="w-full p-3 border-2 border-green-500 rounded-lg text-lg focus:outline-none bg-white"
                  >
                    <option value="">Select Mandi</option>
                    {mandis.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={addDealer} className="flex-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                      Add Dealer
                    </button>
                    <button onClick={() => setShowAddDealer(false)} className="flex-1 p-3 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={goToVegetables}
                className="w-full p-4 bg-green-600 text-white rounded-xl text-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Next: Add Vegetables <ChevronRight size={24} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setStep(2)} className="text-green-600 flex items-center gap-1">
                  <ChevronLeft size={20} /> Back
                </button>
                <h2 className="text-xl font-bold text-gray-800">Add Vegetables</h2>
                <div className="w-16" />
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700">🏪 {sessionData.mandi}</div>
                <div className="text-lg font-bold text-green-800">👤 {sessionData.dealer}</div>
              </div>

              {getCurrentDealerEntries().length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-800 mb-2">Added for this dealer:</div>
                  <div className="space-y-1">
                    {getCurrentDealerEntries().map(e => (
                      <div key={e.id} className="flex justify-between items-center text-sm text-blue-700 bg-white p-2 rounded">
                        <span>{e.vegetable} - ₹{e.price}/{e.unit} ({e.quality})</span>
                        <button onClick={() => removeEntry(e.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vegetable</label>
                {!showAddVeg ? (
                  <div className="flex gap-2">
                    <select
                      value={vegEntry.vegetable}
                      onChange={(e) => setVegEntry({ ...vegEntry, vegetable: e.target.value })}
                      className="flex-1 p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-green-500 focus:outline-none bg-white"
                    >
                      <option value="">Select Vegetable</option>
                      {vegetables.map(veg => (
                        <option key={veg} value={veg}>{veg}</option>
                      ))}
                    </select>
                    <button onClick={() => setShowAddVeg(true)} className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                      <Plus size={24} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVeg}
                      onChange={(e) => setNewVeg(e.target.value)}
                      placeholder="New vegetable"
                      className="flex-1 p-3 border-2 border-green-500 rounded-lg text-lg focus:outline-none"
                    />
                    <button onClick={addVegetable} className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Add
                    </button>
                    <button onClick={() => setShowAddVeg(false)} className="px-4 bg-gray-300 rounded-lg hover:bg-gray-400">
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vegEntry.price}
                    onChange={(e) => setVegEntry({ ...vegEntry, price: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <select
                    value={vegEntry.unit}
                    onChange={(e) => setVegEntry({ ...vegEntry, unit: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-green-500 focus:outline-none bg-white"
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quality</label>
                <div className="grid grid-cols-3 gap-2">
                  {QUALITY_GRADES.map(grade => (
                    <button
                      key={grade}
                      onClick={() => setVegEntry({ ...vegEntry, quality: grade })}
                      className={`p-3 rounded-lg font-semibold transition-all ${
                        vegEntry.quality === grade
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={addVegetableEntry}
                className="w-full p-4 bg-green-600 text-white rounded-xl text-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus size={24} /> Add Vegetable
              </button>

              {getCurrentDealerEntries().length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={moveToNextDealer}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Next Dealer
                  </button>
                  <button
                    onClick={moveToNextMandi}
                    className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    Next Mandi
                  </button>
                </div>
              )}

              {entries.length > 0 && (
                <button
                  onClick={finishSession}
                  className="w-full p-4 bg-orange-600 text-white rounded-xl text-xl font-bold hover:bg-orange-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Save size={24} /> Finish & Save All ({entries.length} entries)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          {location && '📍 Location captured'} • ⏰ {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>
    </div>
  );
}

export default App;