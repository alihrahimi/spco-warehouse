import { z } from "zod";

/** Self-service password change — requires the current password as proof of possession. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید"),
    newPassword: z.string().min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد"),
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "رمز عبور جدید و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Administrator-initiated reset — no current-password proof, since the admin is acting on someone else's account. */
export const adminResetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد"),
});

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
