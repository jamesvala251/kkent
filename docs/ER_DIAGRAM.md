# KK Enterprise ERP - Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ audit_logs : creates
    users ||--o{ user_activity_logs : has
    users }o--|| roles : has

    customers ||--o{ trips : books
    customers ||--o{ invoices : receives

    trucks ||--o{ trips : assigned
    trucks ||--o{ expenses : incurs
    trucks ||--o{ maintenance_records : requires
    trucks ||--o{ documents : has

    drivers ||--o{ trips : drives
    drivers ||--o{ salaries : earns
    drivers ||--o{ salary_advances : takes
    drivers ||--o{ driver_leaves : requests
    drivers ||--o{ documents : has
    drivers }o--o| trucks : assigned

    hitachi_machines ||--o{ trips : optional
    hitachi_machines ||--o{ maintenance_records : requires
    hitachi_machines ||--o{ documents : has

    trips ||--o| invoices : generates
    trips ||--o{ expenses : includes

    expense_categories ||--o{ expenses : categorizes

    users {
        bigint id PK
        string name
        string email
        string phone
        string photo
        enum status
    }

    customers {
        bigint id PK
        string name
        string company_name
        string gst_number
        string mobile
        decimal credit_limit
        enum status
    }

    trucks {
        bigint id PK
        string truck_number UK
        string rc_number
        date insurance_expiry
        date permit_expiry
        decimal current_km
        enum status
    }

    drivers {
        bigint id PK
        string name
        string mobile
        string license_number
        date license_expiry
        decimal monthly_salary
        bigint assigned_truck_id FK
        enum status
    }

    hitachi_machines {
        bigint id PK
        string machine_number UK
        string model
        decimal current_hours
        enum status
    }

    trips {
        bigint id PK
        string trip_number UK
        bigint customer_id FK
        bigint truck_id FK
        bigint driver_id FK
        bigint hitachi_id FK
        date start_date
        date end_date
        decimal total_km
        decimal diesel_amount
        decimal total_expense
        decimal freight
        decimal profit
        enum status
    }

    expenses {
        bigint id PK
        date expense_date
        bigint category_id FK
        bigint truck_id FK
        decimal amount
    }

    salaries {
        bigint id PK
        bigint driver_id FK
        int month
        int year
        decimal net_amount
        enum payment_status
    }

    invoices {
        bigint id PK
        string invoice_number UK
        bigint customer_id FK
        bigint trip_id FK
        decimal total_amount
        enum payment_status
    }

    maintenance_records {
        bigint id PK
        enum vehicle_type
        bigint vehicle_id
        date service_date
        decimal cost
        enum status
    }

    documents {
        bigint id PK
        string documentable_type
        bigint documentable_id
        string type
        string file_path
        date expiry_date
    }
```

## Key Relationships

- **Trips** are the central business entity linking customers, trucks, drivers, and optionally Hitachi machines
- **Documents** use polymorphic relations for trucks, drivers, Hitachi, and customers
- **Maintenance** uses polymorphic vehicle_type + vehicle_id for trucks and Hitachi
- All main entities include audit columns: `created_by`, `updated_by`, `deleted_by` with soft deletes
