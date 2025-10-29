import json
from urllib.parse import unquote
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import IntegrityError
from .models import Paper, Project, ChatMessage
from .serializers import PaperSerializer, ProjectSerializer, CustomTokenVerifySerializer, SuperuserPaperSerializer, UserSerializer
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
from django_ratelimit.decorators import ratelimit
import boto3
import re
from botocore.exceptions import ClientError

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class CustomTokenVerifyView(TokenVerifyView):
    serializer_class = CustomTokenVerifySerializer

# Bedrock configuration
BEDROCK_MODEL_ID = "meta.llama3-70b-instruct-v1:0"
BEDROCK_REGION = "us-west-2"

class ChatbotView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self):
        super().__init__()
        self.bedrock_client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)

    def post(self, request):
        """
        Enhanced chatbot that can handle project/paper registration automatically
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
        recent_messages = reversed(recent_messages)

        # Build chat log
        chat_log = ""
        for msg in recent_messages:
            chat_log += f"{msg.role}: {msg.content}\n"

        # Enhanced system prompt with registration capabilities
        system_prompt = """You are a helpful AI assistant that can register projects and papers for users. You cant fetch metadata from the web. Only manual.

        When a user wants to register a project, you need these fields:
        - project_name (required, string)
        - status (required, string) This field can only take 3 values Draft | Submitted | Approved
        - pi (optional, string, Principal Investigator)
        - funding_body (optional, string) This field can only have 6 values EU | VR | Vinnova | Formas | Trafikverket | Energimundiheten
        - documents (optional, string)
        - additional_authors (optional, list of strings)

        When a user wants to register a paper, you need these fields:
        - doi (required, string, unique identifier)
        - title (required, string)
        - author_name (required, string, main author)
        - journal (required, string)
        - date (required, string)
        - additional_authors (optional, list of strings)

        Your response should ALWAYS be in JSON format with these fields:
        {
            "intent": "chitchat" | "register_project" | "register_paper" | "collect_info",
            "answer": "Your conversational response to the user, dont forget to ask for extra inputs or correct users mistake if they entered something wrong",
            "action": "none" | "register_project" | "register_paper" | "ask_for_info",
            "collected_data": {
                // Only include fields that the user has provided
                // For projects: project_name, status, pi, funding_body, documents, additional_authors
                // For papers: doi, title, author_name, journal, date, additional_authors
            },
            "missing_fields": [
                // List of required fields that are still missing
            ],
        }

        Rules:
        1. If user expresses intent to register but hasn't provided all required fields, set action to "ask_for_info"
        2. If user provides partial information, collect what they gave and ask for what's missing
        3. Only set action to "register_project" or "register_paper" when ALL required fields are collected
        4. Be conversational and helpful - don't just ask for fields in a robotic way
        5. Remember information from previous messages in the conversation
        6. The user must enter manually the data, the model doesnt need to fetch anything
        7. Try to ask for all required fields at once, not one by one and ask for more incase the user did not provide everything
        """

        # Format the prompt
        formatted_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
        {system_prompt}
        <|eot_id|><|start_header_id|>user<|end_header_id|>
        {chat_log}
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>
        """

        # Format the request payload
        native_request = {
            "prompt": formatted_prompt,
            "max_gen_len": 1024,
            "temperature": 0.3,
        }

        try:
            request_body = json.dumps(native_request)
            response = self.bedrock_client.invoke_model(
                modelId=BEDROCK_MODEL_ID, 
                body=request_body
            )
            
            model_response = json.loads(response["body"].read())
            bot_reply_raw = model_response["generation"]
            print(f"Raw Bedrock response: {bot_reply_raw}")
            
            # Extract JSON from the response
            def extract_json_from_response(response_text):
                """
                Extract JSON from response text, handling nested objects properly
                """
                # Find the start of JSON
                start_idx = response_text.find('{')
                if start_idx == -1:
                    return None
                
                # Count braces to find the matching closing brace
                brace_count = 0
                for i, char in enumerate(response_text[start_idx:], start_idx):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            # Found the matching closing brace
                            return response_text[start_idx:i+1]
                
                # If we get here, no matching closing brace was found
                return None
            json_answer = extract_json_from_response(bot_reply_raw)
            if not json_answer:
                return Response(
                    {"error": "Could not parse response from AI model"},
                    status=500
                )
            print(f"Extracted JSON: {json_answer}")
            
            try:
                parsed = json.loads(json_answer)
            except json.JSONDecodeError:
                return Response(
                    {"error": "Invalid JSON response from AI model"},
                    status=500
                )

            intent = parsed.get("intent", "chitchat")
            bot_reply = parsed.get("answer", "")
            action = parsed.get("action", "none")
            collected_data = parsed.get("collected_data", {})
            missing_fields = parsed.get("missing_fields", [])
            
            # Store assistant message
            ChatMessage.objects.create(
                user=user,
                role="assistant",
                content=bot_reply
            )
            
            # Handle actions
            if action == "register_project":
                result = self._register_project(user, collected_data)
                if result["success"]:
                    bot_reply += f"\n\n✅ Great! I've successfully registered your project '{collected_data.get('project_name')}' in the system."
                else:
                    bot_reply += f"\n\n❌ Sorry, there was an error registering your project: {result['error']}"
                    
            elif action == "register_paper":
                result = self._register_paper(user, collected_data)
                if result["success"]:
                    bot_reply += f"\n\n✅ Excellent! I've successfully registered your paper '{collected_data.get('title')}' in the system."
                else:
                    bot_reply += f"\n\n❌ Sorry, there was an error registering your paper: {result['error']}"
            
            return Response({
                "response": bot_reply,
                "intent": intent,
                "action": action,
                "collected_data": collected_data,
                "missing_fields": missing_fields
            })

        except Exception as e:
            print(f"Error in chatbot: {e}")
            return Response(
                {"error": "An error occurred while processing your request."},
                status=500
            )

    def _register_project(self, user, data):
        """Register a project with the collected data"""
        try:
            # Validate required fields
            required_fields = ['project_name', 'status']
            for field in required_fields:
                if not data.get(field):
                    return {"success": False, "error": f"{field} is required"}
            
            # Check if project already exists for this user
            if Project.objects.filter(project_name=data['project_name'], user=user).exists():
                return {"success": False, "error": "A project with this name already exists"}
            
            # Create the project
            project_data = {
                'project_name': data['project_name'],
                'status': data['status'],
                'pi': data.get('pi', ''),
                'funding_body': data.get('funding_body', ''),
                'documents': data.get('documents', ''),
                'additional_authors': data.get('additional_authors', [])
            }
            
            # Ensure additional_authors is a list
            if isinstance(project_data['additional_authors'], str):
                # If it's a string, split by comma
                project_data['additional_authors'] = [author.strip() for author in project_data['additional_authors'].split(',') if author.strip()]
            
            serializer = ProjectSerializer(data=project_data, context={'request': type('Request', (), {'user': user})()})
            
            if serializer.is_valid():
                serializer.save()
                return {"success": True, "project": serializer.data}
            else:
                return {"success": False, "error": str(serializer.errors)}
                
        except Exception as e:
            print(f"Error registering project: {e}")
            return {"success": False, "error": "An unexpected error occurred"}

    def _register_paper(self, user, data):
        """Register a paper with the collected data"""
        try:
            # Validate required fields
            required_fields = ['doi', 'title', 'author_name', 'journal', 'date']
            for field in required_fields:
                if not data.get(field):
                    return {"success": False, "error": f"{field} is required"}
            
            # Check if paper already exists for this user
            if Paper.objects.filter(doi=data['doi'], user=user).exists():
                return {"success": False, "error": "A paper with this DOI already exists for your account"}
            
            # If DOI is provided, try to fetch additional metadata
            if data.get('doi') and not all([data.get('title'), data.get('author_name'), data.get('journal')]):
                metadata = fetch_doi_metadata(data['doi'])
                if 'error' not in metadata:
                    # Merge fetched metadata with user-provided data
                    data.setdefault('journal', metadata.get('Journal', ''))
                    data.setdefault('date', metadata.get('PublishedOn', ''))
                    if not data.get('title'):
                        data['title'] = metadata.get('Title', '')
                    if not data.get('author_name'):
                        data['author_name'] = metadata.get('Authors', {}).get('Main Author', '')
                    if not data.get('additional_authors'):
                        additional_authors = metadata.get('Authors', {}).get('Additional Authors', [])
                        data['additional_authors'] = additional_authors
            
            # Create the paper
            paper_data = {
                'doi': data['doi'],
                'title': data['title'],
                'author_name': data['author_name'],
                'journal': data['journal'],
                'date': data['date'],
                'additional_authors': data.get('additional_authors', [])
            }
            
            # Ensure additional_authors is a list
            if isinstance(paper_data['additional_authors'], str):
                # If it's a string, split by comma
                paper_data['additional_authors'] = [author.strip() for author in paper_data['additional_authors'].split(',') if author.strip()]
            
            serializer = PaperSerializer(data=paper_data, context={'request': type('Request', (), {'user': user})()})
            
            if serializer.is_valid():
                serializer.save(user=user)
                return {"success": True, "paper": serializer.data}
            else:
                return {"success": False, "error": str(serializer.errors)}
                
        except Exception as e:
            print(f"Error registering paper: {e}")
            return {"success": False, "error": "An unexpected error occurred"}
    
    

    # Alternative method using json.loads with error handling
    def extract_json_from_response_alt(response_text):
        """
        Alternative method: try to find JSON by attempting to parse substrings
        """
        start_idx = response_text.find('{')
        if start_idx == -1:
            return None
        
        # Try parsing increasingly larger substrings
        for end_idx in range(len(response_text), start_idx, -1):
            try:
                potential_json = response_text[start_idx:end_idx].strip()
                if potential_json.endswith('}'):
                    return json.loads(potential_json)
            except json.JSONDecodeError:
                continue
        
        return None

    def delete(self, request):
        """Clear chat history for the current user"""
        user = request.user
        ChatMessage.objects.filter(user=user).delete()
        return Response({"message": "Chat history cleared"})
    
