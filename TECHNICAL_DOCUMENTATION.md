# KBT College Gate Pass System - Technical Documentation

## Tech Stack Overview

### Backend Technologies

#### Node.js & Express.js
**What:** Node.js is a JavaScript runtime environment, and Express.js is a web framework for Node.js.
**How:** Used to build the RESTful API that serves as the backbone of the application.
**Why:** Chosen for its non-blocking I/O model, making it efficient for handling concurrent requests. Express simplifies routing, middleware integration, and API development.

#### MongoDB & Mongoose
**What:** MongoDB is a NoSQL document database, and Mongoose is an ODM (Object Data Modeling) library.
**How:** Stores all application data in document collections (Users, LeaveRequests).
**Why:** Flexible schema design is ideal for evolving data structures, and the JSON-like documents match well with JavaScript objects.

#### JWT (JSON Web Tokens)
**What:** A compact, URL-safe means of representing claims to be transferred between two parties.
**How:** Used for user authentication and authorization.
**Why:** Stateless authentication method that allows the server to verify user identity without maintaining session state.

#### Nodemailer
**What:** Module for sending emails from Node.js applications.
**How:** Handles email notifications to faculty when their requests are approved/rejected.
**Why:** Provides a clean API for email delivery with support for HTML content, attachments, and various email service providers.

### Frontend Technologies

#### React
**What:** A JavaScript library for building user interfaces.
**How:** Used to create the entire frontend application with component-based architecture.
**Why:** Provides an efficient, flexible way to build interactive UIs with a virtual DOM for optimal rendering performance.

#### React Router
**What:** A routing library for React applications.
**How:** Manages navigation between different pages/views.
**Why:** Enables client-side routing without page reloads, creating a smoother user experience.

#### Axios
**What:** Promise-based HTTP client for browsers and Node.js.
**How:** Handles all HTTP requests to the backend API.
**Why:** Provides a simple, consistent API for making HTTP requests with features like request/response interception and automatic JSON parsing.

#### React Toastify
**What:** A notification library for React applications.
**How:** Displays success, error, and info messages to users.
**Why:** Easy-to-use API for showing non-intrusive notifications with customizable styling and positioning.

## Project Architecture

### Directory Structure

```
/
├── backend/                 # Server-side code
│   ├── config/              # Configuration files
│   │   ├── db.js            # Database connection setup
│   │   └── email.js         # Email service configuration
│   │   └── authMiddleware.js # Authentication middleware
│   ├── models/              # Mongoose schemas and models
│   │   ├── LeaveRequest.js  # Leave request data model
│   │   └── User.js          # User data model
│   ├── routes/              # API route handlers
│   │   ├── adminRoutes.js   # Admin-specific endpoints
│   │   ├── authRoutes.js    # Authentication endpoints
│   │   ├── facultyRoutes.js # Faculty-specific endpoints
│   │   ├── viewerRoutes.js  # Viewer-specific endpoints
│   │   └── dashboardRoutes.js # Dashboard endpoints
│   ├── .env                 # Environment variables
│   ├── package.json         # Backend dependencies
│   └── server.js            # Entry point for backend
├── gatepass/                # Frontend React application
│   ├── public/              # Static files
│   ├── src/                 # React source code
│   │   ├── assets/          # Images, icons, etc.
│   │   ├── components/      # Reusable UI components
│   │   │   ├── auth/        # Authentication components
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   └── Navbar.jsx   # Navigation bar component
│   │   ├── context/         # React context providers
│   │   ├── pages/           # Page components
│   │   ├── App.jsx          # Main component with routing
│   │   ├── App.css          # Global styles
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # Entry point for React app
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
├── README.md                # Project overview
├── requirements.txt         # Dependencies list
└── .gitignore               # Git ignore rules
```

## Key Files and Their Purpose

### Backend Files

#### `server.js`
The entry point for the backend server. It sets up Express, connects to MongoDB, and configures middleware and routes.

#### `config/db.js`
Manages the connection to MongoDB using Mongoose. Exports a function that establishes and verifies the database connection.

#### `config/email.js`
Contains email service configuration and functions for sending emails using Nodemailer.

#### `middleware/authMiddleware.js`
Contains middleware functions for authenticating requests using JWT tokens and checking user roles.

#### `models/User.js`
Defines the Mongoose schema for users, including fields for email, password (hashed), role, and other user details.

