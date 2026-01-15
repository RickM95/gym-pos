import { UserRole } from "../services/authService";

export interface KBArticle {
    id: string;
    title: string;
    category: 'Getting Started' | 'Daily Operations' | 'Membership Management' | 'Fitness & Training' | 'System & Security' | 'Tech Maintenance';
    content: string;
    restrictedTo?: UserRole[]; // If undefined, accessible to all staff
}

export const KB_DATA: KBArticle[] = [
    // --- Getting Started ---
    {
        id: 'gs-01',
        title: 'System Access & Roles',
        category: 'Getting Started',
        content: `
### User Roles & PINs
The Spartan Gym Platform uses a PIN-based login system. Each role has specific permissions:

- **Admin (0000)**: Full control over settings, revenue, and staff management.
- **Head Trainer (1111)**: Manages workout programs and client progress.
- **Front Desk / Staff (2222, 4444)**: Handles check-ins, new member registration, and basic payments.
- **Member (3333)**: Kiosk mode for self-service check-in and workout tracking.
- **Tech Support (9999)**: Specialized role for maintenance.

### Logging In
1. Enter your 4-digit PIN.
2. **Desktop**: Press **Enter** or click "Unlock System".
3. **Mobile**: The system will automatically unlock once the 4th digit is entered.
        `
    },
    {
        id: 'gs-02',
        title: 'Offline Mode',
        category: 'Getting Started',
        content: `
### Works Everywhere
This platform is designed to work **100% Offline**. You can continue to:
- Check-in members
- Create new clients
- Log workouts
- View limited reports

### Synchronization
When your device reconnects to the internet, all locally saved actions are automatically synced to the cloud. Look for the **Sync Status** indicator in the top right corner:
- **Green**: All data synced.
- **Yellow**: Sync in progress.
- **Red/Gray**: Offline (Data saved locally).
        `
    },

    // --- Daily Operations ---
    {
        id: 'ops-01',
        title: 'Member Check-in Process',
        category: 'Daily Operations',
        content: `
### QR Code Scanning
1. Go to the **Quick Check-In** page (or click Scan QR).
2. Scan the member's digital card.
3. The system will instanty validate their subscription.

### Manual Check-in
1. Go to **Clients**.
2. Search for the member by name.
3. Open their profile and click **"Check In"**.

**Validation Rules:**
- **Green Tick**: Access Granted (Active Subscription).
- **Red X**: Access Denied (Expired or No Subscription).
        `
    },
    {
        id: 'ops-02',
        title: 'Reporting Bugs',
        category: 'Daily Operations',
        content: `
### Something went wrong?
If you encounter an error or a glitch:
1. Click the **Red Bug Icon** in the bottom left corner of the screen.
2. Describe what you were doing when the error occurred.
3. Click **Submit**.

Our Tech Support team (\`9999\`) will receive the log instantly.
        `
    },

    // --- Membership Management ---
    {
        id: 'mem-01',
        title: 'Creating New Plans',
        category: 'Membership Management',
        content: `
### Plan Configuration
Admins and Managers can create new subscription tiers:
1. Navigate to **Plans**.
2. Click **Create Plan**.
3. Set the **Name** (e.g., "Platinum monthly"), **Price**, and **Duration** (in days).
        `
    },
    {
        id: 'mem-02',
        title: 'Registering New Clients',
        category: 'Membership Management',
        content: `
### Registration Steps
1. Go to **New Client**.
2. Enter Name, Email, and Phone.
3. The system generates a unique **QR Code** automatically.
4. (Optional) Assign an initial **Subscription Plan** immediately.
        `
    },

    // --- Fitness ---
    {
        id: 'fit-01',
        title: 'Workout Builder',
        category: 'Fitness & Training',
        content: `
### Creating Programs
Trainers can build reusable workout templates:
1. Go to **Workouts**.
2. Click **Create Workout**.
3. Add exercises from the library (select Sets/Reps).
4. Save the workout.

### Assigning to Clients
_(Coming Soon)_: You will be able to push these workouts directly to a client's "My Program" dashboard.
        `
    },

    // --- Security ---
    {
        id: 'sec-01',
        title: 'Auto-Lock Security',
        category: 'System & Security',
        content: `
### Automatic Protection
To protect member data, the system automatically locks after **5 minutes** of inactivity.

- **Lock Screen**: A blurred overlay hides all information.
- **Unlocking**: Simply re-enter **YOUR** PIN.
- **Restrictions**: 
  - Only the user who was logged in can unlock the session.
  - If a different user needs to use the terminal, they must refresh the page to Log Out fully.
        `
    },

    // --- TECH ONLY ---
    {
        id: 'tech-01',
        title: 'System Logs & Diagnostics',
        category: 'Tech Maintenance',
        restrictedTo: ['TECH'],
        content: `
### Accessing Logs
1. Login as **Tech (9999)**.
2. Click the **System Logs** card on the dashboard (Green Bug Icon).
3. View all **Errors** and **Bug Reports** sorted by timestamp.

### Log Details
- **Type**: ERROR (Crash) or BUG_REPORT (Manual).
- **User**: Who triggered it.
- **Stack Trace**: Technical details for debugging.
        `
    },
    {
        id: 'tech-02',
        title: 'Database & Sync Internals',
        category: 'Tech Maintenance',
        restrictedTo: ['TECH'],
        content: `
### IndexedDB Structure
The system uses \`idb\` with the following stores:
- \`clients\`: Member data.
- \`logs\`: Error tracking (Tech only).
- \`workout_assignments\`: Linking tables.

### Sync Debugging
If sync fails:
1. Check the **Event Queue** size in the Local Storage console.
2. Ensure the \`synced\` flag is 0 for pending items.
3. Connectivity status is managed by \`navigator.onLine\`.
        `
    }
];
