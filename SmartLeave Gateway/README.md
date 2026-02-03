# SmartLeave Gateway

A comprehensive digital permission management system for **Madanapalle Institute of Technology and Science (MITS)** that streamlines the leave application process for students, faculty, and HODs.

## 🎯 Overview

SmartLeave Gateway is a modern web-based application that digitizes the traditional paper-based permission system in educational institutions. It provides role-based access for students, faculty, and HODs with features like digital letter generation, attendance management, and approval workflows.

## ✨ Features

### 🎓 Student Features
- **Digital Permission Requests**: Create and submit leave applications online
- **Manual Entry Form**: Fill permission details through an intuitive web form
- **Permission History**: Track all submitted requests and their status
- **Attendance Monitoring**: View personal attendance records and statistics
- **Real-time Notifications**: Get updates on attendance marking and request approvals
- **Letter Generation**: Auto-generate formal permission letters
- **Status Tracking**: Monitor request approval status (Pending/Approved/Rejected)

### 👨‍🏫 Faculty Features
- **Digital Attendance**: Mark attendance for students with Present/Absent/Permission options
- **Timetable Management**: View and manage weekly class schedules
- **Bulk Operations**: Mark all students present/absent/permission with one click
- **Student Search**: Quick search functionality for large class lists
- **Subject Management**: Handle multiple subjects and periods
- **Attendance Reports**: Generate attendance summaries and statistics

### 💼 HOD Features
- **Request Approval**: Review and approve/reject student permission requests
- **Dashboard Analytics**: View statistics on total, approved, and rejected requests
- **Approval History**: Track all processed requests with timestamps
- **Letter Preview**: Preview permission letters before approval
- **Bulk Management**: Handle multiple requests efficiently

## 🏗️ Architecture

### Frontend
- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Custom styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: No framework dependencies for better performance
- **Responsive Design**: Mobile-first approach with cross-device compatibility

### Backend Integration
- **AWS Lambda**: Serverless functions for API endpoints
- **Amazon DynamoDB**: NoSQL database for storing user data and requests
- **Amazon S3**: Object storage for permission letters and documents
- **API Gateway**: RESTful API management and routing

### Key Components
```
SmartLeave Gateway/
├── index.html              # Main application entry point
├── script.js              # Core application logic
├── styles.css             # Complete styling and themes
├── lambda_approve.py      # AWS Lambda function for approvals
├── student-login.html     # Dedicated student login page
├── qr-entry.html         # Manual entry form for permissions
├── hod-login.html        # HOD authentication page
├── faculty-login.html    # Faculty authentication page
├── student-signup.html   # Student registration page
└── logo.jpg              # Institution logo
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for AWS services
- AWS account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartLeave Gateway
   ```

2. **Open the application**
   ```bash
   # Simply open index.html in your web browser
   open index.html
   # or
   python -m http.server 8000  # For local development server
   ```

3. **Configure AWS Services** (Optional)
   - Set up AWS Lambda functions
   - Configure DynamoDB tables
   - Set up S3 bucket for document storage
   - Update API endpoints in `script.js`

### Default Login Credentials

#### Student Login
- Use the signup form to create a new student account
- Login with registered email and password

#### Faculty Login
- **Email**: `faculty@mits.ac.in`
- **Password**: `faculty123`

#### HOD Login
- **Email**: `hod@mits.ac.in`
- **Password**: `hod123`

## 📱 Usage Guide

### For Students

1. **Registration**
   - Click "Student" on the landing page
   - Fill the signup form with personal details
   - Verify email and login

2. **Submit Permission Request**
   - Navigate to "Manual Entry" from dashboard
   - Fill the permission form with required details
   - Submit for HOD approval

3. **Track Requests**
   - View all requests in the "Permission History" section
   - Monitor approval status and notifications

### For Faculty

1. **Take Attendance**
   - Login with faculty credentials
   - Select subject and period
   - Mark attendance for each student
   - Submit attendance data

2. **Manage Classes**
   - View weekly timetable
   - Switch between different subjects
   - Generate attendance reports

### For HODs

1. **Review Requests**
   - Login to HOD dashboard
   - View pending permission requests
   - Preview generated letters

