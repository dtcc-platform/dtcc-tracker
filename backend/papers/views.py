from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Paper, Project
from .serializers import PaperSerializer, ProjectSerializer
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
import requests
from django.db import IntegrityError

class PaperListCreateView(APIView):
    def get(self, request):
        papers = Paper.objects.all()
        serializer = PaperSerializer(papers, many=True)
        return Response(serializer.data)

    def post(self, request):
        print(request.data)
        serializer = PaperSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response(
                    {"error": "Duplicate key error", "field": "doi"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if "doi" in serializer.errors:
            return Response(
                {"error": "Duplicate key error", "field": "doi"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PaperDeleteView(APIView):
    def delete(self, request, doi):
        paper = get_object_or_404(Paper, doi=doi)  # Use doi instead of id
        paper.delete()
        return JsonResponse({"message": "Project deleted successfully"}, status=200)

class PaperUpdateView(APIView):
    def put(self, request, doi):
        paper = get_object_or_404(Paper, doi=doi)  # Fetch the existing object
        new_doi = request.data.get("doi")  # Get the new DOI from request

        # Validate and check if DOI is changing
        if new_doi and new_doi != doi:
            if Paper.objects.filter(doi=new_doi).exists():
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
    def get(self, request):
        projects = Project.objects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ProjectDeleteView(APIView):
    def delete(self, request, doi):
        project = get_object_or_404(Project, doi=doi)  # Use doi instead of id
        project.delete()
        return JsonResponse({"message": "Project deleted successfully"}, status=200)

class ProjectUpdateView(APIView):
    def put(self, request, doi):
        project = get_object_or_404(Project, doi=doi)
        new_doi = request.data.get("doi")  # Get the new DOI

        print(f"Received update request for {doi} with new data: {request.data}")

        # Validate if DOI is changing
        if new_doi and new_doi != doi:
            if Project.objects.filter(doi=new_doi).exists():
                return Response({"error": "DOI already exists"}, status=status.HTTP_400_BAD_REQUEST)
            project.doi = new_doi  # Manually update DOI

        serializer = ProjectSerializer(project, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            print("Update successful:", serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        print("Update failed with errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
def fetch_doi_metadata(doi):
    base_url = "https://api.crossref.org/works/"
    response = requests.get(base_url + doi)

    if response.status_code == 200:
        data = response.json()
        if 'message' in data:
            message = data['message']

            title = message.get('title', ['N/A'])[0]
            authors_data = message.get('author', [])

            if authors_data:
                main_author = {
                    "first_name": authors_data[0].get('given', 'N/A'),
                    "last_name": authors_data[0].get('family', 'N/A')
                }

                additional_authors = [
                    {
                        "first_name": author.get('given', 'N/A'),
                        "last_name": author.get('family', 'N/A')
                    }
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
        doi = request.data.get('doi')
        if not doi:
            return Response({"error": "DOI is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch DOI metadata directly
        metadata = fetch_doi_metadata(doi)
        
        if "error" in metadata:
            return Response(metadata, status=status.HTTP_400_BAD_REQUEST)

        return Response(metadata, status=status.HTTP_200_OK)