#### `models/LeaveRequest.js`
Defines the Mongoose schema for leave requests, including fields for faculty information, date, time, purpose, reason, and approval status.

#### `routes/authRoutes.js`
Handles user authentication endpoints (login, register, verify token).

#### `routes/adminRoutes.js`
Contains routes specific to admin users, like approving/rejecting requests and viewing all requests.

#### `routes/facultyRoutes.js`
Contains routes for faculty members to submit and view their leave requests.

#### `routes/viewerRoutes.js`
Contains routes for security personnel to view approved requests and mark them as allowed.

### Frontend Files

#### `src/main.jsx`
The entry point for the React application. Renders the App component to the DOM.

#### `src/App.jsx`
Defines the main component structure and all routes using React Router. Includes authentication protection for routes.

#### `src/context/AuthContext.jsx`
Implements React Context for managing authentication state across the application.

#### `src/components/auth/Login.jsx`
Implements the login form and authentication logic.

#### `src/components/auth/Register.jsx`
Implements the registration form and new user creation.

#### `src/components/Navbar.jsx`
Implements the navigation bar with conditional rendering based on user roles.

#### `src/pages/ApplyRequest.jsx`
Form for faculty to submit new leave requests.

#### `src/pages/FacultyRequests.jsx`
Page for faculty to view their submitted requests and their status.

#### `src/pages/UpdateRequest.jsx`
Admin interface for reviewing, approving, and rejecting requests with filtering options.

#### `src/pages/ViewerAllRequests.jsx`
Interface for security personnel to view all approved and rejected requests.

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (enum: ['faculty', 'admin', 'viewer']),
  department: String,
  employeeId: String,
  designation: String,
  createdAt: Date,
  updatedAt: Date
}
```

### LeaveRequest Collection
```javascript
{
  _id: ObjectId,
  facultyId: ObjectId (reference to User),
  facultyEmail: String,
  date: String,
  timeIn: String,
  timeOut: String,
  purpose: String,
  reason: String,
  status: String (enum: ['pending', 'approved', 'rejected']),
  allowed: Boolean,
  allowedBy: ObjectId (reference to User),
  allowedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user and get a token
- `GET /api/auth/verify` - Verify a JWT token

### Faculty Endpoints
- `POST /api/faculty/leave-request` - Submit a new leave request
- `GET /api/faculty/my-requests` - Get requests for the authenticated faculty

### Admin Endpoints
- `GET /api/admin/pending-requests` - Get all pending requests
- `GET /api/admin/all-requests` - Get all requests with filtering options
- `POST /api/admin/update-request` - Update request status (approve/reject)

### Viewer Endpoints
- `GET /api/viewer/all-requests` - Get all approved/rejected requests
- `GET /api/viewer/allowed-requests` - Get requests marked as allowed
- `PUT /api/viewer/mark-allowed/:id` - Mark a request as allowed

## Authentication Flow

1. User submits login credentials to `/api/auth/login`
2. Server validates credentials and issues a JWT token
3. Client stores the token in localStorage
4. Client includes the token in the Authorization header for subsequent requests
5. Server middleware verifies the token and extracts user information
6. Routes are protected based on user roles

## Code Comments Strategy

When adding comments to the codebase, follow these guidelines:

1. **File Header Comments**: Include a brief description of the file's purpose, author, and creation date.

2. **Function Comments**: Describe what the function does, its parameters, and return values.

3. **Complex Logic Comments**: Explain any non-obvious or complex logic.

4. **Component Comments**: For React components, explain the purpose and any props it receives.

5. **State Management Comments**: Explain the purpose of state variables and context providers.

## Performance Considerations

- **Database Indexes**: The MongoDB collections have indexes on frequently queried fields for better performance.
- **Date Filtering**: The system implements optimized date filtering for querying requests by date.
- **Pagination**: Consider implementing pagination for large result sets in future versions.

## Security Measures

- **Password Hashing**: User passwords are hashed using bcryptjs before storage.
- **JWT Authentication**: Secures API endpoints with token-based authentication.
- **Role-Based Authorization**: Routes are protected based on user roles.
- **Environment Variables**: Sensitive configuration is stored in environment variables.
- **Input Validation**: Request data is validated before processing.

## Future Enhancements

1. **Real-time Notifications**: Implement WebSockets for real-time updates.
2. **Advanced Filtering**: Add more complex filtering and sorting options.
3. **Analytics Dashboard**: Add statistics and reports for admins.
4. **Mobile App**: Develop a dedicated mobile application. 