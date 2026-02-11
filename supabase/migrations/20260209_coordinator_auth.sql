-- 1. Update users table to support departments
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- 2. Add COORDENADOR role validation (assuming role is a text column)
-- If it's a native enum, it would need ALTER TYPE, but based on code it's text.
-- We can add a check constraint if needed.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE', 'COORDENADOR'));

-- 3. Enable RLS on core tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.justifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy for Employees
-- Admins and Managers see everything
-- Coordenadores see only their department
-- Employees see only themselves (if applicable, but requirement says Coordenador is the focus)

DROP POLICY IF EXISTS "Coordinators can view departmental employees" ON public.employees;
CREATE POLICY "Coordinators can view departmental employees" ON public.employees
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'COORDENADOR' AND 
  department = (SELECT name FROM public.departments WHERE id = (SELECT department_id FROM public.users WHERE id = auth.uid()))
);

-- Note: employees table uses 'department' as a string (name), not ID, based on DataService loadEmployees.
-- This policy assumes the 'department' column in 'employees' matches the 'name' in 'departments'.

-- 5. RLS Policy for Attendance Records
DROP POLICY IF EXISTS "Coordinators can manage departmental attendance" ON public.attendance_records;
CREATE POLICY "Coordinators can manage departmental attendance" ON public.attendance_records
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'COORDENADOR' AND
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.users u ON u.id = auth.uid()
    JOIN public.departments d ON d.id = u.department_id
    WHERE e.id = public.attendance_records.employee_id
    AND e.department = d.name
  )
);

-- 6. RLS Policy for Justifications
DROP POLICY IF EXISTS "Coordinators can manage departmental justifications" ON public.justifications;
CREATE POLICY "Coordinators can manage departmental justifications" ON public.justifications
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'COORDENADOR' AND
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.users u ON u.id = auth.uid()
    JOIN public.departments d ON d.id = u.department_id
    WHERE e.id = public.justifications.employee_id
    AND e.department = d.name
  )
);

-- 7. Secure User Creation
-- Ensure only ADMIN/MANAGER can create users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage users" ON public.users
FOR ALL
USING (auth.jwt() ->> 'role' IN ('ADMIN', 'MANAGER'));

-- Default select for own user
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT
USING (auth.uid() = id);
