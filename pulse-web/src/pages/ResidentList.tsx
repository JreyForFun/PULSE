import { useState, useEffect } from 'react';
import { Search, Plus, AlertCircle, Loader2, LayoutGrid, List, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ResidentCard from '../components/ResidentCard';
import Button from '../components/ui/Button';
import RiskBadge from '../components/RiskBadge';
import type { Resident } from '../types';
import { residentsService } from '../services/residentsService';

export default function ResidentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const navigate = useNavigate();

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    try {
      setIsLoading(true);
      const data = await residentsService.getAll();
      setResidents(data);
    } catch (err: any) {
      console.error('Failed to load residents:', err);
      setError('Failed to load residents. Please make sure Supabase is connected.');
    } finally {
      setIsLoading(false);
    }
  };

  const [riskFilter, setRiskFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');

  const filteredResidents = residents.filter(resident => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${resident.first_name} ${resident.last_name}`.toLowerCase();
    const address = resident.address.toLowerCase();
    const matchesSearch = fullName.includes(searchLower) || resident.id.toLowerCase().includes(searchLower) || address.includes(searchLower);

    // Risk Filter
    const matchesRisk = riskFilter === 'All' || resident.risk_level === riskFilter;

    // Category Filter
    let matchesCat = true;
    if (catFilter === 'Senior') matchesCat = resident.is_senior;
    if (catFilter === 'PWD') matchesCat = resident.is_pwd;
    if (catFilter === 'Pregnant') matchesCat = resident.is_pregnant;
    if (catFilter === 'Child') matchesCat = resident.is_child;

    return matchesSearch && matchesRisk && matchesCat;
  });

  // Sort by Risk Level (High -> Medium -> Low)
  const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
  filteredResidents.sort((a, b) => riskOrder[b.risk_level] - riskOrder[a.risk_level]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading residents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-600 max-w-md mb-6">{error}</p>
        <Button onClick={loadResidents}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resident Registry</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor resident health status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 sm:flex-none">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="p-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="All">All Risks</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          <select
            className="p-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="All">All Cats</option>
            <option value="Senior">Senior</option>
            <option value="PWD">PWD</option>
            <option value="Pregnant">Pregnant</option>
            <option value="Child">Child</option>
          </select>

          <Link to="/dashboard/residents/add">
            <Button icon={<Plus className="w-4 h-4" />}>Add</Button>
          </Link>
        </div>
      </div>

      {filteredResidents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No residents found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or add a new resident.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResidents.map(resident => (
                <ResidentCard
                  key={resident.id}
                  resident={resident}
                  onClick={() => navigate(`/dashboard/residents/${resident.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demographics</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResidents.map(resident => (
                    <tr
                      key={resident.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/dashboard/residents/${resident.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {resident.first_name[0]}{resident.last_name[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{resident.last_name}, {resident.first_name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-[150px]">{resident.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.age} y/o</div>
                        <div className="text-sm text-gray-500">{resident.sex}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {resident.is_senior && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">Senior</span>}
                          {resident.is_pwd && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">PWD</span>}
                          {resident.is_pregnant && <span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded">Preg</span>}
                          {resident.is_child && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">Child</span>}
                          {!resident.is_senior && !resident.is_pwd && !resident.is_pregnant && !resident.is_child && <span className="text-gray-400 text-xs">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RiskBadge level={resident.risk_level} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resident.last_visit ? new Date(resident.last_visit).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
