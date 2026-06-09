import { redirect } from "next/navigation";

export default function AuthForgotPasswordRedirect() {
  redirect("/forgot-password");
}
