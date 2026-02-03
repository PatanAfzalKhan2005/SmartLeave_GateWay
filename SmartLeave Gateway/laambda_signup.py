import json
import boto3
import hashlib
import uuid
import datetime
import re

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SmartLeave-Gateway')

def lambda_handler(event, context):

    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }

    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }

    try:
        # Extract request body
        body = json.loads(event["body"]) if "body" in event and event["body"] else event

        full_name = body.get("full_name")
        college_mail = body.get("college_mail")
        password = body.get("password")

        if not all([full_name, college_mail, password]):
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"message": "full_name, college_mail, and password are required"})
            }

        # Convert email to lowercase
        college_mail = college_mail.lower()

        # Validate email domain
        if not college_mail.endswith("@mits.ac.in"):
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"message": "Email must end with @mits.lc.in"})
            }

        # Extract roll number from email
        roll_no = college_mail.split("@")[0]

        # Validate roll number length (first 10 characters)
        if len(roll_no) != 10:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"message": "Invalid roll number length in email"})
            }

        # Optional: strict alphanumeric validation
        if not re.match("^[a-z0-9]+$", roll_no):
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"message": "Roll number must be alphanumeric"})
            }

        # Check if user already exists
        try:
            existing = table.get_item(
                Key={
                    "college_mail": college_mail,
                    "user_type": "student"
                }
            )
            
            if "Item" in existing:
                return {
                    "statusCode": 409,
                    "headers": headers,
                    "body": json.dumps({"message": "Email already registered"})
                }
        except Exception as e:
            print(f"Error checking existing user: {str(e)}")
            # Continue with registration if check fails

        # Hash password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Store user in DynamoDB with condition to prevent overwrite
        try:
            table.put_item(
                Item={
                    "college_mail": college_mail,
                    "user_type": "student",
                    "full_name": full_name,
                    "roll_no": roll_no,
                    "password": hashed_password,
                    "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                },
                ConditionExpression="attribute_not_exists(college_mail)"
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return {
                "statusCode": 409,
                "headers": headers,
                "body": json.dumps({"message": "Email already registered"})
            }

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "message": "Signup successful",
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
