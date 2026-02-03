import os
import json
import logging
import time
from datetime import datetime, timezone

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config via environment
BUCKET_NAME = os.environ.get("BUCKET_NAME", "smartleavegateway-letters")
TABLE_NAME = os.environ.get("TABLE_NAME", "SmartLeaveLetters")
APPROVER_NAME = os.environ.get("APPROVER_NAME", "HOD")
# Tunable network timeouts / retries (avoid Lambda timing out)
# Keep low timeouts/retries so the function fails fast when the environment cannot reach AWS
# (important when Lambda timeout is small during tests).
import json
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

# Simple approval lambda based on your submit lambda style
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

eval TABLE_NAME
TABLE_NAME = "SmartLeaveLetters"
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):

    # ---------- CORS ----------
    if event.get("httpMethod") == "OPTIONS":
        return response(200, "")

    # ---------- Read Body ----------
    body = None

    if isinstance(event.get("body"), str):
        try:
            body = json.loads(event["body"])
        except Exception:
            return response(400, {"error": "Invalid JSON body"})
    elif isinstance(event.get("body"), dict):
        body = event["body"]
    elif event.get("letterId") or event.get("s3Key"):
        # allow direct top-level invocation
        body = event
    else:
        return response(400, {"error": "No body found or missing required fields", "receivedKeys": list(event.keys())})

    # ---------- Required Fields ----------
    action = (body.get("action") or "").upper()
    if action not in ("APPROVED", "REJECTED"):
        return response(400, {"error": "action must be APPROVED or REJECTED"})

    letter_id = body.get("letterId")
    s3_key_hint = body.get("s3Key")
    approver = body.get("approvedBy", APPROVER_NAME)

    if not letter_id and not s3_key_hint:
        return response(400, {"error": "letterId or s3Key is required"})

    # ---------- Lookup DB item ----------
    try:
        item = None
        if letter_id:
            resp = table.get_item(Key={"letterId": letter_id})
            item = resp.get("Item")

        if not item and s3_key_hint:
            # fallback search by s3Key — be flexible: try exact match, then basename contains,
            # and then rollNumber + basename match. Add logging for debug when not found.
            logger.info("Attempting fallback lookup by s3Key hint: %s", s3_key_hint)
            try:
                # Exact match
                resp = table.scan(FilterExpression=Attr('s3Key').eq(s3_key_hint), Limit=1)
                items = resp.get("Items", [])
                if not items:
                    # Try basename contains (handles different prefixes/roll naming)
                    base = s3_key_hint.split('/')[-1]
                    resp = table.scan(FilterExpression=Attr('s3Key').contains(base), Limit=1)
                    items = resp.get("Items", [])
                if not items and '/' in s3_key_hint:
                    # Try rollNumber + basename combination
                    roll = s3_key_hint.split('/')[0]
                    resp = table.scan(FilterExpression=(Attr('rollNumber').eq(roll) & Attr('s3Key').contains(base)), Limit=1)
                    items = resp.get("Items", [])
                if items:
                    item = items[0]
                    letter_id = item.get("letterId")
                else:
                    logger.info("No item found in fallback s3Key lookup for hint: %s", s3_key_hint)
            except ClientError as e:
                logger.exception("DynamoDB scan by s3Key failed")
                return response(500, {"error": "Database error", "details": str(e)})
    except ClientError as e:
        return response(500, {"error": "Database error", "details": str(e)})

    if not item:
        return response(404, {"error": "Letter not found"})

    # Prevent re-processing a finalized letter
    current_status = (item.get('status') or '').upper()
    if current_status in ('APPROVED', 'REJECTED'):
        # If already in same state, return success; otherwise indicate already finalized
        if current_status == action:
            return response(200, {"message": f"Letter already {action}", "s3Key": item.get('s3Key'), "approvedAt": item.get('approvedAt'), "approvedBy": item.get('approvedBy')})
        return response(409, {"error": "Letter already finalized", "status": current_status})

    old_key = item.get("s3Key")
    if not old_key:
        return response(404, {"error": "Original letter S3 key missing"})

    # ---------- Read original letter from S3 ----------
    try:
        old_obj = s3.get_object(Bucket=BUCKET_NAME, Key=old_key)
        letter_text = old_obj["Body"].read().decode('utf-8')
    except ClientError as e:
        code = e.response.get('Error', {}).get('Code')
        if code in ("NoSuchKey", "404", "NotFound"):
            return response(404, {"error": "Original letter object not found in storage"})
        return response(500, {"error": "Failed to read letter from storage", "details": str(e)})

    # ---------- Prepare updated content (overwrite same object) ----------
    now = datetime.now()
    updated_text = letter_text + f"\n\nStatus: {action}\nApproved by {approver}"

    # Write updated letter back to the same key (so there's only one object)
    try:
        s3.put_object(Bucket=BUCKET_NAME, Key=old_key, Body=updated_text.encode('utf-8'), ContentType='text/plain')
    except ClientError as e:
        return response(500, {"error": "Failed to write updated letter to storage", "details": str(e)})

    # ---------- Update DynamoDB with a conditional expression to avoid races ----------
    updated_at = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    approved_at = now.strftime("%d/%m/%Y")
    try:
        table.update_item(
            Key={"letterId": letter_id},
            UpdateExpression="SET #s = :s, approvedAt = :a, approvedBy = :b, updatedAt = :u",
            ConditionExpression=(Attr('status').ne('APPROVED') & Attr('status').ne('REJECTED')),
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":s": action,
                ":a": approved_at,
                ":b": approver,
                ":u": updated_at
            }
        )
    except ClientError as e:
        code = e.response.get('Error', {}).get('Code')
        # If conditional check failed, try to revert S3 to original content and return conflict
        if code == 'ConditionalCheckFailedException':
            try:
                s3.put_object(Bucket=BUCKET_NAME, Key=old_key, Body=letter_text.encode('utf-8'), ContentType='text/plain')
            except Exception:
                logger.exception('Failed to revert S3 object after conditional DB failure')
            return response(409, {"error": "Letter already finalized by another request"})
        # Other DB errors -> attempt to revert S3 and return 500
        try:
            s3.put_object(Bucket=BUCKET_NAME, Key=old_key, Body=letter_text.encode('utf-8'), ContentType='text/plain')
        except Exception:
            logger.exception('Failed to revert S3 object after DB update failure')
        return response(500, {"error": "Failed to update approval status in DB", "details": str(e)})

    # ---------- Success ----------
    # Success: return both keys for clarity
    return response(200, {
        "message": f"Letter {action}",
        "pendingS3Key": old_key,
        "finalS3Key": new_key,
        "s3Key": new_key,  # backward compatible
        "letterId": letter_id,
        "status": action,
        "approvedAt": approved_at,
        "approvedBy": approver,
        "updatedAt": updated_at
    })


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        "body": body if isinstance(body, str) else json.dumps(body),
    }
