import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Ingreso {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: string;
  metodo_pago: string;
  usuario_id: string;
  created_at: string;
}

export interface Egreso {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: string;
  metodo_pago: string;
  usuario_id: string;
  created_at: string;
}
