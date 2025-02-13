const PROJECTS_API = '/api/projects';
const PAPER_API = '/api/papers';

import { NextResponse } from "next/server";
import { Paper, Project } from "../types/FixedTypes";

function camelToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(camelToSnakeCase);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc: any, key: string) => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        acc[snakeKey] = camelToSnakeCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  }
  function convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(convertKeysToCamelCase);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc: any, key: string) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = convertKeysToCamelCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  }
// Fetch all papers
export const fetchProjects = async (): Promise<Project[]> => {
    try {
      const response = await fetch(`${PROJECTS_API}`);
      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }
      const data = await response.json();
  
      // Assuming the API returns snake_case keys, convert them to camelCase
      return convertKeysToCamelCase(data) as Project[];
    } catch (error) {
      console.error('Error fetching papers:', error);
      return [];
    }
  };

// Create a new paper
export const createProject = async (paper: Partial<Project>) => {
  const snakePaper = camelToSnakeCase(paper)  
  const response = await fetch(PROJECTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snakePaper),
  });
  if (!response.ok) {
    throw new Error('Failed to create paper');
  }
  return response.json();
};

export const deleteProject = async (projectDoi: string) => {
  try {
    const encodedDoi = encodeURIComponent(projectDoi);
      const response = await fetch(`/api/projects/${encodedDoi}`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
          },
      });

      if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
  }
};

export const updateProject = async (oldDoi: string, project: Partial<Project>) => {
  const snakeProject = camelToSnakeCase(project)
  const encodedDoi = encodeURIComponent(oldDoi);
  const response = await fetch(`/api/projects/${encodedDoi}`, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(snakeProject),
  });
  const data = await response.json()

  if (!response.ok) {
    console.error(data.error);
    throw new Error(data.error || "An error occurred while updating the project");
  }

  return data;
}

export const fetchPaper = async (): Promise<Paper[]> => {
  try {
    const response = await fetch(`${PAPER_API}`);
    if (!response.ok) {
      throw new Error('Failed to fetch papers');
    }
    const data = await response.json();

    // Assuming the API returns snake_case keys, convert them to camelCase
    return convertKeysToCamelCase(data) as Paper[];
  } catch (error) {
    console.error('Error fetching papers:', error);
    return [];
  }
};

// Create a new paper
export const createPaper = async (paper: Partial<Paper>) => {
  const snakePaper = camelToSnakeCase(paper)  
  const response = await fetch(PAPER_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snakePaper),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log(data.error)
    return {error: data.error};
  }
  return data;
};

export const deletePaper = async (paperDoi: string) => {
  try {
    const encodedDoi = encodeURIComponent(paperDoi);
    const response = await fetch(`/api/papers/${encodedDoi}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

      if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
  }
};

export const updatePaper = async (oldDoi: string, paper: Partial<Paper>) => {
  const snakePaper = camelToSnakeCase(paper)
  const encodedDoi = encodeURIComponent(oldDoi);
  const response = await fetch(`/api/papers/${encodedDoi}`, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(snakePaper),
  });
  const data = await response.json()

  if (!response.ok) {
    console.error(data.error);
    throw new Error(data.error || "An error occurred while updating the project");
  }

  return data;
}

export interface DoiMetadata {
  Title: string;
  Authors: {
      "Main Author": { first_name: string; last_name: string } | string;
      "Additional Authors": { first_name: string; last_name: string }[];
  };
  PublishedOn: string;
  Publisher: string;
  DOI: string;
  Journal: string;
}

export const fetchDoiMetadata = async (doi: string): Promise<DoiMetadata | null> => {
  try {
      const response = await fetch('/api/crossref-retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doi }),
      });

      if (!response.ok) {
          console.error('Invalid DOI:', await response.json());
          return null;
      }

      return await response.json();
  } catch (error) {
      console.error('Error fetching DOI metadata:', error);
      return null;
  }
};
