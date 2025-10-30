import { useState, useEffect } from 'react';
import { supabase, Ingreso, Egreso } from '../lib/supabase';
import { LogOut, Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [editingTransaction, setEditingTransaction] = useState<{id: number, type: 'ingreso' | 'egreso'} | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ingresosRes, egresosRes] = await Promise.all([
        supabase
          .from('ingresos')
          .select('*')
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('egresos')
          .select('*')
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false }),
      ]);

      if (ingresosRes.data) setIngresos(ingresosRes.data);
      if (egresosRes.data) setEgresos(egresosRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const totalIngresos = ingresos.reduce((sum, item) => sum + Number(item.monto), 0);
  const totalEgresos = egresos.reduce((sum, item) => sum + Number(item.monto), 0);
  const balance = totalIngresos - totalEgresos;

  const openForm = (type: 'ingreso' | 'egreso') => {
    setEditingTransaction(null);
    setFormType(type);
    setShowForm(true);
  };

  const openEditForm = (id: number, type: 'ingreso' | 'egreso') => {
    setEditingTransaction({ id, type });
    setFormType(type);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-100">Control Financiero</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 text-gray-300 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-900 border border-emerald-800 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs sm:text-sm font-medium">Total Ingresos</span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-500">
              ${totalIngresos.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-900 border border-red-800 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs sm:text-sm font-medium">Total Egresos</span>
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-500">
              ${totalEgresos.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6 sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs sm:text-sm font-medium">Balance</span>
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => openForm('ingreso')}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Agregar Ingreso</span>
          </button>
          <button
            onClick={() => openForm('egreso')}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Agregar Egreso</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Cargando...</p>
          </div>
        ) : (
          <TransactionList ingresos={ingresos} egresos={egresos} onDelete={fetchData} onEdit={openEditForm} />
        )}
      </main>

      {showForm && (
        <TransactionForm
          type={formType}
          editingId={editingTransaction?.id}
          editingType={editingTransaction?.type}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
