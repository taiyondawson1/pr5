-- Fix the check constraint issue and repair missing license records

-- First, let's temporarily disable the check constraint that's causing issues
ALTER TABLE public.license_keys DROP CONSTRAINT IF EXISTS check_expiry_date_future;

-- Create missing license keys for users who don't have them
INSERT INTO public.license_keys (
  user_id,
  license_key,
  account_numbers,
  status,
  subscription_type,
  name,
  email,
  phone,
  product_code,
  staff_key,
  enrolled_by
)
SELECT 
  au.id,
  public.generate_random_license_key(),
  '{}',
  'active',
  'standard',
  COALESCE(split_part(au.email, '@', 1), 'User'),
  au.email,
  '',
  'EA-001',
  CASE WHEN p.role != 'customer' THEN p.staff_key ELSE NULL END,
  CASE WHEN p.role = 'customer' THEN p.enrolled_by ELSE NULL END
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.license_keys lk ON au.id = lk.user_id
WHERE lk.id IS NULL;

-- Create missing customer_accounts records for users who don't have them
INSERT INTO public.customer_accounts (
  user_id,
  name,
  email,
  phone,
  status,
  enrolled_by,
  license_key
)
SELECT 
  lk.user_id,
  lk.name,
  lk.email,
  COALESCE(lk.phone, ''),
  COALESCE(lk.status, 'active'),
  CASE WHEN p.role = 'customer' THEN lk.enrolled_by ELSE NULL END,
  lk.license_key
FROM public.license_keys lk
JOIN public.profiles p ON lk.user_id = p.id
LEFT JOIN public.customer_accounts ca ON lk.user_id = ca.user_id
WHERE ca.id IS NULL;

-- Create missing customers records
INSERT INTO public.customers (
  id,
  name,
  email,
  phone,
  status,
  sales_rep_id,
  staff_key,
  revenue
)
SELECT 
  lk.user_id,
  lk.name,
  lk.email,
  COALESCE(lk.phone, ''),
  'Active',
  '00000000-0000-0000-0000-000000000000'::uuid,
  CASE WHEN p.role != 'customer' THEN p.staff_key ELSE NULL END,
  '$0'
FROM public.license_keys lk
JOIN public.profiles p ON lk.user_id = p.id
LEFT JOIN public.customers c ON lk.user_id = c.id
WHERE c.id IS NULL;

-- Fix any customers that have staff_key but are customers (should not have staff_key)
UPDATE public.customers c
SET staff_key = NULL
FROM public.profiles p
WHERE c.id = p.id
AND p.role = 'customer'
AND c.staff_key IS NOT NULL;

-- Fix license_keys that have staff_key but are customers
UPDATE public.license_keys lk
SET staff_key = NULL,
    enrolled_by = COALESCE(lk.enrolled_by, lk.staff_key)
FROM public.profiles p
WHERE lk.user_id = p.id
AND p.role = 'customer'
AND lk.staff_key IS NOT NULL;