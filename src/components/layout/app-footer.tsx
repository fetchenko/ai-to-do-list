import { Container } from '@/components/layout/container';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';

export function AppFooter() {
  return (
    <footer className="border-t">
      <Container className="flex justify-center py-6 sm:py-8">
        <ThemeSwitcher />
      </Container>
    </footer>
  );
}
