import { redirect } from "next/navigation";

export default function AuthResetPasswordRedirect({ searchParams }) {
  const token = searchParams?.token;
  if (token) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }
  redirect("/reset-password");
}
