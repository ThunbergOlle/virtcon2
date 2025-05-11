import { gql, useQuery } from '@apollo/client';
import { addComponent, addReservedEntity, removeEntity } from '@virtcon2/bytenetc';
import {
  ClientPacket,
  InventoryType,
  PacketType,
  RequestMoveInventoryItemPacketData,
  RequestPlaceBuildingPacketData,
} from '@virtcon2/network-packet';
import { Collider, GhostBuilding, Position, Sprite, ItemTextureMap } from '@virtcon2/network-world-entities';
import { DBUserInventoryItem, get_building_by_id, get_tool_by_item_name } from '@virtcon2/static-game-data';
import { prop, sortBy } from 'ramda';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { events } from '../../../events/Events';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import { hotbarSlice } from '../../components/hotbar/HotbarSlice';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { useUser } from '../../context/user/UserContext';
import { fromPhaserPos } from '../../lib/coordinates';
import { close, isWindowOpen, toggle, WindowType } from '../../lib/WindowSlice';

const PLAYER_INVENTORY_FRAGMENT = gql`
  fragment PlayerInventoryFragment on UserInventoryItem {
    id
    quantity
    slot
    item {
      id
      display_name
      name
      is_building
      building {
        id
        is_rotatable
      }
    }
  }
`;

export const PLAYER_INVENTORY_QUERY = gql`
  ${PLAYER_INVENTORY_FRAGMENT}
  query PlayerInventoryWindow($userId: ID!) {
    userInventory(userId: $userId) {
      id
      ...PlayerInventoryFragment
    }
  }
`;

const PLAYER_INVENTORY_SUBSCRIPTION = gql`
  ${PLAYER_INVENTORY_FRAGMENT}
  subscription PlayerInventoryWindow($userId: ID!) {
    userInventory(userId: $userId) {
      id
      ...PlayerInventoryFragment
    }
  }
`;