2. **Approve/Reject**
   - Review request details
   - Approve or reject with comments
   - Track approval statistics

## 🎨 Design System

### Color Palette
- **Primary Green**: `#606c38` - Main brand color
- **Dark Green**: `#283618` - Secondary brand color
- **Cream**: `#FEFAE0` - Background and accent
- **Gold**: `#DDA15E` - Highlights and CTAs
- **White**: `#ffffff` - Content backgrounds

### Typography
- **Headers**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Forms**: System fonts for better readability

### UI Components
- **Cards**: Elevated design with shadows and rounded corners
- **Buttons**: Gradient backgrounds with hover animations
- **Forms**: Clean inputs with focus states
- **Modals**: Backdrop blur with smooth animations

## 🔧 Technical Details

### State Management
- **Local Storage**: Persistent data storage for offline functionality
- **Session Management**: User authentication and role-based access
- **Real-time Updates**: Dynamic UI updates without page refresh

### API Integration
```javascript
const API = {
    SUBMIT_LETTER: 'https://pxg5xoiuxl.execute-api.ap-south-1.amazonaws.com/dev/submit-letter',
    APPROVE_LETTER: 'https://pxg5xoiuxl.execute-api.ap-south-1.amazonaws.com/dev/approve-letter'
};
```

### Data Models

#### Student Data
```javascript
{
    name: "Student Name",
    rollNumber: "23691A2801",
    email: "student@mits.ac.in",
    department: "Computer Science & Technology",
    section: "A",
    year: "3-1"
}
```

#### Permission Request
```javascript
{
    id: "unique-id",
    studentName: "Student Name",
    rollNumber: "23691A2801",
    reason: "medical-leave",
    startDate: "2024-01-15",
    endDate: "2024-01-16",
    status: "pending",
    submittedAt: "15/01/2024"
}
```

## 📊 Features in Detail

### Permission Management
- **Digital Forms**: Replace paper-based applications
- **Auto-generation**: Create formal letters automatically
- **Status Tracking**: Real-time updates on request status
- **History Management**: Complete audit trail of all requests

### Attendance System
- **Digital Marking**: Replace manual attendance registers
- **Bulk Operations**: Efficient handling of large classes
- **Statistics**: Automated calculation of attendance percentages
- **Notifications**: Real-time updates to students

### User Management
- **Role-based Access**: Different interfaces for different user types
- **Authentication**: Secure login system with validation
- **Profile Management**: User data management and updates

## 🔒 Security Features

- **Input Validation**: Client and server-side validation
- **CORS Configuration**: Proper cross-origin resource sharing
- **Authentication**: Secure login with password protection
- **Data Encryption**: Secure data transmission to AWS services

## 📱 Mobile Responsiveness

- **Responsive Design**: Works on all device sizes
- **Touch-friendly**: Optimized for mobile interactions
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Fast Loading**: Optimized assets and minimal dependencies

## 🚀 Deployment

### Local Development
```bash
# Start local server
python -m http.server 8000
# or
npx serve .
```

### Production Deployment
1. **Static Hosting**: Deploy to Netlify, Vercel, or GitHub Pages
2. **AWS S3**: Host as static website with CloudFront CDN
3. **Traditional Hosting**: Upload files to any web server

### AWS Backend Setup
1. **Lambda Functions**: Deploy approval and submission handlers
2. **DynamoDB**: Create tables for users and requests
3. **S3 Bucket**: Configure for document storage
4. **API Gateway**: Set up REST API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏫 About MITS

**Madanapalle Institute of Technology and Science** is an AICTE approved institution affiliated to JNTUA, with ISO 9001:2015 certification. Located in Madanapalle, Andhra Pradesh, MITS is committed to providing quality technical education.

## 📞 Support

For technical support or queries:
- **Email**: support@mits.ac.in
- **Phone**: +91-XXXX-XXXXXX
- **Address**: Kadiri Road, Angallu, Madanapalle - 517325

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added AWS integration and mobile responsiveness
- **v1.2.0** - Enhanced UI/UX and performance improvements

---

**Built with ❤️ for MITS Community**