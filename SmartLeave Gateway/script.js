// Make functions globally available immediately
window.showLogin = function(role) {
    currentRole = role;
    const subtitle = document.getElementById('loginSubtitle');
    const emailInput = document.getElementById('loginEmail');
    const authLinks = document.getElementById('authLinks');
    
    if (subtitle) {
        switch (role) {
            case 'student':
                subtitle.textContent = 'Student Login';
                break;
            case 'hod':
                subtitle.textContent = 'HOD Login';
                break;
            case 'faculty':
                subtitle.textContent = 'Faculty Login';
                break;
        }
    }
    
    if (emailInput) {
        switch (role) {
            case 'student':
                emailInput.placeholder = 'student@mits.ac.in';
                break;
            case 'hod':
                emailInput.placeholder = 'hod@mits.ac.in';
                break;
            case 'faculty':
                emailInput.placeholder = 'faculty@mits.ac.in';
                break;
        }
    }
    
    // Hide signup link for HOD and Faculty
    if (authLinks) {
        const signupLink = authLinks.querySelector('p:first-child');
        if (role === 'hod' || role === 'faculty') {
            if (signupLink) signupLink.style.display = 'none';
        } else {
            if (signupLink) signupLink.style.display = 'block';
        }
    }
    
    showPage('login-page');
};

window.showSignup = function(role = 'student') {
    currentSignupRole = role;
    const subtitle = document.getElementById('signupSubtitle');
    
    if (subtitle) {
        switch (role) {
            case 'student':
                subtitle.textContent = 'Create Student Account';
                break;
            case 'hod':
                subtitle.textContent = 'Create HOD Account';
                break;
            case 'faculty':
                subtitle.textContent = 'Create Faculty Account';
                break;
        }
    }
    
    showPage('signup-page');
};

window.showLanding = function() {
    showPage('landing-page');
};

window.logout = function() {
    currentUser = null;
    currentRole = null;
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully', 'info');
    setTimeout(() => showPage('landing-page'), 1500);
};

window.showScannerPage = function() {
    showPage('scanner-page');
    showManualEntry();
    
    if (currentUser) {
        const formName = document.getElementById('formName');
        const formDept = document.getElementById('formDept');
        const formSection = document.getElementById('formSection');
        const formYear = document.getElementById('formYear');
        const formGender = document.getElementById('formGender');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        // Use actual user name instead of default text
        if (formName) formName.value = currentUser.name || localStorage.getItem('signupName') || '';
        if (formDept) formDept.value = currentUser.department || 'CST - Computer Science & Technology';
        if (formSection) formSection.value = currentUser.section || 'A';
        if (formYear) formYear.value = currentUser.year || '3-1';
        if (formGender) formGender.value = currentUser.gender || 'Male';
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (startDate) startDate.value = today.toISOString().split('T')[0];
        if (endDate) endDate.value = tomorrow.toISOString().split('T')[0];
    }
};

window.showStudentDashboard = function() {
    showPage('student-dashboard');
    updateStudentDashboard();
};

// Application State
let currentUser = null;
let currentPage = 'landing';
let currentRole = null;
let currentSignupRole = 'student';
let requests = [];
let hodRequests = [];
let attendanceData = [];
let facultyAttendanceNotifications = [];

// API endpoints (set to your deployed API Gateway endpoints)
const API = {
    SUBMIT_LETTER: 'https://pxg5xoiuxl.execute-api.ap-south-1.amazonaws.com/dev/submit-letter',
    APPROVE_LETTER: 'https://pxg5xoiuxl.execute-api.ap-south-1.amazonaws.com/dev/approve-letter',
    LOGIN: 'https://gih9r2rsc3.execute-api.ap-south-1.amazonaws.com/dev/login',
    SIGNUP: 'https://gih9r2rsc3.execute-api.ap-south-1.amazonaws.com/dev/signup'
};

// Helper to POST JSON and return parsed response; throws on non-2xx
async function postJson(url, payload) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    // If API Gateway/Lambda Proxy returns a wrapped object ({ statusCode: ..., body: '...'}), unwrap it
    if (data && typeof data === 'object' && data.body) {
        try {
            data = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        } catch (e) {
            data = data.body;
        }
    }

    // Normalize non-object responses to an object to make callers simpler
    if (typeof data === 'string') data = { message: data };

    if (!res.ok) {
        // prefer explicit error/message fields when present
        const errMsg = (data && (data.error || data.message)) || res.statusText || text;
        throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }

    return data;
}

// Student Data
const students = [
    ["23691A2801", "SHAIK ABDUL ALEEM"], ["23691A2802", "INDLA ABHISHEK"], ["23691A2803", "SHAIK ADIL"],
    ["23691A2804", "PALAKA AKHIL MAHADEV"], ["23691A2805", "SOMSETTI AKHILA"], ["23691A2806", "MULANKAPPA GARI AKHILESWARI"],
    ["23691A2807", "SYED AMEENA"], ["23691A2808", "VENKATASIVAREDDYGARI AMRUTHA"], ["23691A2809", "MAKA ANILKUMAR REDDY"],
    ["23691A2810", "DEVARAPALLI ANUSHA"], ["23691A2811", "GANDLA ANUSHA"], ["23691A2812", "RAYARAPU ANUSHA"],
    ["23691A2813", "MOPURI ASHWINI"], ["23691A2814", "SHAIK ASMA BANU"], ["23691A2815", "CHARALA BABU REDDY"],
    ["23691A2816", "KAMMARA BHARATH ACHARI"], ["23691A2817", "KAMASANI BHARATH KUMAR"], ["23691A2818", "TAMMINENI MEDARA BHARATH KUMAR"],
    ["23691A2819", "SOMASEKHAR GARI BHARATHKUMAR"], ["23691A2820", "KUNDELLA CHENNAKESAVULU BHAVANA"], ["23691A2821", "LACHANNAGARI BHAVYA"],
    ["23691A2822", "BHAVYA PANJURI"], ["23691A2823", "CHERUKUMUDI BRAMHENDRA"], ["23691A2824", "KURAVA CHANDANA"],
    ["23691A2825", "MEESALA CHANDU PRIYA"], ["23691A2826", "THOTLI CHARAN TEJ REDDY"], ["23691A2827", "RAGIMANI CHITHRA"],
    ["23691A2828", "DANDURI REVANTH REDDY"], ["23691A2829", "YALLA DEDEEPYA"], ["23691A2830", "MASAPALLI DEEPIKA"],
    ["23691A2831", "S DEVIKA"], ["23691A2832", "KANNEMADUGU DILEEP KUMAR REDDY"], ["23691A2833", "T DIVYASREE"],
    ["23691A2834", "SHAIK FAIZAN HUSSAIN"], ["23691A2835", "SHAIK MOHAMMED FASIL"], ["23691A2836", "PALAGIRI MOHAMMED FAZIL"],
    ["23691A2837", "PALLE GAYATHRI"], ["23691A2838", "RAMABHADRA GEETHIKA"], ["23691A2839", "ACHAMMAGARI GOWTHAMI"],
    ["23691A2840", "YARRADODDI HANEESHA"], ["23691A2841", "CHINTA HARISH NAIDU"], ["23691A2842", "YERRABALLI HARISH"],
    ["23691A2843", "BOMMALATA HARSHAVARDHAN"], ["23691A2844", "PEDDASANI HARSHAVARDHAN REDDY"], ["23691A2845", "VADA HARSHAVARDHAN REDDY"],
    ["23691A2846", "DAYYALA HARSHITHA"], ["23691A2847", "RAYADURGAM HARSHITHA"], ["23691A2848", "TEKULAPALEM HARSHITHA"],
    ["23691A2849", "ADIMULAM HEMA PRADEEP"], ["23691A2850", "YERRAMREDDY HEMANTH REDDY"], ["23691A2851", "RASAM HEMAVATHI"],
    ["23691A2852", "SHAIK IRFAN"], ["23691A2853", "CHITTA ISHITHA REDDY"], ["23691A2854", "GARNIMITTA JAGADEESH"],
    ["23691A2855", "KASA JAYASREE"], ["23691A2856", "SADDALA JAYA CHANDRA"], ["23691A2857", "UGRANAM JAYADEV ROYAL"],
    ["23691A2858", "HARI JENIN EVANJILIN"], ["23691A2859", "VAKKALA JESHWANTH"], ["23691A2860", "ALLAM JYOTHEESWAR REDDY"],
    ["23691A2861", "SIVA KARTHIK"], ["23691A2862", "CHANDRA KARTHIKEYA"], ["23691A2863", "SHAIK KASHIFA MUSKAN"],
    ["23691A2864", "THARIGONDA SHAIK MOHAMMED KHADEER"], ["23691A2865", "KOLA KIRAN KUMAR"], ["23691A2866", "PANJURI KIRAN KUMAR REDDY"],
    ["24695A2801", "SHAIK ABBAS"], ["24695A2802", "KILARI ABHISEK KUMAR"], ["24695A2803", "KUNIGIRI ABHISHEK"],
    ["24695A2804", "PATAN AFZAL KHAN"], ["24695A2805", "KUMMARI ASHOK"]
];

