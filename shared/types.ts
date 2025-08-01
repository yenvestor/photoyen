export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  data: string; // JSON serialized project data
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}