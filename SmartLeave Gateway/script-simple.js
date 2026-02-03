// =======================
// STUDENT SIGNUP
// =======================
document.getElementById("signupForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const full_name = document.getElementById("full_name").value;
    const college_mail = document.getElementById("college_mail").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(
            "https://gih9r2rsc3.execute-api.ap-south-1.amazonaws.com/dev/signup",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: full_name,
                    college_mail: college_mail,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (response.status === 200) {
            document.getElementById("signupMessage").style.color = "green";
            document.getElementById("signupMessage").innerText = data.message;
        } else {
            // Handle error responses (409, 400, etc.)
            let errorMessage = "Signup failed";
            
            if (data.body) {
                // Parse the nested JSON response from Lambda
                try {
                    const bodyData = JSON.parse(data.body);
                    errorMessage = bodyData.message || errorMessage;
                } catch (e) {
                    errorMessage = data.body;
                }
            } else if (data.message) {
                errorMessage = data.message;
            }
            
            document.getElementById("signupMessage").innerText = errorMessage;
        }

    } catch (error) {
        document.getElementById("signupMessage").innerText = "Server error. Try again.";
    }
});


// =======================
// STUDENT LOGIN
// =======================
document.getElementById("loginForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const college_mail = document.getElementById("login_college_mail").value;
    const password = document.getElementById("login_password").value;

    try {
        const response = await fetch(
            "https://gih9r2rsc3.execute-api.ap-south-1.amazonaws.com/dev/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    college_mail: college_mail,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (data.success) {
            document.getElementById("loginMessage").style.color = "green";
            document.getElementById("loginMessage").innerText = data.message;
            // redirect if needed
            // window.location.href = "dashboard.html";
        } else {
            document.getElementById("loginMessage").innerText = data.message;
        }

    } catch (error) {
        document.getElementById("loginMessage").innerText = "Server error. Try again.";
    }
});