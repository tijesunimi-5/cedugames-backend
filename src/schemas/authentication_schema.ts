//This contains the Authentication's ZOD validation schemas for the request body
import {z} from "zod"

const RegisterUserSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.number().int().positive()
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export {RegisterUserSchema};