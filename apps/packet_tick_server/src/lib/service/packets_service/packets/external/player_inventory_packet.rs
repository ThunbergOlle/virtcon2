
use std::sync::mpsc;

use serde::{Deserialize, Serialize};

use crate::{world::{InventoryItem, self}, packets_service::{NetworkPacket, publish_packet}};

#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerInventoryPacket {
    pub player_id: String,
    pub inventory: Vec<InventoryItem>
}
impl NetworkPacket for PlayerInventoryPacket {
    fn get_packet_type(&self) -> String {
        "playerInventoryPacket".to_string()
    }
    fn deserialize(&self, data: String) -> PlayerInventoryPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}


pub fn packet_player_inventory(
  packet: String,
  world: &world::World,
  publish_send_packet: &mpsc::Sender<String>,
) {
  // print packet
  let deserialized_packet: PlayerInventoryPacket = serde_json::from_str(&packet).unwrap();
  publish_packet(&deserialized_packet, &world.id, None, publish_send_packet);
}
