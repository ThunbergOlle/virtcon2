import { ServerPlayer, serverUrl } from '@shared';
import { useContext, useEffect, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/user/UserContext';

export default function LobbyPage() {
  const user = useContext(UserContext);
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
      {user && (
        <Button className="float-right" onClick={() => joinWorld(user.display_name)}>
          Join my world
        </Button>
      )}

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
                <td>{world.id.replace('_', ' ')}</td>
                <td>{world.players.length}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
