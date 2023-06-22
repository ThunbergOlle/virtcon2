use std::sync::mpsc;

use derive_redis_json::RedisJsonValue;
use serde::{Serialize, Deserialize};

use crate::{packets_service::{publish_packet, NetworkPacket}, world};

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuildingPacket {
    building: WorldBuilding,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuildingId {
    pub id: i32,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuilding {
    pub id: i32,
    pub building: WorldBuildingId,
    pub active: bool,
    pub x: i32,
    pub y: i32,
    pub world_building_inventory: Option<Vec<world::WorldBuildingInventoryItem>>,
    pub output_world_building: Option<WorldBuildingId>,
    pub output_pos_x: Option<i32>,
    pub output_pos_y: Option<i32>,
}

impl NetworkPacket for WorldBuildingPacket {
    fn get_packet_type(&self) -> String {
        "worldBuilding".to_string()
    }
    fn deserialize(&self, data: String) -> WorldBuildingPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}

pub fn packet_world_building(
    packet: String,
    world: &world::World,
    redis_connection: &mut redis::Connection,
    publish_send_packet: &mpsc::Sender<String>,
) {
    let deserialized_packet: WorldBuildingPacket = serde_json::from_str(&packet).unwrap();

    publish_packet(&deserialized_packet, &world.id, None, publish_send_packet);

    let building_query = format!(
        "{}.buildings[?(@.id=={})]",
        world.id, deserialized_packet.building.id
    );

    redis::cmd("JSON.SET")
        .arg("worlds")
        .arg(&building_query)
        .arg(format!("{:?}", deserialized_packet.building))
        .execute(redis_connection);

}
