"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { DEFAULT_REDIRECTS } from "@/app/config/routes.config";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { updatePassword } from "../repository/auth.repository";
import { updatePasswordSchema } from "../validation/auth";
import { UpdatePasswordInput } from "../types/auth.types";

export function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onBlur",
  });
  const router = useRouter();


  const { mutate, error, isPending } = useMutation({
    mutationFn: async (data: UpdatePasswordInput) => await updatePassword(data),
    onSuccess: () => {
      router.push(DEFAULT_REDIRECTS.authenticated);
    }
  },)

  const onSubmit = async (data: UpdatePasswordInput) => {
    mutate(data);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  type="password"
                  {...register("password")}
                  placeholder="New password"
                />
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  type="confirmPassword"
                  {...register("confirmPassword")}
                  placeholder="New password"
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
              {error && error.message && <p className="text-sm text-red-500">{error.message}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving..." : "Save new password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
