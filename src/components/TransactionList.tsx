import { useState } from 'react';
import { supabase, Ingreso, Egreso } from '../lib/supabase';
import { Trash2, Calendar, Tag, CreditCard, Edit } from 'lucide-react';

interface TransactionListProps {
  ingresos: Ingreso[];
  egresos: Egreso[];
  onDelete: () => void;
  onEdit: (id: number, type: 'ingreso' | 'egreso') => void;
}

type Transaction = (Ingreso | Egreso) & { type: 'ingreso' | 'egreso' };

const ITEMS_PER_PAGE = 10;

export default function TransactionList({ ingresos, egresos, onDelete, onEdit }: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'ingreso' | 'egreso'>('all');

  const allTransactions: Transaction[] = [
    ...ingresos.map((i) => ({ ...i, type: 'ingreso' as const })),
    ...egresos.map((e) => ({ ...e, type: 'egreso' as const })),
  ].sort((a, b) => {
    const dateCompare = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    if (dateCompare !== 0) return dateCompare;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredTransactions =
    filter === 'all'
      ? allTransactions
      : allTransactions.filter((t) => t.type === filter);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleDelete = async (id: number, type: 'ingreso' | 'egreso') => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    const table = type === 'ingreso' ? 'ingresos' : 'egresos';
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (!error) {
      onDelete();
      if (paginatedTransactions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-100">Historial de Transacciones</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setFilter('all');
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                setFilter('ingreso');
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'ingreso'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => {
                setFilter('egreso');
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'egreso'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Egresos
            </button>
          </div>
        </div>
      </div>

      {paginatedTransactions.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-400">No hay transacciones registradas</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-800">
            {paginatedTransactions.map((transaction) => (
              <div
                key={`${transaction.type}-${transaction.id}`}
                className="p-4 sm:p-6 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'ingreso'
                              ? 'bg-emerald-900/50 text-emerald-400'
                              : 'bg-red-900/50 text-red-400'
                          }`}
                        >
                          {transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-100 break-words">
                          {transaction.descripcion}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{formatDate(transaction.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{transaction.categoria}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{transaction.metodo_pago}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xl sm:text-2xl font-bold whitespace-nowrap ${
                        transaction.type === 'ingreso' ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {transaction.type === 'ingreso' ? '+' : '-'}$
                      {Number(transaction.monto).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(transaction.id, transaction.type)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-gray-300 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id, transaction.type)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-sm rounded-lg transition-colors"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-400 text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-sm rounded-lg transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
