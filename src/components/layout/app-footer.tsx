import { ThemeSwitcher } from '@/components/layout/theme-switcher';

export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="flex justify-center py-6 sm:py-8 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8" >
        <ThemeSwitcher />
      </div>
    </footer>
  );
}
