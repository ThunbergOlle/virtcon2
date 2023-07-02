use std::sync::mpsc;

use derive_redis_json::RedisJsonValue;
use serde::{Deserialize, Serialize};

use crate::{
    packets_service::{publish_packet, NetworkPacket},
    world::{self, Building, WorldBuildingInventoryItem},
};

// copy struct world::WorldBuilding
#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct PlaceBuildingPacket {
    pub id: i32,
    pub building: Option<Building>,
    pub active: bool,
    pub x: i32,
    pub y: i32,
    pub rotation: f32,
    #[serde(default)]
    pub current_processing_ticks: u32,
    pub world_building_inventory: Option<Vec<WorldBuildingInventoryItem>>,
    pub output_world_building: Option<WorldBuildingId>,
    pub output_pos_x: Option<i32>,
    pub output_pos_y: Option<i32>,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuildingId {
    pub id: i32,
}

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
