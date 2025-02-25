import json
from urllib.parse import unquote
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import IntegrityError
from .models import Paper, Project
from .serializers import PaperSerializer, ProjectSerializer
import requests
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken


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
        """Fetch all papers belonging to the authenticated user."""
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PaperDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, doi):
        """Delete a paper only if it belongs to the authenticated user."""
        decoded_doi = unquote(doi)
        paper = get_object_or_404(Paper, doi=decoded_doi, user=request.user)
        paper.delete()
        return JsonResponse({"message": "Paper deleted successfully"}, status=200)

class PaperUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, doi):
        """Update a paper, ensuring the user owns it and preventing duplicate DOIs."""
        paper = get_object_or_404(Paper, doi=doi, user=request.user)
        new_doi = request.data.get("doi")

        # Prevent duplicate DOIs
        if new_doi and new_doi != doi:
            if Paper.objects.filter(doi=new_doi, user=request.user).exists():
                return Response(
                    {"error": "DOI already exists"}, status=status.HTTP_400_BAD_REQUEST
                )
            paper.doi = new_doi  # Assign the new DOI manually

        serializer = PaperSerializer(paper, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Fetch all projects belonging to the authenticated user."""
        projects = Project.objects.filter(user=request.user)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new project and associate it with the authenticated user."""
        print(f"Authenticated User: {request.user}")  # Debugging step
        print(f"Request Data: {request.data}")  # Debugging step

        serializer = ProjectSerializer(data=request.data, context={'request': request})  # Pass request context

        if serializer.is_valid():
            serializer.save()  # No need to manually pass user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print(f"Serializer Errors: {serializer.errors}")  # Debugging step
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ProjectDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, project_name):
        """Delete a project only if it belongs to the authenticated user."""
        project = get_object_or_404(Project, project_name=project_name, user=request.user)
        project.delete()
        return JsonResponse({"message": "Project deleted successfully"}, status=200)

class ProjectUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, project_name):
        """Update a project, ensuring the user owns it and preventing duplicate names."""
        project = get_object_or_404(Project, project_name=project_name, user=request.user)
        new_name = request.data.get("project_name")

        # Prevent duplicate project names
        if new_name and new_name != project_name:
            if Project.objects.filter(project_name=new_name, user=request.user).exists():
                return Response({"error": "Project already exists"}, status=status.HTTP_400_BAD_REQUEST)
            project.project_name = new_name  # Manually update project name

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
