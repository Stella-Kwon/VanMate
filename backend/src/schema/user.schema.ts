import {z} from 'zod';

const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const createUserSchema = z.object({
    email: z.string().email(),
    family_name: z.string().default(''),
    given_name: z.string().default(''),
    googleId: z.string().optional(),
    password: passwordSchema.optional(),
});

export const registerUserSchema = z.object({
    email: z.string().email(),
    family_name: z.string().default(''),
    given_name: z.string().default(''),
    password: passwordSchema,
});

export const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});

//validation before compilation
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;