export default function PlayerInventoryWindow() {
  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_PLAYER_INVENTORY));
  const user = useUser();
  const dispatch = useAppDispatch();

  const { subscribeToMore, data, loading, error } = useQuery<{ userInventory: DBUserInventoryItem[] }>(PLAYER_INVENTORY_QUERY, {
    variables: { userId: user.id },
    skip: !isOpen,
  });

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: PLAYER_INVENTORY_SUBSCRIPTION,
      variables: { userId: user.id },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        return subscriptionData.data;
      },
    });

    return unsubscribe;
  }, [subscribeToMore, user.id]);

  const buildingBeingPlaced = useRef<DBUserInventoryItem | null>(null);
  const buildingBeingPlacedEntity = useRef<number | null>(null);

  const cancelPlaceBuildingIntent = () => {
    const game = Game.getInstance();

    game.input.off('pointerdown', placeBuilding);
    game.input.off('keydown-R', rotatePlaceBuildingIntent);

    buildingBeingPlaced.current = null;
    if (!game.state.world || !buildingBeingPlacedEntity.current) return;
    removeEntity(game.state.world, buildingBeingPlacedEntity.current);
  };

  function rotatePlaceBuildingIntent() {
    const game = Game.getInstance();
    if (!game.state.world || !buildingBeingPlacedEntity.current) return;
    Sprite.rotation[buildingBeingPlacedEntity.current] = (90 + Sprite.rotation[buildingBeingPlacedEntity.current]) % 360;
  }

  function placeBuilding(e: Phaser.Input.Pointer) {
    if (!buildingBeingPlaced.current || buildingBeingPlaced.current.quantity <= 0) {
      toast('You do not have any more of this building in your inventory', { type: 'error' });
      return cancelPlaceBuildingIntent();
    }
    if (
      !buildingBeingPlacedEntity.current ||
      !GhostBuilding.placementIsValid[buildingBeingPlacedEntity.current] ||
      !buildingBeingPlaced.current.item
    )
      return;

    toast('Placing building', { type: 'info' });

    /* Send network packet to backend that we want to place the building at the coordinates */
    /* Convert phaser coordinates to the tilemap coordinates*/
    const { x, y } = fromPhaserPos({ x: e.worldX, y: e.worldY });
    const packet: ClientPacket<RequestPlaceBuildingPacketData> = {
      data: {
        buildingItemId: buildingBeingPlaced.current.item.id,
        rotation: Sprite.rotation[buildingBeingPlacedEntity.current],
        x,
        y,
      },
      packet_type: PacketType.REQUEST_PLACE_BUILDING,
    };

    Game.network.sendPacket(packet);
  }

  const onInventoryButtonPressed = useCallback(() => dispatch(toggle(WindowType.VIEW_PLAYER_INVENTORY)), [dispatch]);

  useEffect(() => {
    events.subscribe('onInventoryButtonPressed', onInventoryButtonPressed);
    return () => {
      events.unsubscribe('onInventoryButtonPressed', () => onInventoryButtonPressed);
    };
  }, [onInventoryButtonPressed]);

  const onItemWasClicked = (inventoryItem: DBUserInventoryItem) => {
    if (inventoryItem.item?.name && get_tool_by_item_name(inventoryItem.item.name)) {
      dispatch(hotbarSlice.actions.add({ item: inventoryItem.item, slot: 0 }));
    }

    if (!inventoryItem.item?.is_building) return;

    dispatch(close(WindowType.VIEW_PLAYER_INVENTORY));

    const game = Game.getInstance();
    if (!game.state.world) return;

    /* Create ghost building entity */
    const ghostBuilding = addReservedEntity(game.state.world, 2997);
    addComponent(game.state.world, GhostBuilding, ghostBuilding);
    addComponent(game.state.world, Sprite, ghostBuilding);
    addComponent(game.state.world, Position, ghostBuilding);
    addComponent(game.state.world, Collider, ghostBuilding);

    const buildingSettings = get_building_by_id(inventoryItem.item.building?.id ?? 0);
    if (!buildingSettings) return;

    game.state.ghostBuildingById[ghostBuilding] = buildingSettings;

    Sprite.texture[ghostBuilding] = ItemTextureMap[inventoryItem.item.name]?.textureId ?? 0;
    Sprite.height[ghostBuilding] = (buildingSettings?.height ?? 1) * 16;
    Sprite.width[ghostBuilding] = (buildingSettings?.width ?? 1) * 16;
    Sprite.opacity[ghostBuilding] = 0.5;
    Position.x[ghostBuilding] = 0;
    Position.y[ghostBuilding] = 0;

    buildingBeingPlacedEntity.current = ghostBuilding;
    buildingBeingPlaced.current = inventoryItem;

    // Event listeners
    game.input.on('pointerdown', placeBuilding);
    game.input.keyboard.once('keydown-ESC', () => cancelPlaceBuildingIntent());
    game.input.keyboard.once('keydown-Q', () => cancelPlaceBuildingIntent());
    if (buildingSettings?.is_rotatable) {
      game.input.keyboard.on('keydown-R', () => rotatePlaceBuildingIntent());
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

  const sortedInventory = sortBy(prop('slot'))(data?.userInventory ?? []);

  return (
    <Window
      title="Inventory"
      width={600}
      height={650}
      defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }}
      windowType={WindowType.VIEW_PLAYER_INVENTORY}
      fullWindowLoading={loading}
      errors={[error]}
    >
      <div className="grid grid-cols-8 grid-rows-8 gap-2">
        {sortedInventory.map((inventoryItem: DBUserInventoryItem) => {
          return inventoryItem.item ? (
            <InventoryItem
              key={inventoryItem.slot}
              inventoryItem={inventoryItem}
              slot={inventoryItem.slot}
              onDrop={onInventoryDropItem}
              onClick={() => onItemWasClicked(inventoryItem)}
              fromInventoryType={InventoryType.PLAYER}
              fromInventoryId={0}
              fromInventorySlot={inventoryItem.slot}
            />
          ) : (
            <InventoryItemPlaceholder key={inventoryItem.slot} inventoryId={0} slot={inventoryItem.slot} onDrop={onInventoryDropItem} />
          );
        })}
      </div>
    </Window>
  );
}
