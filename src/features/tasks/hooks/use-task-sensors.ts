import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: React.PointerEvent) => {
        const target = nativeEvent.target as HTMLElement;
        if (target.closest('[data-no-dnd], button, input, textarea, a')) {
          return false; // don't start drag from interactive elements
        }
        return true;
      },
    },
  ];
}

export function useTaskSensors() {
  return useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}
