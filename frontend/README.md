# SQL Runner Frontend

Modern Next.js 16 frontend for SQL query execution with real-time results and beautiful UI.

## Features

- **Modern UI/UX** with Tailwind CSS 4
- **Dark/Light Theme** with smooth transitions
- **Responsive Design** - Mobile, tablet, and desktop
- **Real-time Query Execution** with loading states
- **Database Explorer** - Browse tables, schemas, and sample data
- **Query History** - Search, filter, and copy past queries
- **Keyboard Shortcuts** - Ctrl+Enter to execute queries
- **Resizable Editor** - Adjust query editor height
- **Authentication** - Secure login and registration
- **Animations** - Smooth transitions and micro-interactions

## Tech Stack

- **Framework**: Next.js 16.0.0 (React 19.2.0)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Language**: JavaScript with TypeScript support

## Setup

### Prerequisites
- Node.js 20.x or higher
- npm or yarn

### Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

4. Run development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```


## Project Structure

```
frontend/
├── app/
│   ├── dashboard/          # Main dashboard page
│   │   └── page.js
│   ├── login/              # Login page
│   │   └── page.js
│   ├── signup/             # Registration page
│   │   └── page.js
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Home (redirects to login/dashboard)
│   └── globals.css         # Global styles
├── components/
│   ├── QueryEditor.js      # SQL query editor with syntax highlighting
│   ├── ResultsTable.js     # Query results display
│   ├── TablesSidebar.js    # Database tables explorer
│   ├── QueryHistory.js     # Query history panel
│   └── ThemeToggle.js      # Dark/light theme switcher
├── contexts/
│   └── ThemeContext.js     # Theme management context
├── lib/
│   └── api.js              # API client with axios interceptors
└── public/                 # Static assets
```

## Pages

### Home (`/`)
- Redirects to `/login` if not authenticated
- Redirects to `/dashboard` if authenticated

### Login (`/login`)
- User authentication
- Demo credentials displayed
- Registration link
- Success message after signup

### Signup (`/signup`)
- User registration
- Password strength indicator
- Form validation
- Auto-redirect to login on success

### Dashboard (`/dashboard`)
- Query editor with syntax highlighting
- Results table with formatted data
- Tables sidebar with schema info
- Query history with search/filter
- Theme toggle
- Responsive sidebars

## Components

### QueryEditor
- Resizable text area
- Keyboard shortcuts (Ctrl+Enter)
- Tab support for indentation
- Character count
- Maximize/minimize toggle
- Query execution with loading state

### ResultsTable
- Formatted table display
- Responsive (table on desktop, cards on mobile)
- Success/error/empty states
- Execution time display
- NULL value handling

### TablesSidebar
- List of all tables
- Expandable table details
- Schema with column types
- Primary key indicators
- Sample data preview (5 rows)
- Refresh button
- Auto-refresh after DDL operations

### QueryHistory
- Persistent history from database
- Search functionality
- Filter by success/error
- Copy to clipboard
- Relative timestamps
- Clear all option
- Smooth animations

### ThemeToggle
- Dark/light mode switch
- Persists to localStorage
- System preference detection
- Smooth transitions

## Theme System

The app uses a custom theme context with:
- **Dark Mode**: Purple/violet gradient backgrounds
- **Light Mode**: Soft purple/violet pastels
- **Persistence**: Saved to localStorage
- **Smooth Transitions**: 300ms duration

## API Integration

The `lib/api.js` file provides:
- Axios instance with base URL
- Request interceptor for JWT tokens
- Response interceptor for error handling
- Auto-redirect to login on 401

### Available API Functions

```javascript
// Authentication
login(username, password)
signup(userData)
getCurrentUser()

// Queries
executeQuery(query)
getQueryHistory()
clearQueryHistory()

// Tables
getTables()
getTableInfo(tableName)

### Docker Build
See root `README.md` for Docker instructions.

## Troubleshooting

**Issue**: API connection failed
- **Solution**: Check `NEXT_PUBLIC_API_URL` in `.env.local`
- **Solution**: Ensure backend is running on correct port

**Issue**: Theme not persisting
- **Solution**: Check browser's localStorage is enabled
- **Solution**: Clear browser cache and reload

**Issue**: Build fails
- **Solution**: Delete `.next/` folder and `node_modules/`
- **Solution**: Run `npm install` and `npm run build` again

**Issue**: Styles not loading
- **Solution**: Check Tailwind CSS configuration
- **Solution**: Ensure `globals.css` is imported in `layout.tsx`


