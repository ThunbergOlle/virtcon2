import { useMutation, useQuery } from '@apollo/client';
import { ServerInventoryItem } from '@shared';
import { PacketType } from '@virtcon2/network-packet';
import { DBItem, DBItemRecipe } from '@virtcon2/static-game-data';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { events } from '../../../events/Events';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import Window from '../../components/window/Window';
import { isWindowOpen, toggle, WindowType } from '../../lib/WindowSlice';
import { CRAFT_MUTATION, ITEMS_QUERY } from './CrafterWindowGraphQL';

export default function CrafterWindow() {
  const itemsQuery = useQuery(ITEMS_QUERY);
  const [mutateCraftItem, craftItemMutation] = useMutation(CRAFT_MUTATION);

  const quantityInput = useRef<HTMLInputElement>(null);
  const [quantityToCraft, setQuantityToCraft] = useState<string>('1');
  const [selectedItem, setSelectedItem] = useState<DBItem | null>(null);
  const [inventory, setInventory] = useState<Array<ServerInventoryItem>>([]);

  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_CRAFTER));
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isOpen) {
      Game.network.sendPacket({
        data: {},
        packet_type: PacketType.REQUEST_PLAYER_INVENTORY,
      });
      craftItemMutation.reset();
    }
  }, [isOpen]);

  const onCrafterButtonPressed = useCallback(() => dispatch(toggle(WindowType.VIEW_CRAFTER)), [dispatch]);

  const onNetWorkPlayerInventoryPacket = ({ inventory }: { inventory: Array<ServerInventoryItem> }) => {
    setInventory(inventory);
  };

  useEffect(() => {
    events.subscribe('onCrafterButtonPressed', onCrafterButtonPressed);
    events.subscribe('networkPlayerInventory', onNetWorkPlayerInventoryPacket);

    return () => {
      events.unsubscribe('onCrafterButtonPressed', () => onCrafterButtonPressed);
      events.unsubscribe('networkPlayerInventory', onNetWorkPlayerInventoryPacket);
    };
  }, [onCrafterButtonPressed]);

  const craftItem = () => {
    mutateCraftItem({
      variables: {
        quantity: parseInt(quantityToCraft),
        itemId: selectedItem?.id,
      },
      onCompleted: () => {
        Game.network.sendPacket({
          data: {},
          packet_type: PacketType.REQUEST_PLAYER_INVENTORY,
        });
        toast(`Crafted ${quantityToCraft}x ${selectedItem?.display_name}`, { type: 'success' });
      },
    });
  };
  return (
    <Window
      loading={[itemsQuery.loading, craftItemMutation.loading]}
      errors={[itemsQuery.error, craftItemMutation.error]}
      title="Crafter"
      width={800}
      height={600}
      defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }}
      windowType={WindowType.VIEW_CRAFTER}
    >
      <div className="flex flex-row h-full">
        <div className="flex-1">
          {itemsQuery.data?.Items?.filter((i: DBItem) => i.recipe && i.recipe.length > 0).map((item: DBItem) => {
            const icon = Game.getInstance().textures.getBase64(item?.name || '');
            return (
              <div
                onClick={() => {
                  setSelectedItem(item);
                }}
                key={item.id}
                className="flex flex-row px-2  items-center  w-full h-10 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
              >
                <p className="flex-1">{item.display_name}</p>
                <div className="flex-1">
                  <img alt={item.display_name} className="pixelart h-10 w-10 float-right" src={icon}></img>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-[2]">
          {selectedItem ? (
            <div className="text-center flex flex-col justify-between h-full">
              <div className="flex-1">
                <h3 className="text-2xl ">{selectedItem.display_name}</h3>
                <p>{selectedItem.description}</p>
              </div>

              <div className="flex flex-[5] flex-row flex-wrap  bg-[#282828] mx-10 ">
                {selectedItem.recipe?.map((recipeItem: DBItemRecipe) => {
                  // optimize this later
                  const quantity_in_inventory = inventory.filter((i) => i.item?.id === recipeItem.requiredItem.id).reduce((a, b) => a + b.quantity, 0);

                  return (
                    <div
                      key={'recipe_item_' + recipeItem.id}
                      className="flex flex-col text-center w-20 h-20  cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
                    >
                      <img
                        alt={recipeItem.requiredItem.display_name}
                        className="flex-1 pixelart w-12  m-auto"
                        src={`/assets/sprites/items/${recipeItem.requiredItem.name}.png`}
                      ></img>
                      <p className="flex-1 m-[-8px]">
                        {quantity_in_inventory || 0}/{recipeItem.requiredQuantity}
                      </p>
                      <p className="flex-1 text-[11px]">{recipeItem.requiredItem.display_name}</p>
                    </div>
                  );
                })}
              </div>
              <div className="my-4 mx-10 flex-1 flex flex-col  ">
                <div className="flex-row flex flex-1 items-center">
                  <label htmlFor="quantityToCraft" className="flex-1">
                    Quantity
                  </label>
                  <input
                    ref={quantityInput}
                    name="quantityToCraft"
                    className="min-w-[200] h-9 text-center flex-[4]"
                    type="number"
                    value={quantityToCraft}
                    min={1}
                    max={2147483647}
                    onChange={(e) => {
                      setQuantityToCraft(e.target.value);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Button onClick={() => craftItem()} variant="primary" disabled={!quantityInput.current?.validity.valid} className="float-right">
                    Craft
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>Please select an item to craft</div>
          )}
        </div>
      </div>
    </Window>
  );
}
