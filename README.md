# KBT College Gate Pass Management System

A web-based system for managing gate passes for faculty members at KBT College of Engineering, Nashik. This application allows faculty to request gate passes, administrators to approve/reject those requests, and security personnel to view and mark approved requests as allowed.

## Features

- **User Authentication**: Secure login with role-based access (Faculty, Admin, Viewer)
- **Faculty Features**: Submit gate pass requests with purpose, date, and time details
- **Admin Features**: Review, approve, and reject faculty requests with email notifications
- **Viewer Features**: View approved requests and mark them as allowed when faculty exit/enter the campus
- **Filtering & Sorting**: Filter requests by date, faculty name, and status
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

The project consists of two main parts:

1. **Backend**: Node.js/Express.js REST API with MongoDB database
2. **Frontend**: React application with React Router for navigation

## Installation

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas URI)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd gatepass
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The application should be available at `http://localhost:5173`

## User Roles

### Faculty
- Submit gate pass requests
- View their own request history and status

### Admin
- View all requests
- Approve or reject pending requests
- Filter and search through requests

### Viewer (Security Personnel)
- View approved requests
- Mark requests as allowed when faculty exits/enters the campus
- View history of allowed requests

## Technologies Used

### Backend
- Express.js - Web framework
- MongoDB (Mongoose) - Database
- JWT - Authentication
- Nodemailer - Email notifications

### Frontend
- React - UI library
- React Router - Navigation
- Axios - API requests
- React Toastify - Notifications

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or issues, please contact the KBT College IT department. 