// Faculty Data
const facultyData = {
    ashok: { name: "Mr. K. Ashok", subject: "AI - Artificial Intelligence" },
    dinesh: { name: "Dr. K. Dinesh", subject: "DSA - Data Structures & Algorithms" },
    priya: { name: "Ms. S. Priya", subject: "DBMS - Database Management Systems" },
    kumar: { name: "Dr. R. Kumar", subject: "OS - Operating Systems" }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
    setupEventListeners();
    setCurrentDate();
    
    // QRCode library check removed - using static SVG instead
});

function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    const savedRequests = localStorage.getItem('requests');
    const savedHodRequests = localStorage.getItem('hodRequests');
    const savedAttendance = localStorage.getItem('attendanceData');
    const savedNotifications = localStorage.getItem('facultyAttendanceNotifications');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        currentRole = currentUser.role;
    }
    
    if (savedRequests) requests = JSON.parse(savedRequests);
    if (savedHodRequests) hodRequests = JSON.parse(savedHodRequests);
    if (savedAttendance) attendanceData = JSON.parse(savedAttendance);
    if (savedNotifications) facultyAttendanceNotifications = JSON.parse(savedNotifications);
    
    if (currentUser) {
        switch (currentUser.role) {
            case 'hod': showHodDashboard(); break;
            case 'faculty': showFacultyDashboard(); break;
            default: showStudentDashboard();
        }
    } else {
        showPage('landing-page');
    }
}

function setupEventListeners() {
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('permission-form').addEventListener('submit', handlePermissionSubmit);
    
    window.addEventListener('click', function(event) {
        const permissionModal = document.getElementById('permission-modal');
        const letterModal = document.getElementById('letter-modal');
        const qrModal = document.getElementById('qr-code-modal');
        
        if (event.target === permissionModal) closePermissionForm();
        if (event.target === letterModal) closeLetterModal();
        if (event.target === qrModal) closeQRCode();
    });
}

function setCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = new Date().toLocaleDateString();
    }
}

// Page Navigation
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    setTimeout(() => {
        document.getElementById(pageId).classList.add('active');
        currentPage = pageId;
    }, 100);
}

function showLanding() {
    showPage('landing-page');
}



function showHodDashboard() {
    showPage('hod-dashboard');
    updateHodDashboard();
}

function showFacultyDashboard() {
    showPage('faculty-dashboard');
    populateStudentsTable();
    updateAttendanceSummary();
}

