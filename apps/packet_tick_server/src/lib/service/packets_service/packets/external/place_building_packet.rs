use std::sync::mpsc;

use crate::{packets_service::{publish_packet, NetworkPacket}, world};


type PlaceBuildingPacket = world::WorldBuilding;

impl NetworkPacket for PlaceBuildingPacket {
    fn get_packet_type(&self) -> String {
        "placeBuilding".to_string()
    }
    fn deserialize(&self, data: String) -> PlaceBuildingPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}
pub fn packet_place_building(
  packet: String,
  world: &world::World,
  redis_connection: &mut redis::Connection,
  publish_send_packet: &mpsc::Sender<String>,
) {
  let deserialized_packet: PlaceBuildingPacket = serde_json::from_str(&packet).unwrap();
  publish_packet(&deserialized_packet, &world.id, None, publish_send_packet);

  let world_building_query = format!("{}.buildings", world.id);
  redis::cmd("JSON.ARRAPPEND")
        .arg("worlds")
        .arg(world_building_query)
        .arg(packet)
        .execute(redis_connection);

}

