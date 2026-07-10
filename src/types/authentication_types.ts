//This contains all the types needed in the authentication route
interface RegisterUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  age: number;
}

interface RegisterUserResponse {
  success: true;
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: "user"
  }
}

export type {RegisterUserRequest, RegisterUserResponse}