// Authentication
async function handleSignup(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!fullName || !email || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // For student signup, use Lambda API
    if (currentSignupRole === 'student') {
        try {
            const requestData = {
                full_name: fullName,
                college_mail: email,
                password: password
            };
            console.log('Sending signup data:', requestData);
            
            const response = await fetch('https://gih9r2rsc3.execute-api.ap-south-1.amazonaws.com/dev/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            console.log('Signup response:', data);
            
            if (response.ok && response.status === 200) {
                // Store name for login use
                localStorage.setItem('signupName', fullName);
                showNotification('Account created successfully!', 'success');
                setTimeout(() => {
                    showLogin(currentSignupRole);
                    const loginEmailInput = document.getElementById('loginEmail');
                    if (loginEmailInput) loginEmailInput.value = email;
                    showNotification('Please login with your credentials', 'info');
                }, 1500);
                return;
            }
            
            // Handle error responses (409, 400, etc.)
            let errorMessage = 'Signup failed';
            
            if (data.body) {
                try {
                    const bodyData = JSON.parse(data.body);
                    errorMessage = bodyData.message || bodyData.error || errorMessage;
                } catch (e) {
                    errorMessage = data.body;
                }
            } else if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            }
            
            console.log('Signup failed - Status:', response.status, 'Error:', errorMessage);
            showNotification(errorMessage, 'error');
        } catch (error) {
            console.error('Signup request failed:', error);
            showNotification('Network error: ' + error.message, 'error');
        }
        return;
    }
    
    // For other roles, use local storage (existing logic)
    currentUser = {
        name: fullName,
        email: email,
        role: currentSignupRole,
        department: 'Computer Science & Technology',
        section: 'A',
        year: 'III',
        program: 'B.Tech',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showNotification('Account created successfully!', 'success');
    
    setTimeout(() => {
        showLogin(currentSignupRole);
        document.getElementById('loginEmail').value = email;
        showNotification('Please login with your credentials', 'info');
    }, 1500);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Role-based authentication
    if (currentRole === 'hod' && email === 'hod@mits.ac.in' && password === 'hod123') {
        currentUser = {
            name: 'K. Dinesh',
            email: email,
            role: 'hod',
            department: 'Computer Science & Technology'
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Welcome back, HOD!', 'success');
        setTimeout(() => showHodDashboard(), 1500);
        return;
    }
    
    if (currentRole === 'faculty' && email === 'faculty@mits.ac.in' && password === 'faculty123') {
        currentUser = {
            name: 'Mr. K. Ashok',
            email: email,
            role: 'faculty',
            subject: 'AI - Artificial Intelligence'
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Welcome, Faculty!', 'success');
        setTimeout(() => showFacultyDashboard(), 1500);
        return;
    }
    
    // Student login with Lambda API
    if (currentRole === 'student') {
        try {
            const requestData = {
                college_mail: email,
                password: password
            };
            console.log('Sending login data:', requestData);
            
            const response = await fetch('https://gih9r2rsc3.execute-api.ap-south-1.amazonaws.com/dev/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            console.log('Raw response:', data);
            
            // Parse the nested response structure
            let actualData;
            if (data.body) {
                actualData = JSON.parse(data.body);
            } else {
                actualData = data;
            }
            
            console.log('Parsed data:', actualData);
            
            if ((data.statusCode === 200 || response.ok) && actualData.success) {
                // Use user data from Lambda response
                const userData = actualData.user || {};
                
                currentUser = {
                    name: userData.name || 'Student',
                    rollNumber: userData.rollNumber || email.split('@')[0],
                    email: userData.email || email,
                    role: 'student',
                    department: 'Computer Science & Technology',
                    section: 'A',
                    year: 'III',
                    program: 'B.Tech'
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showNotification(`Welcome ${currentUser.name}!`, 'success');
                setTimeout(() => showStudentDashboard(), 1500);
                return;
            } else {
                console.log('Login error:', actualData);
                showNotification(actualData.message || actualData.error || 'Invalid credentials', 'error');
                return;
            }
        } catch (error) {
            showNotification('Login failed: ' + error.message, 'error');
            return;
        }
    }
    
    showNotification('Invalid credentials', 'error');
}



// QR Code Display
function showQRCode() {
    showScannerPage();
}

function closeQRCode() {
    const modal = document.getElementById('qr-code-modal');
    if (modal) modal.style.display = 'none';
}

// Permission Form
function openPermissionForm() {
    if (!currentUser) return;
    
    const formName = document.getElementById('formName');
    const formDept = document.getElementById('formDept');
    const formSection = document.getElementById('formSection');
    const formYear = document.getElementById('formYear');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (formName) formName.value = currentUser.name;
    if (formDept) formDept.value = currentUser.department;
    if (formSection) formSection.value = currentUser.section;
    if (formYear) formYear.value = currentUser.year;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (startDate) startDate.value = today.toISOString().split('T')[0];
    if (endDate) endDate.value = tomorrow.toISOString().split('T')[0];
    
    const modal = document.getElementById('permission-modal');
    if (modal) modal.style.display = 'block';
}

function closePermissionForm() {
    const modal = document.getElementById('permission-modal');
    const form = document.getElementById('permission-form');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

function handlePermissionSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: generateId(),
        studentName: document.getElementById('formName').value,
        rollNumber: document.getElementById('formRoll').value,
        department: document.getElementById('formDept').value,
        section: document.getElementById('formSection').value,
        year: document.getElementById('formYear').value,
        program: document.getElementById('formProgram').value,
        reason: document.getElementById('permissionReason').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        additionalDetails: document.getElementById('additionalDetails').value,
        status: 'pending',
        submittedAt: new Date().toLocaleDateString(),
        submittedBy: currentUser.rollNumber // Track which student submitted
    };
    
        // If backend is available, submit to API and store server letterId; otherwise fallback to local-only
        (async () => {
            if (API.SUBMIT_LETTER) {
                try {
                    showNotification('Submitting request...', 'info');
                    const res = await postJson(API.SUBMIT_LETTER, {
                        rollNumber: formData.rollNumber,
                        studentName: formData.studentName,
                        department: formData.department,
                        section: formData.section,
                        year: formData.year,
                        gender: formData.gender,
                        reason: formData.reason,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        additionalDetails: formData.additionalDetails,
                        submittedBy: formData.submittedBy,
                        letterText: `Respected Sir/Madam,\n\nI, ${formData.studentName} (Roll: ${formData.rollNumber}), request leave from ${formData.startDate} to ${formData.endDate} for ${formData.reason.replace('-', ' ')}.\n\nDetails: ${formData.additionalDetails || 'N/A'}\n\nRegards,\n${formData.studentName}`,
                        // include client-generated id so server uses stable pending key
                        letterId: formData.id
                    });

                    formData.id = res.letterId || formData.id;
                    formData.letterId = res.letterId || formData.letterId || formData.id;
                    formData.s3Key = res.s3Key || '';
                    formData.updatedAt = res.updatedAt || formData.updatedAt;
                    formData.approvedAt = res.approvedAt || formData.approvedAt;
                    formData.approvedBy = res.approvedBy || formData.approvedBy;

                    requests.push(formData);
                    localStorage.setItem('requests', JSON.stringify(requests));

                    closePermissionForm();
                    showNotification('Permission request submitted successfully!', 'success');
                    setTimeout(() => {
                        generatePermissionLetter(formData);
                        showNotification('Permission letter generated', 'info');
                        updateStudentDashboard();
                    }, 1000);
                } catch (err) {
                    console.error('Submission failed', err);
                    showNotification('Submission failed: ' + err.message, 'error');
                }
            } else {
                requests.push({ ...formData, letterId: formData.id }); // Include letterId in requests
                localStorage.setItem('requests', JSON.stringify(requests));

                closePermissionForm();
                showNotification('Permission request submitted successfully!', 'success');

                setTimeout(() => {
                    generatePermissionLetter(formData);
                    showNotification('Permission letter generated', 'info');
                    updateStudentDashboard();
                }, 1000);
            }
        })();
}

// Letter Generation (No Flipping)
function generatePermissionLetter(requestData) {
    const letterContent = `
        <div class="letter-header">
            <img src="col logo.png" alt="MITS Logo" class="logo">
            <h1>MADANAPALLE INSTITUTE OF TECHNOLOGY AND SCIENCE</h1>
            <p><i>(Approved by AICTE, Affiliated to JNTUA, An ISO 9001:2015 Certified Institution)</i></p>
            <p><i>Kadiri Road, Angallu, Madanapalle - 517325, Chittoor Dist., Andhra Pradesh</i></p>
        </div>

        <div class="date">
            Date: <i>${new Date().toLocaleDateString()}</i>
        </div>

        <div class="recipient">
            To,<br>
            The Principal,<br>
            <span class="italic-bold">Madanapalle Institute of Technology and Science,</span><br>
            Madanapalle.
        </div>

        <div class="salutation">
            Respected Sir/Madam,
        </div>

        <div class="content">
            <p>I am writing this letter to request your kind permission for my ward, <span class="italic-bold">${requestData.studentName}</span>, bearing Roll Number <span class="italic-bold">${requestData.rollNumber}</span>, studying in <span class="italic-bold">${requestData.program} ${requestData.department} - ${requestData.year} Year</span>, to leave the institute premises.</p>
            <p>The reason for this leave is <span class="italic-bold">${requestData.reason.replace('-', ' ')}</span>. We request a leave for <span class="italic-bold">${calculateDays(requestData.startDate, requestData.endDate)}</span> day(s) from <span class="italic-bold">${requestData.startDate}</span> to <span class="italic-bold">${requestData.endDate}</span>.</p>
            <p>I assure you that <span class="italic-bold">${requestData.studentName}</span> will catch up on any missed classes and assignments upon returning to the institute. I take full responsibility for my ward's safety and conduct during this period of leave.</p>
            <p>I kindly request you to consider my application and grant the necessary permission. Your understanding and cooperation in this regard would be highly appreciated.</p>
            ${requestData.additionalDetails ? `<p><strong>Additional Details:</strong> ${requestData.additionalDetails}</p>` : ''}
        </div>
            <div class="footer">
                <p>Letter ID: <span class="italic-bold">${requestData.id}</span></p>
            </div>

        <div class="closing">
            Thanking You,
        </div>

        <div class="signature">
            ${requestData.status === 'approved' ? `<div class="hod-signature">K. Dinesh</div><div>Head of Department</div><div>Computer Science & Technology</div>` : `Yours Obediently,<br><span class="italic-bold">[Parent/Guardian's Name]</span><br>Contact No: <span class="italic-bold">[Parent/Guardian's Contact Number]</span><br>Email: <span class="italic-bold">[Parent/Guardian's Email Address]</span>`}
        </div>
        
        ${requestData.status === 'approved' ? `<div class="hod-stamp"><div>APPROVED</div><div>HOD - CST</div><div>MITS</div></div>` : ''}
    `;
    
    document.getElementById('permissionLetter').innerHTML = letterContent;
    document.getElementById('letter-modal').style.display = 'block';
    
    if (currentUser && currentUser.role === 'student') {
        document.getElementById('forwardBtn').style.display = 'inline-block';
        document.getElementById('forwardBtn').onclick = () => forwardToHOD(requestData.id);
    }
}

function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

function forwardToHOD(requestId) {
    const request = requests.find(req => req.id === requestId);
    if (!request) return;
    
    if (!hodRequests.find(req => req.id === requestId)) {
        hodRequests.push(request);
        localStorage.setItem('hodRequests', JSON.stringify(hodRequests));
    }
    
    showNotification('Request forwarded to HOD for approval', 'success');
    closeLetterModal();
}

function closeLetterModal() {
    const modal = document.getElementById('letter-modal');
    if (modal) modal.style.display = 'none';
}

function downloadLetter() {
    showNotification('Letter download feature will be implemented with PDF generation', 'info');
}

// Student Dashboard Updates
function updateStudentDashboard() {
    if (!currentUser) return;
    
    document.getElementById('studentName').textContent = `Welcome, ${currentUser.name}`;
    
    // Update requests list - show requests from both arrays
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';
    
    // Combine requests from both local requests and HOD requests
    const allRequests = [...requests, ...hodRequests];
    
    if (allRequests.length === 0) {
        requestsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No requests yet. Use Manual Entry to create your first request.</p>';
    } else {
        allRequests.slice(-5).reverse().forEach(request => {
            const requestElement = createRequestElement(request);
            requestsList.appendChild(requestElement);
        });
    }
    
    // Update attendance stats
    updateStudentAttendanceStats();
    
    // Update notifications
    updateStudentNotifications();
}

function updateStudentAttendanceStats() {
    // Get attendance data for current student using exact roll number match
    const studentAttendance = facultyAttendanceNotifications.filter(notif => 
        notif.rollNumber.toLowerCase() === currentUser.rollNumber.toLowerCase()
    );
    
    let presentCount = 0;
    let absentCount = 0;
    let permissionCount = 0;
    
    studentAttendance.forEach(record => {
        switch (record.status) {
            case 'present': presentCount++; break;
            case 'absent': absentCount++; break;
            case 'permission': permissionCount++; break;
        }
    });
    
    const totalDays = presentCount + absentCount + permissionCount;
    const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
    
    document.getElementById('presentDays').textContent = presentCount;
    document.getElementById('absentDays').textContent = absentCount;
    document.getElementById('permissionDays').textContent = permissionCount;
    
    // Update attendance status with detailed information
    const attendanceStatus = document.getElementById('attendanceStatus');
    if (studentAttendance.length > 0) {
        const latestRecord = studentAttendance[studentAttendance.length - 1];
        const statusIcon = getStatusIcon(latestRecord.status);
        attendanceStatus.innerHTML = `
            <div style="background: rgba(96, 108, 56, 0.1); padding: 1rem; border-radius: 10px; border-left: 4px solid var(--primary-green);">
                <p><strong>${statusIcon} Latest Status:</strong> ${latestRecord.status.toUpperCase()}</p>
                <p><strong>Subject:</strong> ${latestRecord.subject}</p>
                <p><strong>Date:</strong> ${latestRecord.date} - Period ${latestRecord.period}</p>
                <p><strong>Faculty:</strong> ${latestRecord.faculty}</p>
                <p><strong>Roll Number:</strong> ${latestRecord.rollNumber}</p>
            </div>
        `;
    } else {
        attendanceStatus.innerHTML = `
            <div style="background: rgba(221, 161, 94, 0.1); padding: 1rem; border-radius: 10px; border-left: 4px solid var(--gold);">
                <p>📋 No attendance records yet. Faculty will mark your attendance during classes.</p>
            </div>
        `;
    }
}

function updateStudentNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '';
    
    // Get recent attendance notifications for this student with exact roll number match
    const studentNotifications = facultyAttendanceNotifications
        .filter(notif => notif.rollNumber.toLowerCase() === currentUser.rollNumber.toLowerCase())
        .slice(-5)
        .reverse();
    
    if (studentNotifications.length === 0) {
        notificationsList.innerHTML = `
            <div style="background: rgba(221, 161, 94, 0.1); padding: 1rem; border-radius: 10px; text-align: center;">
                <p style="opacity: 0.7; color: var(--dark-green);">🔔 No new notifications</p>
                <p style="font-size: 0.8rem; opacity: 0.6;">You'll receive notifications when faculty marks attendance</p>
            </div>
        `;
        return;
    }
    
    studentNotifications.forEach(notification => {
        const notifElement = document.createElement('div');
        notifElement.className = `notification-item ${notification.status}`;
        const statusColor = notification.status === 'present' ? 'var(--primary-green)' : 
                           notification.status === 'absent' ? '#dc2626' : 'var(--gold)';
        
        notifElement.innerHTML = `
            <div style="background: rgba(254, 250, 224, 0.5); padding: 1rem; border-radius: 10px; border-left: 4px solid ${statusColor}; margin-bottom: 0.5rem;">
                <div class="notification-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span class="notification-title" style="font-weight: 600; color: var(--text-dark);">${getStatusIcon(notification.status)} ${notification.status.toUpperCase()}</span>
                    <span class="notification-time" style="font-size: 0.8rem; opacity: 0.7;">${notification.date}</span>
                </div>
                <div class="notification-body" style="color: var(--text-dark); opacity: 0.8; font-size: 0.9rem;">
                    <strong>${notification.subject}</strong> - Period ${notification.period}<br>
                    Faculty: ${notification.faculty}<br>
                    Roll: ${notification.rollNumber}
                </div>
            </div>
        `;
        notificationsList.appendChild(notifElement);
    });
}

function getStatusIcon(status) {
    switch (status) {
        case 'present': return '✅';
        case 'absent': return '❌';
        case 'permission': return '📝';
        default: return 'ℹ️';
    }
}

// Faculty Functions
function changeFaculty() {
    const facultySelect = document.getElementById('facultySelect');
    const selectedFaculty = facultyData[facultySelect.value];
    
    if (selectedFaculty) {
        document.getElementById('facultyName').textContent = selectedFaculty.name;
        document.getElementById('subjectInfo').textContent = selectedFaculty.subject;
        currentUser.name = selectedFaculty.name;
        currentUser.subject = selectedFaculty.subject;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

function populateStudentsTable() {
    const tbody = document.getElementById('studentsTable');
    tbody.innerHTML = '';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student[0]}</td>
            <td>${student[1]}</td>
            <td><input type="radio" name="${student[0]}" value="present" checked></td>
            <td><input type="radio" name="${student[0]}" value="absent"></td>
            <td><input type="radio" name="${student[0]}" value="permission"></td>
        `;
        tbody.appendChild(row);
    });
    
    const radioButtons = tbody.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', updateAttendanceSummary);
    });
}

function markAll(status) {
    const radioButtons = document.querySelectorAll(`input[value="${status}"]`);
    radioButtons.forEach(radio => {
        radio.checked = true;
    });
    updateAttendanceSummary();
}

function searchStudents() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTable tr');
    
    rows.forEach(row => {
        const rollNo = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        
        if (rollNo.includes(searchTerm) || name.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function updateAttendanceSummary() {
    const totalStudents = students.length;
    let presentCount = 0;
    let absentCount = 0;
    let permissionCount = 0;
    
    students.forEach(student => {
        const checkedRadio = document.querySelector(`input[name="${student[0]}"]:checked`);
        if (checkedRadio) {
            switch (checkedRadio.value) {
                case 'present': presentCount++; break;
                case 'absent': absentCount++; break;
                case 'permission': permissionCount++; break;
            }
        }
    });
    
    const presentPercent = Math.round((presentCount / totalStudents) * 100);
    const absentPercent = Math.round((absentCount / totalStudents) * 100);
    const permissionPercent = Math.round((permissionCount / totalStudents) * 100);
    
    document.getElementById('presentCount').textContent = `${presentPercent}%`;
    document.getElementById('presentNumber').textContent = presentCount;
    document.getElementById('absentCount').textContent = `${absentPercent}%`;
    document.getElementById('absentNumber').textContent = absentCount;
    document.getElementById('permissionCount').textContent = `${permissionPercent}%`;
    document.getElementById('permissionNumber').textContent = permissionCount;
}

function submitAttendance() {
    const period = document.getElementById('periodSelect').value;
    const currentDate = new Date().toLocaleDateString();
    const facultyName = currentUser.name;
    const subject = currentUser.subject;
    
    // Create attendance notifications for each student
    students.forEach(student => {
        const checkedRadio = document.querySelector(`input[name="${student[0]}"]:checked`);
        if (checkedRadio) {
            const notification = {
                id: generateId(),
                rollNumber: student[0],
                studentName: student[1],
                status: checkedRadio.value,
                date: currentDate,
                period: period,
                faculty: facultyName,
                subject: subject,
                timestamp: new Date().toISOString()
            };
            
            facultyAttendanceNotifications.push(notification);
        }
    });
    
    localStorage.setItem('facultyAttendanceNotifications', JSON.stringify(facultyAttendanceNotifications));
    
    showNotification('Attendance submitted successfully! Students will be notified.', 'success');
    
    // Reset form
    setTimeout(() => {
        populateStudentsTable();
        updateAttendanceSummary();
    }, 1000);
}

// HOD Dashboard Functions
function updateHodDashboard() {
    const hodRequestsList = document.getElementById('hodRequestsList');
    hodRequestsList.innerHTML = '';
    
    const pendingRequests = hodRequests.filter(req => req.status === 'pending');
    
    if (pendingRequests.length === 0) {
        hodRequestsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No pending requests for approval.</p>';
    } else {
        pendingRequests.forEach(request => {
            const requestElement = createHodRequestElement(request);
            hodRequestsList.appendChild(requestElement);
        });
    }
    
    updateHodStats();
    updateHodHistory();
}

function updateHodStats() {
    const total = hodRequests.length;
    const approved = hodRequests.filter(req => req.status === 'approved').length;
    const rejected = hodRequests.filter(req => req.status === 'rejected').length;
    
    document.getElementById('totalRequests').textContent = total;
    document.getElementById('approvedRequests').textContent = approved;
    document.getElementById('rejectedRequests').textContent = rejected;
}

function updateHodHistory() {
    const hodHistoryList = document.getElementById('hodHistoryList');
    hodHistoryList.innerHTML = '';
    
    const processedRequests = hodRequests.filter(req => req.status !== 'pending').slice(-5);
    
    if (processedRequests.length === 0) {
        hodHistoryList.innerHTML = '<p style="opacity: 0.7;">No processed requests yet</p>';
    } else {
        processedRequests.forEach(request => {
            const historyItem = document.createElement('div');
            historyItem.className = `request-item ${request.status}`;
            historyItem.innerHTML = `
                <div class="request-header">
                    <div class="request-title">${request.studentName} - ${request.reason}</div>
                    <div class="request-status status-${request.status}">${request.status}</div>
                </div>
                <div class="request-details">
                    <p><strong>Roll:</strong> ${request.rollNumber}</p>
                    <p><strong>Date:</strong> ${request.startDate} to ${request.endDate}</p>
                    <p><strong>Processed:</strong> ${request.approvedAt || request.rejectedAt}</p>
                </div>
            `;
            hodHistoryList.appendChild(historyItem);
        });
    }
}

function createRequestElement(request) {
    const div = document.createElement('div');
    div.className = `request-item ${request.status}`;
    
    // Ensure status is properly displayed with proper styling
    const statusText = request.status ? request.status.toUpperCase() : 'PENDING';
    const statusClass = request.status || 'pending';
    
    div.innerHTML = `
        <div class="request-header">
            <div class="request-title">${request.reason ? request.reason.replace('-', ' ') : 'Permission Request'}</div>
            <div class="request-status status-${statusClass}" style="background: ${getStatusColor(statusClass)}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${statusText}</div>
        </div>
        <div class="request-details">
            <p><strong>Date:</strong> ${request.startDate} to ${request.endDate}</p>
            <p><strong>Submitted:</strong> ${request.submittedAt}</p>
            ${request.status === 'approved' ? `<button onclick="viewLetter('${request.id}')" class="scan-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">View Approved Letter</button>` : ''}
        </div>
    `;
    
    return div;
}

function getStatusColor(status) {
    switch(status) {
        case 'approved': return '#22c55e';
        case 'rejected': return '#ef4444';
        case 'pending': return '#f59e0b';
        default: return '#6b7280';
    }
}

function createHodRequestElement(request) {
    const div = document.createElement('div');
    div.className = 'request-item pending';
    
    div.innerHTML = `
        <div class="request-header">
            <div class="request-title">${request.studentName} - ${request.reason.replace('-', ' ')}</div>
            <div class="request-status status-pending">Pending</div>
        </div>
        <div class="request-details">
            <p><strong>Roll Number:</strong> ${request.rollNumber}</p>
            <p><strong>Department:</strong> ${request.department}</p>
            <p><strong>Date:</strong> ${request.startDate} to ${request.endDate}</p>
            <p><strong>Details:</strong> ${request.additionalDetails || 'None'}</p>
            <p><strong>Submitted:</strong> ${request.submittedAt}</p>
        </div>
        <div class="approval-actions">
            <button class="approve-btn" onclick="approveRequest('${request.id}')">Approve</button>
            <button class="reject-btn" onclick="rejectRequest('${request.id}')">Reject</button>
            <button class="scan-button" onclick="previewLetter('${request.id}')" style="background: var(--primary-blue);">Preview Letter</button>
        </div>
    `;
    
    return div;
}

async function approveRequest(requestId) {
    const request = hodRequests.find(r => r.id === requestId) || requests.find(r => r.id === requestId);
    if (!request) return showNotification('Request not found', 'error');

    // If this request has never been submitted to the backend (no letterId and no s3Key),
    // try to submit it first so the Approve API can operate on a server-side item.
    console.log('approveRequest - current request object:', request);
    if (!request.letterId && !request.s3Key) {
        console.log('approveRequest - request missing letterId and s3Key, attempting pre-submit');
        if (!API.SUBMIT_LETTER) {
            return showNotification('Cannot approve: request not submitted to server', 'error');
        }
        try {
            showNotification('Submitting request to server before approval...', 'info');
            const submitPayload = {
                rollNumber: request.rollNumber,
                studentName: request.studentName,
                department: request.department,
                section: request.section,
                year: request.year,
                reason: request.reason,
                startDate: request.startDate,
                endDate: request.endDate,
                additionalDetails: request.additionalDetails,
                submittedBy: request.submittedBy,
                letterText: `Respected Sir/Madam,\n\nI, ${request.studentName} (Roll: ${request.rollNumber}), request leave from ${request.startDate} to ${request.endDate} for ${request.reason.replace('-', ' ')}.\n\nDetails: ${request.additionalDetails || 'N/A'}\n\nRegards,\n${request.studentName}`,
                // send the local id so submit uses same pending key
                letterId: request.id
            };
            const subRes = await postJson(API.SUBMIT_LETTER, submitPayload);
            console.log('approveRequest - pre-submit response:', subRes);
            // Persist server metadata into request
            request.letterId = subRes.letterId || request.letterId || request.id;
            request.s3Key = subRes.s3Key || request.s3Key || '';
            request.updatedAt = subRes.updatedAt || request.updatedAt;
            // Save to both lists if present
            const rIdx = requests.findIndex(r => r.id === requestId);
            if (rIdx !== -1) requests[rIdx] = request;
            const hIdx = hodRequests.findIndex(r => r.id === requestId);
            if (hIdx !== -1) hodRequests[hIdx] = request;
            localStorage.setItem('requests', JSON.stringify(requests));
            localStorage.setItem('hodRequests', JSON.stringify(hodRequests));
            showNotification('Request submitted to server', 'success');
        } catch (err) {
            console.error('Pre-approval submit failed', err);
            // If the submit failed, log full error and return
            return showNotification('Cannot approve: failed to submit request to server', 'error');
        }
    }

    // Build payload: prefer server-side letterId, fall back to s3Key or local id
    const payload = { action: 'APPROVED', approvedBy: (currentUser && currentUser.name) || 'K. Dinesh' };
    if (request.letterId) payload.letterId = request.letterId;
    else if (request.s3Key) payload.s3Key = request.s3Key;
    else payload.letterId = request.id;

    try {
        showNotification('Approving request...', 'info');
        console.log('approveRequest - final payload being sent:', payload);
        let res = await postJson(API.APPROVE_LETTER, payload);
        // Ensure we have an object response
        if (typeof res === 'string') res = { message: res };
        console.log('approveRequest - approve response:', res);

        // Update local state with server metadata and consistent status
        updateRequestStatus(requestId, 'approved');
        const idx = hodRequests.findIndex(r => r.id === requestId);
        if (idx !== -1) {
            hodRequests[idx].status = 'approved';
            if (res.s3Key) hodRequests[idx].s3Key = res.s3Key;
            if (res.approvedAt) hodRequests[idx].approvedAt = res.approvedAt;
            if (res.approvedBy) hodRequests[idx].approvedBy = res.approvedBy;
            if (res.updatedAt) hodRequests[idx].updatedAt = res.updatedAt;
        }
        const idx2 = requests.findIndex(r => r.id === requestId);
        if (idx2 !== -1) {
            requests[idx2].status = 'approved';
            if (res.s3Key) requests[idx2].s3Key = res.s3Key;
            if (res.approvedAt) requests[idx2].approvedAt = res.approvedAt;
            if (res.approvedBy) requests[idx2].approvedBy = res.approvedBy;
            if (res.updatedAt) requests[idx2].updatedAt = res.updatedAt;
        }
        localStorage.setItem('hodRequests', JSON.stringify(hodRequests));
        localStorage.setItem('requests', JSON.stringify(requests));

        showNotification('Request approved successfully!', 'success');
        updateHodDashboard();
    } catch (err) {
        console.error('Approve failed', err);
        showNotification('Approve failed: ' + (err.message || JSON.stringify(err)), 'error');
    }
}

async function rejectRequest(requestId) {
    const request = hodRequests.find(r => r.id === requestId) || requests.find(r => r.id === requestId);
    if (!request) return showNotification('Request not found', 'error');

    // Ensure request is submitted to backend before rejecting (so DB/S3 get updated)
    console.log('rejectRequest - current request object:', request);
    if (!request.letterId && !request.s3Key) {
        console.log('rejectRequest - request missing letterId and s3Key, attempting pre-submit');
        if (!API.SUBMIT_LETTER) {
            return showNotification('Cannot reject: request not submitted to server', 'error');
        }
        try {
            showNotification('Submitting request to server before rejecting...', 'info');
            const submitPayload = {
                rollNumber: request.rollNumber,
                studentName: request.studentName,
                department: request.department,
                section: request.section,
                year: request.year,
                reason: request.reason,
                startDate: request.startDate,
                endDate: request.endDate,
                additionalDetails: request.additionalDetails,
                submittedBy: request.submittedBy,
                letterText: `Respected Sir/Madam,\n\nI, ${request.studentName} (Roll: ${request.rollNumber}), request leave from ${request.startDate} to ${request.endDate} for ${request.reason.replace('-', ' ')}.\n\nDetails: ${request.additionalDetails || 'N/A'}\n\nRegards,\n${request.studentName}`,
                // send the local id so submit uses same pending key
                letterId: request.id
            };
            const subRes = await postJson(API.SUBMIT_LETTER, submitPayload);
            console.log('rejectRequest - pre-submit response:', subRes);
            request.letterId = subRes.letterId || request.letterId || request.id;
            request.s3Key = subRes.s3Key || request.s3Key || '';
            request.updatedAt = subRes.updatedAt || request.updatedAt;
            const rIdx = requests.findIndex(r => r.id === requestId);
            if (rIdx !== -1) requests[rIdx] = request;
            const hIdx = hodRequests.findIndex(r => r.id === requestId);
            if (hIdx !== -1) hodRequests[hIdx] = request;
            localStorage.setItem('requests', JSON.stringify(requests));
            localStorage.setItem('hodRequests', JSON.stringify(hodRequests));
            showNotification('Request submitted to server', 'success');
        } catch (err) {
            console.error('Pre-reject submit failed', err);
            return showNotification('Cannot reject: failed to submit request to server', 'error');
        }
    }

    const payload = { action: 'REJECTED', approvedBy: (currentUser && currentUser.name) || 'K. Dinesh' };
    if (request.letterId) payload.letterId = request.letterId;
    else if (request.s3Key) payload.s3Key = request.s3Key;
    else payload.letterId = request.id;

    try {
        showNotification('Rejecting request...', 'info');
        console.log('Reject payload', payload);
        let res = await postJson(API.APPROVE_LETTER, payload);
        if (typeof res === 'string') res = { message: res };
        console.log('Reject response', res);

        updateRequestStatus(requestId, 'rejected');
        const idxr = hodRequests.findIndex(r => r.id === requestId);
        if (idxr !== -1) {
            hodRequests[idxr].status = 'rejected';
            if (res.s3Key) hodRequests[idxr].s3Key = res.s3Key;
            if (res.approvedAt) hodRequests[idxr].approvedAt = res.approvedAt;
            if (res.approvedBy) hodRequests[idxr].approvedBy = res.approvedAt;
            if (res.updatedAt) hodRequests[idxr].updatedAt = res.updatedAt;
        }
        const idxr2 = requests.findIndex(r => r.id === requestId);
        if (idxr2 !== -1) {
            requests[idxr2].status = 'rejected';
            if (res.s3Key) requests[idxr2].s3Key = res.s3Key;
            if (res.approvedAt) requests[idxr2].approvedAt = res.approvedAt;
            if (res.approvedBy) requests[idxr2].approvedBy = res.approvedAt;
            if (res.updatedAt) requests[idxr2].updatedAt = res.updatedAt;
        }
        localStorage.setItem('hodRequests', JSON.stringify(hodRequests));
        localStorage.setItem('requests', JSON.stringify(requests));

        showNotification('Request rejected', 'error');
        updateHodDashboard();
    } catch (err) {
        console.error('Reject failed', err);
        showNotification('Reject failed: ' + (err.message || JSON.stringify(err)), 'error');
    }
}

function updateRequestStatus(requestId, status) {
    const hodRequestIndex = hodRequests.findIndex(req => req.id === requestId);
    if (hodRequestIndex !== -1) {
        hodRequests[hodRequestIndex].status = status;
        hodRequests[hodRequestIndex][`${status}At`] = new Date().toLocaleDateString();
        hodRequests[hodRequestIndex][`${status}By`] = 'K. Dinesh';
        localStorage.setItem('hodRequests', JSON.stringify(hodRequests));
    }
    
    const requestIndex = requests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
        requests[requestIndex].status = status;
        requests[requestIndex][`${status}At`] = new Date().toLocaleDateString();
        requests[requestIndex][`${status}By`] = 'K. Dinesh';
        localStorage.setItem('requests', JSON.stringify(requests));
    }
}

function previewLetter(requestId) {
    const request = hodRequests.find(req => req.id === requestId);
    if (!request) return;
    
    generatePermissionLetter(request);
    
    // Hide all action buttons for HOD preview
    setTimeout(() => {
        const forwardBtn = document.getElementById('forwardBtn');
        const downloadBtn = document.querySelector('.download-btn');
        const submitBtn = document.querySelector('.submit-btn');
        const generateBtn = document.querySelector('.generate-btn');
        
        if (forwardBtn) forwardBtn.style.display = 'none';
        if (downloadBtn) downloadBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
        if (generateBtn) generateBtn.style.display = 'none';
    }, 100);
}

function viewLetter(requestId) {
    const request = requests.find(req => req.id === requestId);
    if (!request) return;
    
    generatePermissionLetter(request);
    document.getElementById('forwardBtn').style.display = 'none';
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="font-weight: 500; margin-bottom: 0.25rem;">${getNotificationTitle(type)}</div>
        <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

function getNotificationTitle(type) {
    switch (type) {
        case 'success': return '✅ Success';
        case 'error': return '❌ Error';
        case 'info': return 'ℹ️ Info';
        default: return 'ℹ️ Notification';
    }
}

// Handle QR code scanning from mobile
function handleQRScan() {
    if (window.location.hash === '#manual-form') {
        setTimeout(() => {
            showScannerPage();
            showManualEntry(); // Go directly to manual entry
            showNotification('Permission request detected; please fill the form.', 'success');
        }, 500);
    }
    
    if (window.location.hash === '#permission-form') {
        setTimeout(() => {
            if (currentUser && currentUser.role === 'student') {
                showScannerPage();
                showManualEntry();
                showNotification('Permission request detected; please fill the form.', 'success');
            } else {
                showLogin('student');
                showNotification('Please login as student to access permission form', 'info');
            }
        }, 1000);
    }
}

// Check for QR scan on page load
window.addEventListener('load', handleQRScan);
window.addEventListener('hashchange', handleQRScan);

// Initialize faculty name if logged in as faculty
if (currentUser && currentUser.role === 'faculty') {
    const facultyNameElement = document.getElementById('facultyName');
    if (facultyNameElement) {
        facultyNameElement.textContent = currentUser.name;
    }
}
// Full-Page Scanner & Manual Entry Functions


function generateWorkingQR() {
    const qrDiv = document.getElementById('qrcode');
    if (!qrDiv) return;
    
    // Clear existing QR code
    qrDiv.innerHTML = '';
    
    // Try loading a static QR image first (support common names and the provided name)
    const candidateNames = ['@qrcode (1).png', 'qrcode.png', 'qr-code.png', 'qr.png'];
    let loadedStatic = false;

    const tryNextImage = (index) => {
        if (index >= candidateNames.length) {
            // No static image found — fall back to dynamic generation
            generateDynamicQR(qrDiv);
            return;
        }

        const img = new Image();
        img.alt = 'QR Code';
        img.style.maxWidth = '300px';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.onload = () => {
            qrDiv.innerHTML = '';
            qrDiv.appendChild(img);
            loadedStatic = true;
            console.log('Loaded static QR image:', candidateNames[index]);
        };
        img.onerror = () => {
            // Try next candidate
            tryNextImage(index + 1);
        };
        img.src = candidateNames[index];
    };

    tryNextImage(0);
}

// Helper to generate QR dynamically (keeps existing behavior)
function generateDynamicQR(qrDiv) {
    // Get current URL and create target URL
    const baseURL = window.location.origin + window.location.pathname.replace('index.html', '');
    const targetURL = baseURL + 'qr-entry.html';

    console.log('Generating QR for:', targetURL);

    try {
        // Create QR code using QRCode.js
        const qr = new QRCode(qrDiv, {
            text: targetURL,
            width: 300,
            height: 300,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        
        console.log('QR code generated successfully');
    } catch (error) {
        console.error('QR generation failed:', error);
        qrDiv.innerHTML = '<div style="width:300px;height:300px;border:2px solid #000;display:flex;align-items:center;justify-content:center;background:#fff;"><p>QR Generation Failed<br>Visit: qr-entry.html</p></div>';
    }
}



function showScanner() {
    // Safely toggle scanner UI (elements may be removed)
    const scannerOpt = document.getElementById('scanner-option');
    const manualOpt = document.getElementById('manual-option');
    const scannerSec = document.getElementById('scanner-section');
    const manualSec = document.getElementById('manual-section');
    if (scannerOpt) scannerOpt.classList.add('active');
    if (manualOpt) manualOpt.classList.remove('active');
    if (scannerSec) scannerSec.classList.add('active');
    if (manualSec) manualSec.classList.remove('active');
}

function showManualEntry() {
    // Safely toggle manual UI
    const scannerOpt = document.getElementById('scanner-option');
    const manualOpt = document.getElementById('manual-option');
    const scannerSec = document.getElementById('scanner-section');
    const manualSec = document.getElementById('manual-section');
    if (manualOpt) manualOpt.classList.add('active');
    if (scannerOpt) scannerOpt.classList.remove('active');
    if (manualSec) manualSec.classList.add('active');
    if (scannerSec) scannerSec.classList.remove('active');
}

// Updated permission form handler for full-page system
async function handlePermissionSubmit(e) {
    e.preventDefault();

    const formData = {
        id: generateId(),
        studentName: document.getElementById('formName').value.trim(),
        department: document.getElementById('formDept').value,
        section: document.getElementById('formSection').value,
        year: document.getElementById('formYear').value,
        gender: document.getElementById('formGender').value,
        reason: document.getElementById('permissionReason').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        additionalDetails: document.getElementById('additionalDetails').value,
        status: 'pending',
        submittedAt: new Date().toLocaleDateString(),
        submittedBy: currentUser ? currentUser.email : 'guest'
    };

    // Validate required fields
    if (!formData.studentName || !formData.reason || !formData.startDate || !formData.endDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Build a simple plain-text letter for backend storage
    const letterText = `Respected Sir/Madam,\n\nI, ${formData.studentName}, request leave from ${formData.startDate} to ${formData.endDate} for ${formData.reason.replace('-', ' ')}.\n\nDetails: ${formData.additionalDetails || 'N/A'}\n\nRegards,\n${formData.studentName}`;

    // Prepare payload for API
    const payload = {
        studentName: formData.studentName,
        department: formData.department,
        section: formData.section,
        year: formData.year,
        gender: formData.gender,
        reason: formData.reason,
        startDate: formData.startDate,
        endDate: formData.endDate,
        additionalDetails: formData.additionalDetails,
        submittedBy: formData.submittedBy,
        letterText: letterText
    };

    // Submit to backend if endpoint configured
    if (API.SUBMIT_LETTER) {
        try {
            showNotification('Submitting request...', 'info');
            const res = await postJson(API.SUBMIT_LETTER, payload);

            // On success, update formData to use server-provided id
            formData.id = res.letterId || formData.id;
            formData.s3Key = res.s3Key || '';
            formData.status = res.status ? res.status.toLowerCase() : 'pending';

            // Save locally
            requests.push(formData);
            localStorage.setItem('requests', JSON.stringify(requests));

            showNotification('Permission request submitted successfully!', 'success');

            // Render letter and UI updates
            generateFullPageLetter(formData);
            showLetterPage();
            updateStudentDashboard();
        } catch (err) {
            console.error('Submission failed', err);
            showNotification('Submission failed: ' + err.message, 'error');
        }
    } else {
        // Fallback: local-only behavior
        requests.push(formData);
        localStorage.setItem('requests', JSON.stringify(requests));
        showNotification('Permission request submitted locally (no API configured)', 'info');
        generateFullPageLetter(formData);
        showLetterPage();
        updateStudentDashboard();
    }
}

// Full-page letter generation
function generateFullPageLetter(requestData) {
    const letterContent = `
        <div class="letter-header">
            <img src="logo.jpg" alt="MITS Logo" style="width: 100%; max-width: 600px; height: auto; margin-bottom: 1rem;">
        </div>

        <div class="letter-date">
            Date: <i>${new Date().toLocaleDateString()}</i>
        </div>

        <div class="recipient">
            To,<br>
            The Principal,<br>
            <span class="italic-bold">Madanapalle Institute of Technology and Science,</span><br>
            Madanapalle.
        </div>

        <div class="salutation">
            Respected Sir/Madam,
        </div>

        <div class="letter-content">
            <p>I am writing this letter to request your kind permission for my ward, <span class="italic-bold">${requestData.studentName}</span>, studying in <span class="italic-bold">B.Tech ${requestData.department} - ${requestData.year} Year, Section ${requestData.section}</span>, to leave the institute premises.</p>
            
            <p>The reason for this leave is <span class="italic-bold" style="background-color: yellow; padding: 2px 4px;">${requestData.reason.replace('-', ' ').toUpperCase()}</span>. We request a leave for <span class="italic-bold">${calculateDays(requestData.startDate, requestData.endDate)}</span> day(s) from <span class="italic-bold">${formatDate(requestData.startDate)}</span> to <span class="italic-bold">${formatDate(requestData.endDate)}</span>.</p>
            
            <p>I assure you that <span class="italic-bold">${requestData.studentName}</span> will catch up on any missed classes and assignments upon returning to the institute. I take full responsibility for my ward's safety and conduct during this period of leave.</p>
            
            <p>I kindly request you to consider my application and grant the necessary permission. Your understanding and cooperation in this regard would be highly appreciated.</p>
            
            ${requestData.additionalDetails ? `<p><strong>Additional Details:</strong> ${requestData.additionalDetails}</p>` : ''}
        </div>

        <div class="closing">
            Thanking You,
        </div>

        <div class="letter-signature">
            ${requestData.status === 'approved' ? 
                `<div class="hod-signature">K. Dinesh</div>
                 <div>Head of Department</div>
                 <div>Computer Science & Technology</div>
                 <div class="signature-line">HOD Signature</div>` : 
                `<div>Yours Obediently,</div>
                 <div class="signature-line">Parent/Guardian Signature</div>`
            }
        </div>
        
        ${requestData.status === 'approved' ? 
            `<div style="position: absolute; bottom: 50px; left: 50px; width: 120px; height: 120px; border: 3px solid var(--primary-green); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; color: var(--primary-green); text-align: center; transform: rotate(-15deg); opacity: 0.8; background: rgba(96, 108, 56, 0.1);">
                <div>APPROVED</div>
                <div>HOD - CST</div>
                <div>MITS</div>
             </div>` : ''
        }
    `;
    
    document.getElementById('permissionLetter').innerHTML = letterContent;
}

function showLetterPage() {
    showPage('letter-page');
}

// Updated letter action functions
function forwardToHOD() {
    const currentRequest = requests[requests.length - 1]; // Get the latest request
    if (!currentRequest) return;
    
    if (!hodRequests.find(req => req.id === currentRequest.id)) {
        hodRequests.push(currentRequest);
        localStorage.setItem('hodRequests', JSON.stringify(hodRequests));
    }
    
    showNotification('Request forwarded to HOD for approval', 'success');
    
    setTimeout(() => {
        showStudentDashboard();
    }, 2000);
}

function downloadLetter() {
    showNotification('PDF download feature will be implemented soon', 'info');
}

// Updated QR code function to use full-page system
function showQRCode() {
    showScannerPage();
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Update existing viewLetter function to use full-page system
function viewLetter(requestId) {
    const request = requests.find(req => req.id === requestId);
    if (!request) return;
    
    generateFullPageLetter(request);
    showLetterPage();
}

// Update existing previewLetter function for HOD
function previewLetter(requestId) {
    const request = hodRequests.find(req => req.id === requestId);
    if (!request) return;
    
    generateFullPageLetter(request);
    showLetterPage();
    
    // Hide action buttons for HOD preview
    setTimeout(() => {
        const downloadBtn = document.querySelector('.download-btn');
        const forwardBtn = document.querySelector('.forward-btn');
        const generateBtn = document.querySelector('.secondary-btn');
        const submitBtn = document.querySelector('.submit-btn');
        
        if (downloadBtn) downloadBtn.style.display = 'none';
        if (forwardBtn) forwardBtn.style.display = 'none';
        if (generateBtn) generateBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
    }, 100);
}

// Mobile responsive QR code size adjustment
function adjustQRCodeSize() {
    const qrCode = document.querySelector('.qr-code');
    if (qrCode && window.innerWidth <= 768) {
        qrCode.setAttribute('width', '250');
        qrCode.setAttribute('height', '250');
        qrCode.setAttribute('viewBox', '0 0 250 250');
    } else if (qrCode) {
        qrCode.setAttribute('width', '300');
        qrCode.setAttribute('height', '300');
        qrCode.setAttribute('viewBox', '0 0 300 300');
    }
}

// Add event listener for window resize
window.addEventListener('resize', adjustQRCodeSize);
window.addEventListener('load', adjustQRCodeSize);

// Update form validation
function validatePermissionForm() {
    const requiredFields = ['formName', 'permissionReason', 'startDate', 'endDate'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.style.borderColor = '#dc2626';
            isValid = false;
        } else {
            field.style.borderColor = 'transparent';
        }
    });
    
    // Validate date range
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (endDate < startDate) {
        document.getElementById('endDate').style.borderColor = '#dc2626';
        showNotification('End date cannot be before start date', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Add real-time form validation
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('permission-form');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required') && !this.value.trim()) {
                    this.style.borderColor = '#dc2626';
                } else {
                    this.style.borderColor = 'transparent';
                }
            });
            
            input.addEventListener('input', function() {
                if (this.value.trim()) {
                    this.style.borderColor = 'var(--primary-green)';
                }
            });
        });
    }
});