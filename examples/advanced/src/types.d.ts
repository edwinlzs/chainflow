export interface User {
  id: string;
  username: string;
  password: string;
}

export interface PetStatus {
  status: string;
  category: { name: string };
}
