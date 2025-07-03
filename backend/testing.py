import boto3
import json
from botocore.exceptions import ClientError

# Create a Bedrock Runtime client in the AWS Region of your choice.
client = boto3.client("bedrock-runtime", region_name="us-west-2")

# Set the model ID, e.g., Llama 3 70b Instruct.
model_id = "meta.llama3-70b-instruct-v1:0"

# Define the prompt for the model.
prompt = "What is the capital of France?"

# Embed the prompt in Llama 3's instruction format.
formatted_prompt = f"""<|begin_of_text|><|start_header_id|>user<|end_header_id|>
{prompt}
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""

# Format the request payload using the model's native structure.
native_request = {
    "prompt": formatted_prompt,
    "max_gen_len": 512,
    "temperature": 0.5,
}

# Convert the native request to JSON.
request = json.dumps(native_request)

try:
    # Invoke the model with the request.
    response = client.invoke_model(modelId=model_id, body=request)
    
    # Decode the response body.
    model_response = json.loads(response["body"].read())
    
    # Extract and print the response text.
    response_text = model_response["generation"]
    print("Response:", response_text)
    
except ClientError as e:
    error_code = e.response['Error']['Code']
    error_message = e.response['Error']['Message']
    print(f"AWS ClientError: {error_code} - {error_message}")
    
    # Common error troubleshooting
    if error_code == 'ValidationException':
        print("This might be due to:")
        print("- Model not available in your region")
        print("- Incorrect model ID")
        print("- Invalid request format")
    elif error_code == 'AccessDeniedException':
        print("This might be due to:")
        print("- Insufficient IAM permissions")
        print("- Model access not granted in AWS Bedrock console")
    elif error_code == 'ResourceNotFoundException':
        print("This might be due to:")
        print("- Model ID not found or not available")
        
except Exception as e:
    print(f"Unexpected error: {e}")
    print("This might be due to:")
    print("- Network connectivity issues")
    print("- AWS credentials not configured")
    print("- boto3 not installed or outdated")

# Optional: Print debug information
print(f"\nUsing model: {model_id}")
print(f"Region: us-west-2")
print(f"Formatted prompt: {repr(formatted_prompt)}")