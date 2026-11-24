import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Container } from '@/components/layout/container';

interface FallbackPageProps {
  title: string;
  description: string;
  status?: string;
  action?: ReactNode;
}

export function FallbackPage({
  title,
  description,
  status,
  action,
}: FallbackPageProps) {
  return (
    <main className="flex min-h-[60vh] items-center py-12">
      <Container>
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader className="items-center text-center">
            {status && (
              <p className="text-sm font-medium text-muted-foreground">
                {status}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </CardHeader>
          {action && (
            <CardContent className="flex justify-center">
              {action}
            </CardContent>
          )}
        </Card>
      </Container>
    </main>
  );
}
