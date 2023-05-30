import { ServerInventoryItem } from '@shared';
import { NetworkPacketData, PacketType, RequestPlaceBuildingPacketData, RequestPlayerInventoryPacket } from '@virtcon2/network-packet';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import Window from '../../components/window/Window';
import { WindowManager, WindowType } from '../../lib/WindowManager';
import { fromPhaserPos } from '../../lib/coordinates';
import { addComponent, addEntity, removeEntity } from '@virtcon2/virt-bit-ecs';
import { GhostBuilding } from '../../../components/GhostBuilding';
import { Sprite } from '../../../components/Sprite';
import { Position } from '../../../components/Position';
import { Collider } from '../../../components/Collider';
import { ItemTextureMap } from '../../../config/SpriteMap';
import { get_building_by_id } from '@virtcon2/static-game-data';

export default function PlayerInventoryWindow(props: { windowManager: WindowManager }) {
  const isOpen = useRef(false);
  const buildingBeingPlaced = useRef<ServerInventoryItem | null>(null);
  const buildingBeingPlacedEntity = useRef<number | null>(null);
  const [inventory, setInventory] = useState<Array<ServerInventoryItem>>([]);

  const cancelPlaceBuildingIntent = () => {
    const game = Game.getInstance();
    game.input.off('pointerdown', placeBuilding);
    buildingBeingPlaced.current = null;
    if (!game.world || !buildingBeingPlacedEntity.current) return;
    removeEntity(game.world, buildingBeingPlacedEntity.current);
  };

  function placeBuilding(e: Phaser.Input.Pointer) {
    if (!buildingBeingPlaced.current || buildingBeingPlaced.current.quantity <= 0) {
      toast('You do not have any more of this building in your inventory', { type: 'error' });
      return cancelPlaceBuildingIntent();
    }
    if (!buildingBeingPlacedEntity.current || !GhostBuilding.placementIsValid[buildingBeingPlacedEntity.current]) return;
    buildingBeingPlaced.current.quantity--;
    toast('Placing building', { type: 'info' });
    /* Send network packet to backend that we want to place the building at the coordinates */
    /* Convert phaser coordinates to the tilemap coordinates*/
    const { x, y } = fromPhaserPos({ x: e.worldX, y: e.worldY });
    const packet: NetworkPacketData<RequestPlaceBuildingPacketData> = {
      data: {
        buildingItemId: buildingBeingPlaced.current.item.id,
        x,
        y,
      },
      packet_type: PacketType.REQUEST_PLACE_BUILDING,
    };
    Game.network.sendPacket(packet);
  }
  const toggleInventory = () => {
    if (!isOpen.current) {
      /* Send request inventory packet */
      const packet: NetworkPacketData<RequestPlayerInventoryPacket> = {
        data: {},
        packet_type: PacketType.REQUEST_PLAYER_INVENTORY,
      };
      Game.network.sendPacket(packet);
      props.windowManager.openWindow(WindowType.VIEW_PLAYER_INVENTORY);
      isOpen.current = true;
    } else {
      props.windowManager.closeWindow(WindowType.VIEW_PLAYER_INVENTORY);
      isOpen.current = false;
    }
  };

  useEffect(() => {
    events.subscribe('onInventoryButtonPressed', toggleInventory);
    events.subscribe('networkPlayerInventoryPacket', ({ inventory }) => {
      setInventory(inventory);
    });

    return () => {
      events.unsubscribe('onInventoryButtonPressed', () => {});
      events.unsubscribe('networkPlayerInventoryPacket', () => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onItemWasClicked = (item: ServerInventoryItem) => {
    if (item.item.is_building) {
      toggleInventory();
      const game = Game.getInstance();
      if (!game.world) return;
      /* Create ghost building entity */
      const ghostBuilding = addEntity(game.world);

      addComponent(game.world, GhostBuilding, ghostBuilding);
      addComponent(game.world, Sprite, ghostBuilding);
      addComponent(game.world, Position, ghostBuilding);
      addComponent(game.world, Collider, ghostBuilding);

      const buildingSettings = get_building_by_id(item.item.building?.id ?? 0);
      Sprite.texture[ghostBuilding] = ItemTextureMap[item.item.name]?.textureId ?? 0;
      Sprite.height[ghostBuilding] = (buildingSettings?.height ?? 1) * 16;
      Sprite.width[ghostBuilding] = (buildingSettings?.width ?? 1) * 16;
      Sprite.opacity[ghostBuilding] = 0.5;
      Position.x[ghostBuilding] = 0;
      Position.y[ghostBuilding] = 0;

      buildingBeingPlacedEntity.current = ghostBuilding;
      buildingBeingPlaced.current = item;
      console.log(item.item.building);
      game.input.on('pointerdown', placeBuilding);
      game.input.keyboard.once('keydown-ESC', () => cancelPlaceBuildingIntent());

      console.log('trying to place building: ', item.item.name);
    }
  };
  return (
    <Window windowManager={props.windowManager} title="Inventory" width={800} height={800} defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }} windowType={WindowType.VIEW_PLAYER_INVENTORY}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row flex-wrap">
            {inventory.map((inventoryItem) => {
              return (
                <div
                  onClick={() => onItemWasClicked(inventoryItem)}
                  key={inventoryItem.id}
                  className="flex flex-col m-2 text-center w-16 h-16 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
                >
                  <img alt={inventoryItem.item.display_name} className="flex-1 pixelart w-12  m-auto" src={`/assets/sprites/items/${inventoryItem.item.name}.png`}></img>
                  <p className="flex-1 m-[-8px]">x{inventoryItem.quantity}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Window>
  );
}
