import { InventoryType, ServerInventoryItem } from '@shared';
import { ClientPacket, PacketType, RequestMoveInventoryItemPacketData, RequestPlaceBuildingPacketData } from '@virtcon2/network-packet';
import { get_building_by_id } from '@virtcon2/static-game-data';
import { addComponent, addEntity, removeEntity } from '@virtcon2/virt-bit-ecs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Collider } from '../../../components/Collider';
import { GhostBuilding } from '../../../components/GhostBuilding';
import { Position } from '../../../components/Position';
import { Sprite } from '../../../components/Sprite';
import { ItemTextureMap } from '../../../config/SpriteMap';
import { events } from '../../../events/Events';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { fromPhaserPos } from '../../lib/coordinates';
import { close, isWindowOpen, toggle, WindowType } from '../../lib/WindowSlice';

export default function PlayerInventoryWindow() {
  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_PLAYER_INVENTORY));
  const dispatch = useAppDispatch();

  const buildingBeingPlaced = useRef<ServerInventoryItem | null>(null);
  const buildingBeingPlacedEntity = useRef<number | null>(null);
  const [inventory, setInventory] = useState<Array<ServerInventoryItem>>([]);

  const cancelPlaceBuildingIntent = () => {
    const game = Game.getInstance();

    game.input.off('pointerdown', placeBuilding);
    game.input.off('keydown-R', rotatePlaceBuildingIntent);

    buildingBeingPlaced.current = null;
    if (!game.world || !buildingBeingPlacedEntity.current) return;
    removeEntity(game.world, buildingBeingPlacedEntity.current);
  };

  function rotatePlaceBuildingIntent() {
    const game = Game.getInstance();
    if (!game.world || !buildingBeingPlacedEntity.current) return;
    Sprite.rotation[buildingBeingPlacedEntity.current] += (Math.PI / 2) % (Math.PI * 2);
  }

  function placeBuilding(e: Phaser.Input.Pointer) {
    if (!buildingBeingPlaced.current || buildingBeingPlaced.current.quantity <= 0) {
      toast('You do not have any more of this building in your inventory', { type: 'error' });
      return cancelPlaceBuildingIntent();
    }
    if (!buildingBeingPlacedEntity.current || !GhostBuilding.placementIsValid[buildingBeingPlacedEntity.current] || !buildingBeingPlaced.current.item) return;
    buildingBeingPlaced.current.quantity--;
    toast('Placing building', { type: 'info' });
    /* Send network packet to backend that we want to place the building at the coordinates */
    /* Convert phaser coordinates to the tilemap coordinates*/
    const { x, y } = fromPhaserPos({ x: e.worldX, y: e.worldY });

    const packet: ClientPacket<RequestPlaceBuildingPacketData> = {
      data: {
        buildingItemId: buildingBeingPlaced.current.item.id,
        x,
        rotation: Sprite.rotation[buildingBeingPlacedEntity.current],
        y,
      },
      packet_type: PacketType.REQUEST_PLACE_BUILDING,
    };

    Game.network.sendPacket(packet);
  }

  useEffect(() => {
    if (isOpen)
      Game.network.sendPacket({
        data: {},
        packet_type: PacketType.REQUEST_PLAYER_INVENTORY,
      });
  }, [isOpen]);

  const onInventoryButtonPressed = useCallback(() => dispatch(toggle(WindowType.VIEW_PLAYER_INVENTORY)), [dispatch]);

  useEffect(() => {
    events.subscribe('onInventoryButtonPressed', onInventoryButtonPressed);
    events.subscribe('networkPlayerInventory', ({ inventory }) => {
      setInventory(inventory);
    });
    return () => {
      events.unsubscribe('networkPlayerInventory', () => {});
      events.unsubscribe('onInventoryButtonPressed', () => onInventoryButtonPressed);
    };
  }, [onInventoryButtonPressed]);

  const onItemWasClicked = (item: ServerInventoryItem) => {
    if (item.item?.is_building) {
      dispatch(close(WindowType.VIEW_PLAYER_INVENTORY));

      const game = Game.getInstance();
      if (!game.world) return;

      /* Create ghost building entity */
      const ghostBuilding = addEntity(game.world);
      addComponent(game.world, GhostBuilding, ghostBuilding);
      addComponent(game.world, Sprite, ghostBuilding);
      addComponent(game.world, Position, ghostBuilding);
      addComponent(game.world, Collider, ghostBuilding);

      const buildingSettings = get_building_by_id(item.item.building?.id ?? 0);
      if (!buildingSettings) return;

      game.state.ghostBuildingById[ghostBuilding] = buildingSettings;

      Sprite.texture[ghostBuilding] = ItemTextureMap[item.item.name]?.textureId ?? 0;
      Sprite.height[ghostBuilding] = (buildingSettings?.height ?? 1) * 16;
      Sprite.width[ghostBuilding] = (buildingSettings?.width ?? 1) * 16;
      Sprite.opacity[ghostBuilding] = 0.5;
      Position.x[ghostBuilding] = 0;
      Position.y[ghostBuilding] = 0;

      buildingBeingPlacedEntity.current = ghostBuilding;
      buildingBeingPlaced.current = item;

      // Event listeners
      game.input.on('pointerdown', placeBuilding);
      game.input.keyboard.once('keydown-ESC', () => cancelPlaceBuildingIntent());
      game.input.keyboard.once('keydown-Q', () => cancelPlaceBuildingIntent());
      if (buildingSettings?.is_rotatable) {
        game.input.keyboard.on('keydown-R', () => rotatePlaceBuildingIntent());
      }
    }
  };
  const onInventoryDropItem = (item: InventoryItemType, slot: number, inventoryId: number) => {
    // Construct network packet to move the item to the new invenory.
    const packet: ClientPacket<RequestMoveInventoryItemPacketData> = {
      data: {
        ...item,
        toInventoryId: inventoryId,
        toInventorySlot: slot,
        toInventoryType: InventoryType.PLAYER,
      },
      packet_type: PacketType.REQUEST_MOVE_INVENTORY_ITEM,
    };
    Game.network.sendPacket(packet);
  };

  return (
    <Window
      title="Inventory"
      width={800}
      height={500}
      defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }}
      windowType={WindowType.VIEW_PLAYER_INVENTORY}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row flex-wrap">
            {inventory
              ?.sort((a, b) => a.slot - b.slot)
              .map((item) => {
                return item && item.item ? (
                  <InventoryItem
                    key={item.slot}
                    item={item}
                    slot={item.slot}
                    onDrop={onInventoryDropItem}
                    onClick={() => onItemWasClicked(item)}
                    fromInventoryType={InventoryType.PLAYER}
                    fromInventoryId={0}
                    fromInventorySlot={item.slot}
                  />
                ) : (
                  <InventoryItemPlaceholder key={item.slot} inventoryId={0} slot={item.slot} onDrop={onInventoryDropItem} />
                );
              })}
          </div>
        </div>
      </div>
    </Window>
  );
}
