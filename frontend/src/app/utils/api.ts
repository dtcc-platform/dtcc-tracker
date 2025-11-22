const PROJECTS_API = '/api/projects';
const PAPER_API = '/api/papers';

import { Paper, Project } from "../types/FixedTypes";
import {User} from "../types/FixedTypes"

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
  };

  // Include credentials to send cookies with the request
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include' // This ensures cookies are sent with the request
  });
};

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
      const response = await fetchWithAuth(`${PROJECTS_API}`);
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
  const response = await fetchWithAuth(PROJECTS_API, {
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

export const deleteProject = async (projectDoi: number) => {
  try {
    const encodedDoi = encodeURIComponent(projectDoi);
      const response = await fetchWithAuth(`/api/projects/${encodedDoi}`, {
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

export const updateProject = async (id: number, project: Partial<Project>) => {
  const snakeProject = camelToSnakeCase(project)
  const response = await fetchWithAuth(`/api/projects/${id}`, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(snakeProject),
  });
  const data = await response.json()

  if (!response.ok) {
    console.error(data.error);
    return {error: data.error, status: 500};
  }

  return data;
}
export const fetchSuperUserPaper = async (): Promise<Paper[]> => {
  try {
    const response = await fetchWithAuth(`/api/reporting`);
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
export const fetchPaper = async (): Promise<Paper[]> => {
  try {
    const response = await fetchWithAuth(`${PAPER_API}`);
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
  const response = await fetchWithAuth(PAPER_API, {
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

export const deletePaper = async (paperDoi: number) => {
  try {
    const response = await fetchWithAuth(`/api/papers/${paperDoi}`, {
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

export const updatePaper = async (id: number, paper: Partial<Paper>) => {
  const snakePaper = camelToSnakeCase(paper)
  const response = await fetchWithAuth(`/api/papers/${id}`, {
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
      "Main Author":  string;
      "Additional Authors": string [];
  };
  PublishedOn: string;
  Publisher: string;
  DOI: string;
  Journal: string;
  PublicationType: string;
}

export const fetchDoiMetadata = async (doi: string): Promise<DoiMetadata | null> => {
  try {
      const response = await fetchWithAuth('/api/crossref-retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doi }),
      });

      if (!response.ok) {
          console.error('Invalid DOI:', await response.json());
          return null;
      }
      const data = await response.json();
      return data;
  } catch (error) {
      console.error('Error fetching DOI metadata:', error);
      return null;
  }
};


export async function fetchUsers(): Promise<User[]> {
  const response = await fetchWithAuth("/api/users", { method: "GET" });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}

/**
 * Create a new user
 */
export async function createUser(userData: Partial<User> & { password: string }): Promise<User> {
  const response = await fetchWithAuth("/api/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Failed to create user");
  }
  return response.json();
}

/**
 * Retrieve a single user
 */
export async function getUser(userId: number): Promise<User> {
  const response = await fetchWithAuth(`/api/users/${userId}`, { method: "GET" });
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return response.json();
}

/**
 * Update a user (partial update)
 */
export async function updateUser(userId: number, userData: Partial<User>): Promise<User> {
  const response = await fetchWithAuth(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error("Failed to update user");
  }
  return response.json();
}

/**
 * Delete a user
 */
export async function deleteUser(userId: number): Promise<void> {
  const response = await fetchWithAuth(`/api/users/${userId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
}
export async function ChatWithBoth(message: string) {
  const response = await fetchWithAuth(`/api/chat`, { method: "POST",body: JSON.stringify({ message: message }) });
  if (!response.ok) {
    throw new Error('Error from Django');
  }
  const data = await response.json();
  console.log(data)
  return { response: data.response, refresh: data.refresh };
}

export async function ClearChat() {
  const response = await fetchWithAuth(`/api/chat`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error('Error from Django');
  }
  const data = await response.json();
  return data.response
}

export const updateYear = async (id: number, year: number) => {
  const response = await fetchWithAuth(`/api/reporting/${id}`, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(year),
  });
  const data = await response.json()

  if (!response.ok) {
    console.error(data.error);
    throw new Error(data.error || "An error occurred while updating the project");
  }

  return data;
}