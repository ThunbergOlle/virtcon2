use std::sync::mpsc;

use serde::{Serialize, Deserialize};

use crate::{packets_service::{NetworkPacket, publish_packet}, world};



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
  world: &world::World,
  redis_connection: &mut redis::Connection,
  publish_send_packet: &mpsc::Sender<String>,
) {
  let deserialized_packet: PlayerMovePacket = serde_json::from_str(&packet).unwrap();
  publish_packet(&deserialized_packet, &world.id, None, publish_send_packet);

  let player_query = format!("JSON.GET worlds {}.players[?(@.id=='{}')]", world.id, deserialized_packet.player_id);
  // update player position in redis database
  redis::cmd("JSON.SET")
      .arg("worlds")
      .arg(&player_query)
      .arg(format!("{{\"position\": {:?}}}", deserialized_packet.position))
      .execute(redis_connection);


}

