import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface TransactionFormProps {
  type: 'ingreso' | 'egreso';
  editingId?: number;
  editingType?: 'ingreso' | 'egreso';
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIAS_INGRESO = ['Salario', 'Freelance', 'Inversiones', 'Ventas', 'Otro'];
const CATEGORIAS_EGRESO = ['Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud', 'Otro'];
const METODOS_PAGO = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Otro'];

export default function TransactionForm({ type, editingId, editingType, onClose, onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentType, setCurrentType] = useState(type);
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    categoria: '',
    metodo_pago: '',
  });

  const categorias = currentType === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  useEffect(() => {
    if (editingId && editingType) {
      loadTransaction();
    }
  }, [editingId, editingType]);

  const loadTransaction = async () => {
    if (!editingId || !editingType) return;

    setLoading(true);
    try {
      const table = editingType === 'ingreso' ? 'ingresos' : 'egresos';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', editingId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          descripcion: data.descripcion,
          monto: data.monto.toString(),
          fecha: data.fecha,
          categoria: data.categoria,
          metodo_pago: data.metodo_pago,
        });
        setCurrentType(editingType);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const transactionData = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        categoria: formData.categoria,
        metodo_pago: formData.metodo_pago,
        usuario_id: user.id,
      };

      if (editingId && editingType) {
        if (currentType !== editingType) {
          const oldTable = editingType === 'ingreso' ? 'ingresos' : 'egresos';
          const newTable = currentType === 'ingreso' ? 'ingresos' : 'egresos';

          const { error: deleteError } = await supabase
            .from(oldTable)
            .delete()
            .eq('id', editingId);

          if (deleteError) throw deleteError;

          const { error: insertError } = await supabase
            .from(newTable)
            .insert([transactionData]);

          if (insertError) throw insertError;
        } else {
          const table = currentType === 'ingreso' ? 'ingresos' : 'egresos';
          const { error: updateError } = await supabase
            .from(table)
            .update(transactionData)
            .eq('id', editingId);

          if (updateError) throw updateError;
        }
      } else {
        const table = currentType === 'ingreso' ? 'ingresos' : 'egresos';
        const { error: insertError } = await supabase
          .from(table)
          .insert([transactionData]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-800 my-8">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
          <h2 className="text-lg sm:text-xl font-bold text-gray-100">
            {editingId ? 'Editar Transacción' : currentType === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Transacción
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentType('ingreso');
                    setFormData({ ...formData, categoria: '' });
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentType === 'ingreso'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentType('egreso');
                    setFormData({ ...formData, categoria: '' });
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentType === 'egreso'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Egreso
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej: Pago de servicios"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoría
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seleccionar...</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Método de Pago
            </label>
            <select
              value={formData.metodo_pago}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seleccionar...</option>
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 ${
                currentType === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors`}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
