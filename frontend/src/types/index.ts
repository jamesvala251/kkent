export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  total?: number;
  current_page?: number;
  last_page?: number;
}

export interface Customer {
  id: number;
  name: string;
  company_name?: string;
  gst_number?: string;
  contact_person?: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  credit_limit?: number;
  payment_terms?: string;
  status: string;
}

export interface Driver {
  id: number;
  name: string;
  photo?: string;
  mobile: string;
  address?: string;
  aadhaar?: string;
  license_number?: string;
  license_expiry?: string;
  joining_date?: string;
  salary_type?: string;
  monthly_salary?: number;
  per_trip_salary?: number;
  bank_name?: string;
  bank_account?: string;
  bank_ifsc?: string;
  emergency_contact?: string;
  assigned_truck_id?: number | null;
  assigned_truck?: Truck;
  status: string;
}

export interface Truck {
  id: number;
  truck_number: string;
  rc_number?: string;
  insurance_expiry?: string;
  fitness_expiry?: string;
  permit_expiry?: string;
  puc_expiry?: string;
  tax_expiry?: string;
  model?: string;
  brand?: string;
  year?: number;
  capacity?: string;
  owner?: string;
  fuel_type?: string;
  gps_number?: string;
  current_km?: number;
  status: string;
}

export interface HitachiMachine {
  id: number;
  machine_number: string;
  registration_number?: string;
  model?: string;
  owner?: string;
  engine_number?: string;
  chassis_number?: string;
  purchase_date?: string;
  current_hours?: number;
  current_km?: number;
  fuel_type?: string;
  bucket_capacity?: string;
  hourly_rate?: number;
  daily_rate?: number;
  monthly_rate?: number;
  status: string;
  active_rental?: HitachiRental;
}

export interface HitachiRental {
  id: number;
  rental_number: string;
  hitachi_id: number;
  customer_id: number;
  site_location?: string;
  billing_type: 'hourly' | 'daily' | 'monthly';
  start_date: string;
  end_date?: string;
  hours?: number;
  days?: number;
  months?: number;
  rate: number;
  total_amount: number;
  advance_received?: number;
  balance?: number;
  operator_name?: string;
  status: string;
  notes?: string;
  hitachi?: HitachiMachine;
  customer?: Customer;
}

export interface HitachiSummary {
  total_machines: number;
  on_rent: number;
  active_rentals: number;
  monthly_revenue: number;
  pending_balance: number;
}

export interface Trip {
  id: number;
  trip_number: string;
  customer_id: number;
  truck_id: number;
  driver_id: number;
  hitachi_id?: number;
  start_date: string;
  end_date?: string;
  from_location: string;
  to_location: string;
  material?: string;
  weight?: number;
  start_km?: number;
  end_km?: number;
  total_km?: number;
  diesel_qty?: number;
  diesel_rate?: number;
  diesel_amount?: number;
  toll?: number;
  maintenance?: number;
  other_expense?: number;
  driver_salary?: number;
  total_expense?: number;
  freight?: number;
  total_freight?: number;
  advance_received?: number;
  balance?: number;
  profit?: number;
  compressor?: boolean;
  remarks?: string;
  status: string;
  customer?: Customer;
  truck?: Truck;
  driver?: Driver;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface DieselSummary {
  total_in: number;
  total_out: number;
  stock_balance: number;
  total_expense: number;
}

export interface DieselPurchase {
  id: number;
  purchase_date: string;
  supplier?: string;
  bill_number?: string;
  quantity: number;
  remaining_quantity: number;
  rate_per_liter: number;
  total_amount: number;
  expense_id?: number | null;
  expense?: Expense;
  notes?: string;
}

export interface DieselIssue {
  id: number;
  issue_date: string;
  quantity: number;
  rate_per_liter: number;
  total_amount: number;
  truck_id?: number | null;
  hitachi_id?: number | null;
  trip_id?: number | null;
  diesel_purchase_id?: number | null;
  purchase_allocations?: { purchase_id: number; quantity: number }[];
  truck?: Truck;
  hitachi?: HitachiMachine;
  trip?: Trip;
  diesel_purchase?: DieselPurchase;
  notes?: string;
}

export interface DieselLedgerEntry {
  id: number;
  type: 'in' | 'out';
  date: string;
  quantity: number;
  rate_per_liter: number;
  total_amount: number;
  reference: string;
  vehicle?: string | null;
  remaining_quantity?: number | null;
  expense_id?: number | null;
}

export interface Expense {
  id: number;
  expense_date: string;
  category_id: number;
  category?: ExpenseCategory;
  truck_id?: number | null;
  driver_id?: number | null;
  trip_id?: number | null;
  truck?: Truck;
  driver?: Driver;
  trip?: Trip;
  amount: number;
  description?: string;
  bill_path?: string | null;
}

export interface Salary {
  id: number;
  driver_id: number;
  month: number;
  year: number;
  salary_type: 'monthly' | 'trip' | 'advance' | 'bonus' | 'penalty' | 'overtime';
  base_amount: number;
  bonus?: number;
  penalty?: number;
  overtime?: number;
  advance_deduction?: number;
  net_amount: number;
  payment_status: 'pending' | 'paid' | 'partial';
  paid_date?: string | null;
  remarks?: string;
  driver?: Driver;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  trip_id?: number | null;
  hitachi_rental_id?: number | null;
  invoice_date: string;
  due_date?: string | null;
  subtotal: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
  paid_amount?: number;
  notes?: string;
  customer?: Customer;
  trip?: Trip;
  hitachi_rental?: HitachiRental;
}

export interface DashboardStats {
  total_trips: number;
  active_trucks: number;
  total_revenue: number;
  total_profit: number;
  pending_invoices: number;
  active_drivers: number;
}

export interface Role {
  id: number;
  name: string;
  permissions?: string[];
  permissions_count?: number;
  users_count?: number;
  created_at?: string;
}

export interface PermissionAction {
  key: string;
  label: string;
}

export interface PermissionGroup {
  module: string;
  label: string;
  permissions: Record<string, string>;
}

export interface PermissionsResponse {
  actions: PermissionAction[];
  groups: PermissionGroup[];
}
