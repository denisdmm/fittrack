import * as z from "zod";

// This schema is used for both creation and editing.
// The password logic is handled in the component.
export const CreateUserInputSchema = z.object({
    firstName: z.string().min(1, "O nome é obrigatório."),
    lastName: z.string().min(1, "O sobrenome é obrigatório."),
    login: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres."),
    // Password is required for creation, optional for editing.
    // This is a base schema; the component will refine it.
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    role: z.enum(['user', 'admin']),
    status: z.enum(['active', 'inactive']),
    instagramUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal('')).optional(),
    activeWorkoutPlanId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;


// This function generates a more specific schema based on the context (editing or creating).
export const getFormSchema = (isEditing: boolean) => z.object({
    firstName: z.string().min(1, { message: "O nome é obrigatório." }),
    lastName: z.string().min(1, { message: "O sobrenome é obrigatório." }),
    login: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres." }),
    // Password is only required when creating a new user (isEditing is false)
    password: isEditing 
        ? z.string().optional() 
        : z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    role: z.enum(['user', 'admin']),
    status: z.enum(['active', 'inactive']),
    instagramUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal('')).optional(),
    activeWorkoutPlanId: z.string().optional(),
});
