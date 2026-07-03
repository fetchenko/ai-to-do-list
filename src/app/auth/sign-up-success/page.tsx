import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Thank you for signing up!</CardTitle>
        <CardDescription>Check your email to confirm</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          You&apos;ve successfully signed up. Please check your email to confirm your account
          before signing in.
        </p>
      </CardContent>
    </Card>

  );
}
