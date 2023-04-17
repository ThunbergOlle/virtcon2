import { ServerPlayer, serverUrl } from '@shared';
import { useEffect, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
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
      <Button className="float-right">Join my world</Button>
      <Table className="text-white my-5" bordered>
        <thead>
          <tr>
            <th>Name</th>
            <th>Players</th>
          </tr>

        </thead>
        <tbody>
          {worlds.map((world) => {
            return (
              <tr key={world.id} onClick={() => joinWorld(world.id)} className="hover:cursor-pointer text-green-400">
                <td>{world.name}</td>
                <td>{world.players.length}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

    </div>
  );
}
