# PULSE - Public Unified Local Health Engine

**PULSE** is a web-based health information system designed for Barangay Health Workers (BHWs) in the Philippines. It prioritizes residents based on health risks (age, pregnancy, chronic conditions) to help BHWs manage their visitation schedules efficiently.

## Features

*   **Dashboard**: Real-time stats on Resident interactions and Risk Distribution.
*   **Resident Management**: CRUD operations for resident profiles with "Risk Badges" (High/Medium/Low).
*   **Visits Logging**: Track home visits, notes, and follow-up requirements.
*   **AI Risk Prioritization**: Automated risk scoring based on weighted factors (Age > 60, Pregnancy, Missed Visits, etc.).
*   **Reports Generator**: Export data to CSV (High Risk Lists, Visit Logs, Demographics).
*   **Role-Based Access Control**: Separate 'Admin' and 'BHW' roles. Admins can configure risk weights and system settings.

## Tech Stack

*   **Frontend**: React (Vite) + TypeScript
*   **Styling**: Tailwind CSS
*   **Backend / DB**: Supabase (PostgreSQL + Auth)
*   **Icons**: Lucide-React

## Setup Instructions

### 1. Prerequisites
*   Node.js (v18+)
*   Supabase Account

### 2. Environment Variables
Copy the `.env.example` file to `.env` and fill in your Supabase credentials.

```bash
cp .env.example .env
```

**Required Variables**:
*   `VITE_SUPABASE_URL`: Your Supabase Project URL
*   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon API Key

### 3. Database Setup
Run the SQL definitions found in `database_schema.sql` in your Supabase SQL Editor.
This supports:
*   Residents & Visits Tables
*   RLS Policies
*   User Roles (RBAC)
*   Organization Settings

### 4. Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Administration (Roles)

By default, new users are assigned the **'bhw'** role.
To grant **'admin'** privileges (which allow changing Risk Weights and Barangay Settings):

1.  Go to Supabase Dashboard > Authentication > Users to get the `User UID`.
2.  Run the following SQL:
    ```sql
    INSERT INTO user_roles (user_id, role) VALUES ('<USER_UID>', 'admin');
    ```

## License
MIT
