import { DBItem } from '@virtcon2/static-game-data';
import { useEffect, useRef, useState } from 'react';
import Game from '../../../scenes/Game';
import { useGameInputLock } from '../../lib/gameInputLock';

interface ItemSearchPopupProps {
  items: DBItem[];
  onSelect: (item: DBItem) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

function ItemSearchRow({
  item,
  highlighted,
  onClick,
  onMouseEnter,
}: {
  item: DBItem;
  highlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const icon = Game.getInstance().textures.getBase64(item.name + '_0');

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex flex-row px-2 items-center w-full h-10 cursor-pointer border-2 transition-colors ${
        highlighted ? 'bg-[#4b4b4b] border-blue-400' : 'bg-[#282828] border-[#282828] hover:bg-[#4b4b4b] hover:border-[#4b4b4b]'
      }`}
    >
      <p className="flex-1 text-sm text-white">{item.display_name}</p>
      <img alt={item.display_name} className="pixelart h-8 w-8" src={icon} />
    </div>
  );
}

export function ItemSearchPopup({ items, onSelect, onClose, position }: ItemSearchPopupProps) {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((i) => i.display_name.toLowerCase().includes(query.toLowerCase()));

  useGameInputLock();

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Clamp position to viewport
  const left = Math.min(position.x, window.innerWidth - 270);
  const top = Math.min(position.y, window.innerHeight - 340);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % Math.max(filtered.length, 1));
    }
    if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
    }
    if (e.key === 'Enter' && filtered[highlightedIndex]) {
      onSelect(filtered[highlightedIndex]);
    }
  };

  return (
    <div
      ref={popupRef}
      style={{ position: 'fixed', top, left, zIndex: 9999, width: 260 }}
      className="bg-[#1a1a1a] border border-gray-600 rounded shadow-xl flex flex-col"
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightedIndex(0);
        }}
        onKeyDown={onKeyDown}
        placeholder="Search items..."
        className="px-3 py-2 bg-[#282828] text-white text-sm outline-none border-b border-gray-600 rounded-t"
      />
      <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
        {filtered.map((item, idx) => (
          <ItemSearchRow
            key={item.id}
            item={item}
            highlighted={idx === highlightedIndex}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setHighlightedIndex(idx)}
          />
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-xs p-3">No items found</p>}
      </div>
    </div>
  );
}
