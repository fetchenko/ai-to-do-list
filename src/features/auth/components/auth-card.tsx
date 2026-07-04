import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 px-5 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-5 sm:px-6">{children}</CardContent>
    </Card>
  );
}
