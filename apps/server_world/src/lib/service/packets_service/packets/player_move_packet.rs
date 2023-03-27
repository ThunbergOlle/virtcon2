#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerMovePacket {
    pub player_id: String,
    pub position: Vec<f32>,
}
impl NetworkPacket for PlayerMovePacket {
    fn get_packet_type(&self) -> String {
        "playerMove".to_string()
    }
    fn deserialize(&self, data: String) -> PlayerMovePacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}
pub fn packet_player_move(
  packet: String,
  world: &mut world::World,
  connection: &mut redis::Connection,
) {
  let deserialized_packet: PlayerMovePacket = serde_json::from_str(&packet).unwrap();
  publish_packet(&deserialized_packet, world.id.clone(), connection);

  // get the player from the world
  match world.players.iter_mut().find(|x| x.id == deserialized_packet.player_id) {
      Some(player) => {
          player.position = deserialized_packet.position;
      }
      None => {
          println!("Player not found");
      }
  }
}
