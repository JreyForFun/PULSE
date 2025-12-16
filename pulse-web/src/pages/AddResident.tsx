import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, AlertCircle, Loader2, ArrowLeft, User as UserIcon, MapPin, Hash } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { residentsService } from '../services/residentsService';

// Vulnerability Categories
const CATEGORIES = [
  { id: 'is_senior', label: 'Senior Citizen (60+)' },
  { id: 'is_pwd', label: 'Person with Disability (PWD)' },
  { id: 'is_pregnant', label: 'Pregnant' },
  { id: 'is_child', label: 'Child (0-5)' },
];

const CHRONIC_CONDITIONS = [
  'Hypertension', 'Diabetes', 'Tuberculosis', 'Asthma', 'Cardiovascular Disease'
];

export default function AddResident() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    birthdate: '',
    age: '',
    sex: 'Male',
    address: '',
    barangay_zone: '',
    is_senior: false,
    is_pwd: false,
    is_pregnant: false,
    is_child: false,
    conditions: [] as string[],
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadResident(id);
    }
  }, [isEditMode, id]);

  const loadResident = async (residentId: string) => {
    try {
      setIsLoading(true);
      const resident = await residentsService.getById(residentId);
      if (resident) {
        setFormData({
          first_name: resident.first_name,
          last_name: resident.last_name,
          middle_name: resident.middle_name || '',
          birthdate: resident.birthdate || '',
          age: resident.age.toString(),
          sex: resident.sex,
          address: resident.address,
          barangay_zone: resident.barangay_zone || '',
          is_senior: resident.is_senior,
          is_pwd: resident.is_pwd,
          is_pregnant: resident.is_pregnant,
          is_child: resident.is_child,
          conditions: resident.conditions || [],
        });
      }
    } catch (err) {
      console.error("Failed to load resident", err);
      setError("Failed to load resident details.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Auto-calculate age if birthdate changes
    if (name === 'birthdate') {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, [name]: value, age: age.toString() }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleConditionToggle = (condition: string) => {
    setFormData(prev => {
      const exists = prev.conditions.includes(condition);
      return {
        ...prev,
        conditions: exists
          ? prev.conditions.filter(c => c !== condition)
          : [...prev.conditions, condition]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age) || 0,
        sex: formData.sex as 'Male' | 'Female',
      };

      if (isEditMode && id) {
        await residentsService.update(id, payload);
      } else {
        await residentsService.create(payload);
      }

      navigate('/dashboard/residents');
    } catch (err: any) {
      console.error("Error saving resident:", err);
      setError(err.message || "Failed to save resident.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Resident Profile' : 'Register New Resident'}</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        {/* Personal Information */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              icon={<UserIcon className="w-4 h-4" />}
            />
            <Input
              label="Middle Name"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              icon={<UserIcon className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Birthdate"
              type="date"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
              required
            />
            <Input
              label="Age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              icon={<Hash className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="Male"
                  checked={formData.sex === 'Male'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="Female"
                  checked={formData.sex === 'Female'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Female</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address (Street/Block)"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              icon={<MapPin className="w-4 h-4" />}
            />
            <Input
              label="Barangay Zone / Purok"
              name="barangay_zone"
              value={formData.barangay_zone}
              onChange={handleChange}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* Vulnerability Categories */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Vulnerability Categories</h2>
          <div className="space-y-3">
            {CATEGORIES.map(cat => (
              <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name={cat.id}
                  checked={(formData as any)[cat.id]}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 font-medium">{cat.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Chronic Conditions */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Chronic Health Conditions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHRONIC_CONDITIONS.map(cond => (
              <label key={cond} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.conditions.includes(cond)}
                  onChange={() => handleConditionToggle(cond)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{cond}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex gap-4 pt-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/residents')}>
            Cancel
          </Button>
          <Button type="submit" icon={<Save className="w-4 h-4" />} disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditMode ? 'Update Resident' : 'Register Resident')}
          </Button>
        </div>
      </form>
    </div>
  );
}