class ClearChatHistory(APIView):
    def post(self, request):
        request.session.flush()  # Clears session, including chat history
        return Response({"message": "Cleared History successfully"})
    
@ratelimit(key='ip', rate='3/m', method='POST')  # 3 attempts per minute per IP
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
@ratelimit(key='ip', rate='5/m', method='POST')  # 5 login attempts per minute per IP
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(request, username=username, password=password)
            if user is not None:
                refresh = RefreshToken.for_user(user)  # Generate JWT tokens

                # Create response without tokens in body
                response = JsonResponse({
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "is_superuser": user.is_superuser
                    },
                    "message": "Login successful"
                }, status=200)

                # Set tokens as httpOnly cookies
                response.set_cookie(
                    'access_token',
                    str(refresh.access_token),
                    max_age=settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME').total_seconds(),
                    httponly=True,
                    secure=settings.SESSION_COOKIE_SECURE,  # True in production with HTTPS
                    samesite='Lax'
                )
                response.set_cookie(
                    'refresh_token',
                    str(refresh),
                    max_age=settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME').total_seconds(),
                    httponly=True,
                    secure=settings.SESSION_COOKIE_SECURE,
                    samesite='Lax'
                )

                return response
            else:
                return JsonResponse({"error": "Invalid username or password"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request format"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)


def logout_view(request):
    """Logout view that clears httpOnly cookies"""
    response = JsonResponse({"message": "Logout successful"}, status=200)

    # Clear the cookies
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')

    return response


class PaperListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Regular users see only their own papers (excluding master copies)
        Superusers see their master copies for deduplication
        """
        if request.user.is_superuser:
            papers = Paper.objects.filter(user=request.user, is_master_copy=True)
        else:
            papers = Paper.objects.filter(user=request.user, is_master_copy=False)
        
        serializer = PaperSerializer(papers, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create a new paper. 
        - Regular users: creates normal paper + auto-copies to superuser
        - Superusers: creates master copy directly
        """
        serializer = PaperSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                paper = serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                # Handle duplicate DOI
                if request.user.is_superuser:
                    # Check if superuser already has this DOI as master copy
                    if Paper.objects.filter(doi=request.data.get('doi'), user=request.user, is_master_copy=True).exists():
                        return Response(
                            {"error": "You already have this paper as a master copy", "field": "doi"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                
                return Response(
                    {"error": "Duplicate DOI error", "field": "doi"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        
        errors = serializer.errors.copy()
        if 'non_field_errors' in errors:
            errors['error'] = 'Duplicate key error'
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

class SuperuserPaperUpdateView(APIView):
    """
    Superuser can update submission year for papers
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, pk):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can update submission status"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the master copy
        paper = get_object_or_404(Paper, pk=pk, user=request.user, is_master_copy=True)
        
        serializer = SuperuserPaperSerializer(paper, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SuperuserBulkUpdateView(APIView):
    """
    Bulk update submission year for multiple papers
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can bulk update papers"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        paper_ids = request.data.get('paper_ids', [])
        submission_year = request.data.get('submission_year')  # Can be None to unsubmit
        
        if not paper_ids:
            return Response(
                {"error": "paper_ids is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get master copies belonging to this superuser
        papers = Paper.objects.filter(
            id__in=paper_ids, 
            user=request.user, 
            is_master_copy=True
        )
        
        updated_count = 0
        
        for paper in papers:
            # Update all papers with the same DOI
            Paper.objects.filter(doi=paper.doi).update(
                submission_year=submission_year
            )
            updated_count += Paper.objects.filter(doi=paper.doi).count()
        
        action = "submitted" if submission_year else "unsubmitted"
        message = f"Successfully {action} {updated_count} papers"
        if submission_year:
            message += f" for year {submission_year}"
        
        return Response({
            "message": message,
            "updated_papers": updated_count
        }, status=status.HTTP_200_OK)

# Update your existing PaperListCreateView post method
class PaperListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Regular users see only their own papers (excluding master copies)
        Superusers see their master copies
        """
        print(f"DEBUG: GET request from user: {request.user.username}, is_superuser: {request.user.is_superuser}")
        
        if request.user.is_superuser:
            papers = Paper.objects.filter(user=request.user, is_master_copy=True)
            print(f"DEBUG: Superuser query - found {papers.count()} master copies")
        else:
            papers = Paper.objects.filter(user=request.user, is_master_copy=False)
            print(f"DEBUG: Regular user query - found {papers.count()} non-master papers")
        
        # Let's also show what papers exist for this user
        all_user_papers = Paper.objects.filter(user=request.user)
        print(f"DEBUG: All papers for user {request.user.username}: {all_user_papers.count()}")
        for p in all_user_papers:
            print(f"DEBUG: Paper ID: {p.id}, DOI: {p.doi}, is_master_copy: {p.is_master_copy}")
        
        serializer = PaperSerializer(papers, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new paper and auto-copy to superuser."""
        print(f"DEBUG: POST request received from user: {request.user.username}")
        print(f"DEBUG: Request data: {request.data}")
        
        serializer = PaperSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            print("DEBUG: Serializer is valid")
            try:
                # Remove the explicit is_master_copy parameter - let the serializer handle it
                paper = serializer.save(user=request.user)
                print(f"DEBUG: Paper saved successfully: {paper.id}")
                
                # Let's also check what papers exist after creation
                all_papers = Paper.objects.all()
                print(f"DEBUG: Total papers in database: {all_papers.count()}")
                for p in all_papers:
                    print(f"DEBUG: Paper ID: {p.id}, DOI: {p.doi}, User: {p.user.username}, is_master_copy: {p.is_master_copy}")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                print(f"DEBUG: IntegrityError occurred: {e}")
                return Response(
                    {"error": "Duplicate DOI error", "field": "doi"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            print(f"DEBUG: Serializer is invalid: {serializer.errors}")
            
        errors = serializer.errors.copy()
        print(errors)
        if 'non_field_errors' in errors:
            errors['error'] = 'Duplicate key error'
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

class SuperuserPaperListView(APIView):
    """
    Superuser sees only their master copies (deduplicated view)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get only master copies belonging to this superuser
        papers = Paper.objects.filter(user=request.user)
        
        # Optional filters
        submission_year = request.query_params.get('submission_year')
        submitted_only = request.query_params.get('submitted_only')
        
        if submission_year:
            papers = papers.filter(submission_year=submission_year)
        elif submitted_only == 'true':
            papers = papers.filter(submission_year__isnull=False)
        elif submitted_only == 'false':
            papers = papers.filter(submission_year__isnull=True)
        
        serializer = SuperuserPaperSerializer(papers, many=True, context={'request': request})
        return Response(serializer.data)

class SuperuserSubmissionStatsView(APIView):
    """
    Get submission statistics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only look at master copies
        master_papers = Paper.objects.filter(user=request.user, is_master_copy=True)
        
        stats = {
            'total_papers': master_papers.count(),
            'submitted_papers': master_papers.filter(submission_year__isnull=False).count(),
            'not_submitted_papers': master_papers.filter(submission_year__isnull=True).count(),
            'by_year': {}
        }
        
        # Group by submission year
        from django.db.models import Count
        yearly_stats = master_papers.filter(
            submission_year__isnull=False
        ).values('submission_year').annotate(
            count=Count('id')
        ).order_by('submission_year')
        
        for item in yearly_stats:
            year = item['submission_year']
            stats['by_year'][year] = item['count']
        
        return Response(stats)

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
            
            # Map Crossref type to your publication type categories
            def get_publication_type(crossref_type):
                """Map Crossref type to publication type categories."""
                type_mapping = {
                    'journal-article': 'Article in journal',
                    'monograph': 'Monograph',
                    'book': 'Monograph',
                    'book-chapter': 'Monograph',
                    'proceedings-article': 'Conference proceedings',
                    'paper-conference': 'Conference proceedings',
                    'book-part': 'Monograph',
                    'reference-entry': 'Monograph',
                    'dataset': 'other',
                    'component': 'other',
                    'report': 'other',
                    'thesis': 'other',
                    'dissertation': 'other',
                    'posted-content': 'other',
                    'preprint': 'other',
                    'standard': 'other',
                    'peer-review': 'other',
                    'editorial': 'other',
                    'review': 'other',
                    'other': 'other'
                }
                return type_mapping.get(crossref_type, 'other')
            
            crossref_type = message.get('type', 'other')
            publication_type = get_publication_type(crossref_type)

            metadata = {
                "Title": title,
                "Authors": {
                    "Main Author": main_author,
                    "Additional Authors": additional_authors
                },
                "PublishedOn": published_date,
                "Publisher": publisher,
                "DOI": doi,
                "Journal": journal,
                "PublicationType": publication_type
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
        """List all users except superusers."""
        users = User.objects.filter(is_superuser=False)
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
