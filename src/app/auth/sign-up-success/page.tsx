import { AuthCard } from '@/features/auth/components/auth-card';

export default function Page() {
  return (
    <AuthCard
      title="Thank you for signing up!"
      description="Check your email to confirm"
    >
      <p className="text-muted-foreground text-sm">
        You&apos;ve successfully signed up. Please check your email to confirm
        your account before signing in.
      </p>
    </AuthCard>
  );
}
