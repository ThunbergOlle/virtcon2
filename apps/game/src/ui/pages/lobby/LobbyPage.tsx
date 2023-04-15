import { ServerPlayer, serverUrl } from '@shared';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LobbyPage() {
  const [worlds, setWorlds] = useState<{ id: string; name: string; players: ServerPlayer[] }[]>([]);

  const navigate = useNavigate();
  useEffect(() => {
    fetch(serverUrl + '/worlds')
      .then((res) => res.json())
      .then((data) => setWorlds(data));
  }, []);

  const joinWorld = (worldId: string) => {
    navigate(`/world/${worldId}`);
  };

  return (
    <div className="p-20">
      <h2>Worlds</h2>
      <em>Press to join a world in the list</em>
      <ul>
        {worlds.map((world) => {
          return (
            <li key={world.id} onClick={() => joinWorld(world.id)} className="hover:cursor-pointer text-green-400">
              {world.name} ({world.players.length} players)
            </li>
          );
        })}
      </ul>
    </div>
  );
}
