import { get_item_by_id } from '@virtcon2/static-game-data';
import { useAppSelector } from '../../../hooks';
import { useTextureManager } from '../../../hooks/useGameTextures';
import { hoveredResource } from './ResourceTooltipSlice';

export const ResourceTooltip = () => {
  const resource = useAppSelector(hoveredResource);
  const textures = useTextureManager();

  if (!resource || !textures) {
    return null;
  }

  const item = get_item_by_id(resource.itemId);
  if (!item) {
    return null;
  }

  const textureKey = `${item.name}_0`;
  const itemTexture = textures.getBase64(textureKey);

  return (
    <div className="fixed bottom-20 right-4 z-[1000] pointer-events-none">
      <div className="bg-gray-900/95 border-2 border-gray-600 rounded-lg p-3 min-w-[200px] shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <img src={itemTexture} alt={item.display_name} className="pixelart h-12 w-12" draggable="false" unselectable="on" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg">{item.display_name}</span>
            <span className="text-gray-400 text-xs italic">{item.name}</span>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Quantity:</span>
            <span className="text-yellow-400 font-bold text-sm">{resource.quantity}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-300 text-sm">Health:</span>
            <span className="text-green-400 font-bold text-sm">{resource.health}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
