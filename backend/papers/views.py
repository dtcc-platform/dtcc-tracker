import json
from urllib.parse import unquote
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import IntegrityError
from .models import Paper, Project, ChatMessage
from .serializers import PaperSerializer, ProjectSerializer, CustomTokenVerifySerializer, UserSerializer
import requests
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenVerifyView
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.permissions import IsAdminUser
import boto3
import re
from botocore.exceptions import ClientError

class CustomTokenVerifyView(TokenVerifyView):
    serializer_class = CustomTokenVerifySerializer

# Bedrock configuration
BEDROCK_MODEL_ID = "meta.llama3-70b-instruct-v1:0"
BEDROCK_REGION = "us-west-2"

class ChatbotView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self):
        super().__init__()
        # Initialize Bedrock client
        self.bedrock_client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)

    def post(self, request):
        """
        Handles a new user message. Sends the last N messages + the new user message to Bedrock,
        gets a reply, stores it, and returns it.
        """
        user = request.user
        message = request.data.get("message", "")
        if not message:
            return Response({"error": "Message is required"}, status=400)

        # Store user message
        ChatMessage.objects.create(
            user=user,
            role="user",
            content=message
        )

        # Get recent messages for context
        recent_messages = ChatMessage.objects.filter(user=user).order_by("-created_at")[:10]
        recent_messages = reversed(recent_messages)  # so oldest appears first in the prompt

        # Build chat log
        chat_log = ""
        for msg in recent_messages:
            chat_log += f"{msg.role}: {msg.content}\n"

        # Create the system prompt and user message
        system_prompt = """You are a helpful AI assistant. When the user wants to register a project or a paper, 
                        you should include an intent field in JSON form.
                        The JSON should be like {
                            "intent": "register_project",
                            "answer": "Your actual answer to the users question"}
                            Valid intents are chitchat register_project register_paper.
                            even if the intent is chitchat you should still give an answer field and communicate with the user.
                            """

        # Format the prompt in Llama 3's instruction format
        formatted_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
        {system_prompt}
        <|eot_id|><|start_header_id|>user<|end_header_id|>
        {chat_log}
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>
        """

        # Format the request payload using the model's native structure
        native_request = {
            "prompt": formatted_prompt,
            "max_gen_len": 512,
            "temperature": 0.5,
        }

        try:
            # Convert the native request to JSON
            request_body = json.dumps(native_request)
            
            # Invoke the model with the request
            response = self.bedrock_client.invoke_model(
                modelId=BEDROCK_MODEL_ID, 
                body=request_body
            )
            
            # Decode the response body
            model_response = json.loads(response["body"].read())
            
            # Extract the response text
            bot_reply_raw = model_response["generation"]
            print(f"Raw Bedrock response: {bot_reply_raw}")
            
            # Extract JSON from the response (same logic as before)
            match = re.search(r"\{.*?\}", bot_reply_raw, re.DOTALL)
            if not match:
                # Fallback if no JSON found
                return Response(
                    {"error": "Could not parse response from AI model"},
                    status=500
                )
            
            json_answer = match.group(0)
            print(f"Extracted JSON: {json_answer}")
            
            try:
                parsed = json.loads(json_answer)
            except json.JSONDecodeError:
                return Response(
                    {"error": "Invalid JSON response from AI model"},
                    status=500
                )

            intent = parsed.get("intent", "none")
            bot_reply = parsed.get("answer", "")
            
            # Store assistant message
            ChatMessage.objects.create(
                user=user,
                role="assistant",
                content=bot_reply
            )
            
            print(f"Intent: {intent}")
            print(f"Chat log: {chat_log}")
            
            return Response({"response": bot_reply, 'intent': intent})

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            print(f"AWS ClientError: {error_code} - {error_message}")
            
            if error_code == 'ValidationException':
                return Response(
                    {"error": "Model validation error. Check model availability and request format."},
                    status=500
                )
            elif error_code == 'AccessDeniedException':
                return Response(
                    {"error": "Access denied. Check IAM permissions and model access."},
                    status=500
                )
            elif error_code == 'ResourceNotFoundException':
                return Response(
                    {"error": "Model not found. Check model ID and availability."},
                    status=500
                )
            else:
                return Response(
                    {"error": f"AWS error: {error_message}"},
                    status=500
                )
                
        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response(
                {"error": "An unexpected error occurred while processing your request."},
                status=500
            )

    def delete(self, request):
        """
        Clears chat history for the current user, e.g. on "Reset Chat" or logout.
        """
        user = request.user
        ChatMessage.objects.filter(user=user).delete()
        return Response({"message": "Chat history cleared"})
    
class ClearChatHistory(APIView):
    def post(self, request):
        request.session.flush()  # Clears session, including chat history
        return Response({"message": "Cleared History successfully"})
    
@csrf_exempt
def forgot_password(request):
    """
    POST: { "email": "user@example.com" }
    """
    if request.method == "POST":
        email = request.POST.get("email") or request.GET.get("email") or ""

        # 1. Find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # If user not found, return generic success or error as you prefer
            return JsonResponse({
                "success": True, 
                "message": "If the email is valid, a reset link has been sent."
            })

        # 2. Generate a password reset token
        token = default_token_generator.make_token(user)

        # 3. Encode the user’s primary key (id) in base 64
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # 4. Construct the reset URL
        #    This should match whatever route your front-end or Django app 
        #    handles to actually reset the password.
        #    Example: "https://yourfrontend.com/reset/<uid>/<token>"
        reset_link = f"https://yourfrontend.com/reset/{uid}/{token}"

        # 5. Build an email message that includes the username and the reset link
        subject = "Password Reset Request"
        message = (
            f"Hi {user.username},\n\n"
            "You requested a password reset.\n\n"
            f"Use the link below to reset your password:\n{reset_link}\n\n"
            "If you did not request this, please ignore this email.\n"
        )

        # 6. Send the email
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return JsonResponse({
            "success": True, 
            "message": "If the email is valid, a reset link has been sent."
        })

    return JsonResponse({"error": "Method not allowed."}, status=405)
@csrf_exempt  # Disable CSRF for API requests (use CORS instead for security)
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(request, username=username, password=password)
            if user is not None:
                refresh = RefreshToken.for_user(user)  # Generate JWT tokens
                return JsonResponse({
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "is_superuser": user.is_superuser
                    }
                }, status=200)
            else:
                return JsonResponse({"error": "Invalid username or password"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request format"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)



class PaperListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        If superuser, fetch all projects;
        otherwise fetch only projects belonging to this user.
        """
        if request.user.is_superuser:
            papers = Paper.objects.all()
        else:
            papers = Paper.objects.filter(user=request.user)
        serializer = PaperSerializer(papers, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new paper and associate it with the authenticated user."""
        serializer = PaperSerializer(data=request.data, context={'request': request})  # Pass request context
        if serializer.is_valid():
            try:
                serializer.save(user=request.user)  # Assign user automatically
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response(
                    {"error": "Duplicate DOI error", "field": "doi"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        errors = serializer.errors.copy()
        if 'non_field_errors' in errors:
            errors['error'] = 'Duplicate key error'  # use the first error message
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

class PaperDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if request.user.is_superuser:
            paper = get_object_or_404(Paper, pk=pk)
        else:
            paper = get_object_or_404(Paper, pk=pk, user=request.user)

        paper.delete()
        return JsonResponse({"message": "Paper deleted successfully"}, status=200)

class PaperUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        if request.user.is_superuser:
            paper = get_object_or_404(Paper, pk=pk)
        else:
            paper = get_object_or_404(Paper, pk=pk, user=request.user)

        # If the user wants to rename the project:
        new_doi = request.data.get("doi")
        if new_doi and new_doi != paper.doi:
            # Still ensure not to conflict with that same user's other projects.
            # If you want it to be globally unique, remove "user=project.user."
            if Paper.objects.filter(doi=new_doi, user=paper.user).exists():
                return Response({"error": "Project already exists"}, status=status.HTTP_400_BAD_REQUEST)
            paper.doi = new_doi

        serializer = PaperSerializer(paper, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        If superuser, fetch all projects;
        otherwise fetch only projects belonging to this user.
        """
        if request.user.is_superuser:
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(user=request.user)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new project and associate it with the authenticated user."""

        serializer = ProjectSerializer(data=request.data, context={'request': request})  # Pass request context

        if serializer.is_valid():
            serializer.save()  # No need to manually pass user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        
        errors = serializer.errors.copy()
        if 'non_field_errors' in errors:
            errors['error'] = 'Duplicate key error'  # use the first error message
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)



class ProjectDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        """
        If the user is a superuser, allow deleting any project.
        Otherwise, ensure the project belongs to the request user.
        """
        if request.user.is_superuser:
            # Superuser can delete any project
            project = get_object_or_404(Project, pk=pk)
        else:
            # Regular user can only delete their own project
            project = get_object_or_404(Project, pk=pk, user=request.user)

        project.delete()
        return JsonResponse({"message": "Project deleted successfully"}, status=200)

class ProjectUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        if request.user.is_superuser:
            project = get_object_or_404(Project, pk=pk)
        else:
            project = get_object_or_404(Project, pk=pk, user=request.user)

        # If the user wants to rename the project:
        new_name = request.data.get("project_name")
        if new_name and new_name != project.project_name:
            # Still ensure not to conflict with that same user's other projects.
            # If you want it to be globally unique, remove "user=project.user."
            if Project.objects.filter(project_name=new_name, user=project.user).exists():
                return Response({"error": "Project already exists"}, status=status.HTTP_400_BAD_REQUEST)
            project.project_name = new_name

        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def fetch_doi_metadata(doi):
    """Fetch metadata for a given DOI from Crossref API."""
    base_url = "https://api.crossref.org/works/"
    response = requests.get(base_url + doi)

    if response.status_code == 200:
        data = response.json()
        if 'message' in data:
            message = data['message']

            title = message.get('title', ['N/A'])[0]
            authors_data = message.get('author', [])

            if authors_data:
                main_author = f"{authors_data[0].get('given', 'N/A')} {authors_data[0].get('family', 'N/A')}"
                additional_authors = [
                    f"{author.get('given', 'N/A')} {author.get('family', 'N/A')}"
                    for author in authors_data[1:]
                ]
            else:
                main_author = "N/A"
                additional_authors = []

            published_date = "N/A"
            if 'issued' in message and 'date-parts' in message['issued']:
                date_parts = message['issued']['date-parts'][0]
                published_date = "-".join(map(str, date_parts))

            publisher = message.get('publisher', 'N/A')
            journal = message.get('container-title', ['N/A'])[0]

            metadata = {
                "Title": title,
                "Authors": {
                    "Main Author": main_author,
                    "Additional Authors": additional_authors
                },
                "PublishedOn": published_date,
                "Publisher": publisher,
                "DOI": doi,
                "Journal": journal
            }
            return metadata
        else:
            return {"error": "Invalid response structure from Crossref API."}
    else:
        return {"error": f"Failed to fetch metadata for DOI {doi}. HTTP Status: {response.status_code}"}

class DOIInfoView(APIView):
    def post(self, request):
        """Fetch DOI metadata from Crossref API."""
        doi = request.data.get('doi')
        if not doi:
            return Response({"error": "DOI is required"}, status=status.HTTP_400_BAD_REQUEST)

        metadata = fetch_doi_metadata(doi)
        
        if "error" in metadata:
            return Response(metadata, status=status.HTTP_400_BAD_REQUEST)

        return Response(metadata, status=status.HTTP_200_OK)
    

class UserListCreateAPIView(APIView):
    permission_classes = [IsAdminUser]  # Only admin/superuser can access

    def get(self, request):
        """List all users."""
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new user."""
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()  # will call create() in serializer, hashing password
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        return User.objects.get(pk=pk)

    def get(self, request, pk):
        """Retrieve a specific user."""
        user = self.get_object(pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        """Partial update of a user."""
        user = self.get_object(pk)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()  # will call update() in serializer, hashing password if provided
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete a user."""
        user = self.get_object(pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
