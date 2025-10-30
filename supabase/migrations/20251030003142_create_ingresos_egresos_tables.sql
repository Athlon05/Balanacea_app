/*
  # Create Income and Expense Tracking Tables

  1. New Tables
    - `ingresos` (income)
      - `id` (bigint, primary key, auto-increment)
      - `descripcion` (text) - Description of the income
      - `monto` (numeric) - Amount of money
      - `fecha` (date) - Date of transaction
      - `categoria` (text) - Category classification
      - `metodo_pago` (text) - Payment method
      - `usuario_id` (uuid) - Reference to auth user
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `egresos` (expenses)
      - `id` (bigint, primary key, auto-increment)
      - `descripcion` (text) - Description of the expense
      - `monto` (numeric) - Amount of money
      - `fecha` (date) - Date of transaction
      - `categoria` (text) - Category classification
      - `metodo_pago` (text) - Payment method
      - `usuario_id` (uuid) - Reference to auth user
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - View only their own records (SELECT)
      - Insert their own records (INSERT)
      - Update their own records (UPDATE)
      - Delete their own records (DELETE)
    
  3. Indexes
    - Add indexes on `usuario_id` for faster queries
    - Add indexes on `fecha` for date-based filtering
*/

-- Create ingresos table
CREATE TABLE IF NOT EXISTS ingresos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  descripcion text NOT NULL,
  monto numeric NOT NULL CHECK (monto >= 0),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  categoria text NOT NULL,
  metodo_pago text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create egresos table
CREATE TABLE IF NOT EXISTS egresos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  descripcion text NOT NULL,
  monto numeric NOT NULL CHECK (monto >= 0),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  categoria text NOT NULL,
  metodo_pago text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ingresos
CREATE POLICY "Users can view own income records"
  ON ingresos FOR SELECT
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own income records"
  ON ingresos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own income records"
  ON ingresos FOR UPDATE
  TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own income records"
  ON ingresos FOR DELETE
  TO authenticated
  USING (auth.uid() = usuario_id);

-- RLS Policies for egresos
CREATE POLICY "Users can view own expense records"
  ON egresos FOR SELECT
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own expense records"
  ON egresos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own expense records"
  ON egresos FOR UPDATE
  TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own expense records"
  ON egresos FOR DELETE
  TO authenticated
  USING (auth.uid() = usuario_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingresos_usuario_id ON ingresos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_egresos_usuario_id ON egresos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha DESC);