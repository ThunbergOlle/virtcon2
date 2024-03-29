import { RedisWorldBuilding, TPS } from '@shared';
import { DBBuilding, get_building_by_id } from '@virtcon2/static-game-data';
import { useEffect, useState } from 'react';

export default function useTickProgress(worldBuilding: RedisWorldBuilding | null) {
  const [tickProgress, setTickProgress] = useState(0);

  useEffect(() => {
    if (!worldBuilding) return;
    const current = worldBuilding?.current_processing_ticks || 0;

    setTickProgress(current);

    const total = get_building_by_id(worldBuilding.building.id)?.processing_ticks;

    if (!total) return;

    const interval = setInterval(() => {
      setTickProgress((prev) => {
        if (prev >= total) {
          return 0;
        }
        return prev + TPS;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [worldBuilding]);

  return tickProgress;
}
