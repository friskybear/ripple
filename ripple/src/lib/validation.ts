import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(255),
    email: z
      .string()
      .min(1, "Enter your email.")
      .email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(255),
    password_confirmation: z.string().min(1, "Repeat your password."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "The passwords do not match.",
  });

export const signalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a short title.")
    .max(120, "Keep the title under 120 characters."),
  description: z
    .string()
    .trim()
    .min(1, "Describe what you observed.")
    .max(5000, "Keep the description under 5000 characters."),
  category: z
    .string()
    .trim()
    .min(1, "Choose a category.")
    .max(80, "Keep the category under 80 characters."),
  zone: z
    .string()
    .trim()
    .min(1, "Add a zone.")
    .max(120, "Keep the zone under 120 characters."),
  impact: z.enum(["1", "2", "3", "4", "5"], "Pick an impact level."),
});

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a comment first.")
    .max(2000, "Keep the comment under 2000 characters."),
});

export const communitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the community a name.")
    .max(120, "Keep the name under 120 characters."),
});

export const joinSchema = z.object({
  invite_code: z
    .string()
    .trim()
    .min(1, "Enter an invite code.")
    .max(255),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type SignalValues = z.infer<typeof signalSchema>;
export type CommentValues = z.infer<typeof commentSchema>;
export type CommunityValues = z.infer<typeof communitySchema>;
export type JoinValues = z.infer<typeof joinSchema>;
