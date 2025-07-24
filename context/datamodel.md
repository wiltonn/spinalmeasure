erDiagram
    INSTITUTION {
        UUID id PK
        string name
        string address
        timestamptz created_at
    }

    APP_USER {
        UUID id PK
        UUID institution_id FK
        citext email "unique"
        text password_hash
        string first_name
        string last_name
        enum role "admin | radiologist | clinician | researcher | viewer"
        bool mfa_enabled
        bool is_active
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    PATIENT {
        UUID id PK
        UUID institution_id FK
        string mrn "medical-record # (unique per institution)"
        string first_name
        string last_name
        date date_of_birth
        enum sex "male | female | other | unknown"
        string primary_language
        bool  is_deceased
        date  date_of_death
        timestamptz created_at
        timestamptz updated_at
    }

    PATIENT_USER_ACCESS {
        UUID id PK
        UUID user_id FK
        UUID patient_id FK
        enum access_level "owner | read | write"
        timestamptz created_at
    }

    INSTITUTION ||--o{ APP_USER           : employs
    INSTITUTION ||--o{ PATIENT            : cares_for
    APP_USER    ||--o{ PATIENT_USER_ACCESS: has
    PATIENT     ||--o{ PATIENT_USER_ACCESS: "viewed by"
