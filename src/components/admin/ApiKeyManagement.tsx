import React, { useState, useEffect } from 'react';
import { Key, Plus, Eye, EyeOff, Copy, Trash2, Power, AlertCircle } from 'lucide-react';

interface ApiKey {
  id: string;
  key_name: string;
  bus_id: string;
  is_active: boolean;
  usage_count: number;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
  buses: {
    number: string;
    route_id: string;
    status: string;
  };
}

interface Bus {
  id: string;
  number: string;
  route_id: string;
  status: string;
}

export const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState<{
    bus_id: string;
    key_name: string;
    expires_in_days: number | null;
  }>({
    bus_id: '',
    key_name: '',
    expires_in_days: null
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApiKeys();
    fetchBuses();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': 'Bearer admin-demo-token'
        }
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/buses/active');
      const data = await response.json();
      setBuses(data);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-demo-token'
        },
        body: JSON.stringify(newKey)
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedKey(data.data.api_key);
        setShowCreateForm(false);
        setNewKey({ bus_id: '', key_name: '', expires_in_days: null });
        fetchApiKeys();
      } else {
        alert('Error creating API key: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Error creating API key');
    }
  };

  const toggleApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer admin-demo-token'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchApiKeys();
      } else {
        alert('Error toggling API key: ' + data.error);
      }
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-demo-token'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchApiKeys();
      } else {
        alert('Error deleting API key: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newShowKeys = new Set(showKeys);
    if (newShowKeys.has(keyId)) {
      newShowKeys.delete(keyId);
    } else {
      newShowKeys.add(keyId);
    }
    setShowKeys(newShowKeys);
  };

  if (loading) {
    return <div className="p-8">Loading API keys...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Key className="h-8 w-8 mr-3 text-blue-600" />
            API Key Management
          </h1>
          <p className="text-gray-600 mt-2">Manage hardware device API keys for GPS integration</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Generate New Key
        </button>
      </div>

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">API Key Generated Successfully!</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your API Key (save this securely):
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono">
                  {generatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="btn-secondary p-2"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important Security Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This API key will only be shown once. Please save it securely. 
                    You'll need to include it in your hardware device requests.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">Integration Instructions:</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>Endpoint:</strong> <code>POST /api/hardware/gps</code></p>
                <p><strong>Header:</strong> <code>X-API-Key: {generatedKey}</code></p>
                <p><strong>Sample Payload:</strong></p>
                <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{JSON.stringify({
  latitude: 11.3410,
  longitude: 77.7172,
  speed: 35.5,
  heading: 90,
  fuel_level: 75.5,
  passenger_count: 23
}, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setGeneratedKey(null)}
              className="btn-primary w-full"
            >
              I've Saved the Key Securely
            </button>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Generate New API Key</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKey.key_name}
                  onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
                  className="input-modern"
                  placeholder="e.g., Bus-101-GPS-Device"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Bus
                </label>
                <select
                  value={newKey.bus_id}
                  onChange={(e) => setNewKey({ ...newKey, bus_id: e.target.value })}
                  className="input-modern"
                >
                  <option value="">Select a bus</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>
                      Bus #{bus.number} (Route {bus.route_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires In (Days)
                </label>
                <input
                  type="number"
                  value={newKey.expires_in_days || ''}
                  onChange={(e) => setNewKey({ 
                    ...newKey, 
                    expires_in_days: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="input-modern"
                  placeholder="Leave empty for no expiration"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createApiKey}
                disabled={!newKey.key_name || !newKey.bus_id}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="card-elevated">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Active API Keys ({apiKeys.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{key.key_name}</div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(key.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Bus #{key.buses.number}</div>
                    <div className="text-xs text-gray-500">Route {key.buses.route_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      key.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {key.usage_count} requests
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {key.last_used 
                      ? new Date(key.last_used).toLocaleString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleApiKey(key.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          key.is_active 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={key.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {apiKeys.length === 0 && (
          <div className="text-center py-12">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
            <p className="text-gray-500">Generate your first API key to start integrating hardware devices.</p>
          </div>
        )}
      </div>

      {/* Integration Guide */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hardware Integration Guide</h3>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900">1. GPS Data Endpoint</h4>
              <p>Send GPS coordinates to: <code className="bg-gray-100 px-2 py-1 rounded">POST /api/hardware/gps</code></p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">2. Authentication</h4>
              <p>Include your API key in the request header: <code className="bg-gray-100 px-2 py-1 rounded">X-API-Key: your-api-key</code></p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">3. Required Data</h4>
              <p>Minimum required fields: <code className="bg-gray-100 px-2 py-1 rounded">latitude</code>, <code className="bg-gray-100 px-2 py-1 rounded">longitude</code></p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">4. Optional Data</h4>
              <p>Additional fields: speed, heading, fuel_level, passenger_count, engine_temperature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};