export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Pet {
  id: string;
  name: string;
  category: string;
  description: string;
  storeInfo?: {
    status: string;
    price: number;
  }
}

export interface Order {
  id: string;
  petId: string;
  paid: boolean;
}

export interface Payment {
  id: string;
  creditCardNumber: string,
  amount: number;
}