export type MenuAction = {
  id: string;
  label: string;

  onSelect: () => void;

  disabled?: boolean;

  variant?: 'default' | 'destructive';

  icon?: React.ComponentType<{
    className?: string;
  }>;
};
