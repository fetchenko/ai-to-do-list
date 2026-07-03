import { cn } from '@/lib/utils';

type ContainerProps = React.ComponentProps<'div'>;

export function Container({
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    />
  );
}