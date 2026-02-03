import json
import boto3
import hashlib

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SmartLeave-Gateway')

def lambda_handler(event, context):

    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }

    # CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }

    try:
        # Extract body
        body = json.loads(event["body"]) if event.get("body") else event

        college_mail = body.get("college_mail")
        password = body.get("password")

        if not college_mail or not password:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "success": False,
                    "message": "Email and password are required"
                })
            }

        # Normalize email
        college_mail = college_mail.lower()

        # Validate domain
        if not college_mail.endswith("@mits.ac.in"):
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid college email"
                })
            }

        # Validate roll number length
        roll_no = college_mail.split("@")[0]
        if len(roll_no) != 10:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid roll number format"
                })
            }

        # Fetch user
        response = table.get_item(
            Key={
                "college_mail": college_mail,
                "user_type": "student"
            }
        )

        if "Item" not in response:
            return {
                "statusCode": 401,
                "headers": headers,
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid email or password"
                })
            }

        user = response["Item"]

        # Hash input password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        if user["password"] != hashed_password:
            return {
                "statusCode": 401,
                "headers": headers,
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid email or password"
                })
            }

        # Successful login - return user data
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "success": True,
                "message": "Login successful",
                "user": {
                    "name": user.get("full_name", "Student"),
                    "email": user["college_mail"],
                    "rollNumber": user.get("roll_no", roll_no)
                }
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({
                "success": False,
                "message": "Internal server error"
            })
        }