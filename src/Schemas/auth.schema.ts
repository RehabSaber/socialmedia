import * as zod from "zod";

export const RegisterSchema = zod
  .object({
    name: zod
      .string()
      .min(1, "name is required")
      .min(3, "min length is 3 chars")
      .max(30, "max length is 30 chars"),

    email: zod
      .string()
      .min(1, "email is required")
      .email("invalid email")
      .regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "invalid email format"),

    dateOfBirth: zod
      .string()
      .min(1, "date is required")
      .refine(
        (dateOfBirthValue) => {
          const userDate = new Date(dateOfBirthValue).getFullYear();
          const nowDate = new Date().getFullYear();
          return nowDate - userDate > 10;
        },
        { message: "Age must be greater than 10 years" }
      ),

    gender: zod.enum(["male", "female"]),

    password: zod
      .string()
      .min(1, "password is required")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
      ),

    rePassword: zod.string().min(1, "rePassword is required"),
  })
  .refine((obj) => obj.password === obj.rePassword, {
    path: ["rePassword"], 
    message: "Password and rePassword do not match",
  });


  // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




export const LoginSchema = zod
  .object({
    email: zod
      .string()
      .min(1, "email is required")
      .email("invalid email")
      .regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "invalid email format"),


    password: zod
      .string()
      .min(1, "password is required")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
      ),

  })
