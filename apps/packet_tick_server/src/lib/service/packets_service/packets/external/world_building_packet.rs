use std::sync::mpsc;

use derive_redis_json::RedisJsonValue;
use serde::{Deserialize, Serialize};

use crate::{
    merge::merge,
    packets_service::{publish_packet, NetworkPacket},
    world,
};
#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct WorldBuildingId {
    pub id: i32,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct WorldBuilding {
    pub id: i32,
    pub building: WorldBuildingId,
    pub x: i32,
    pub y: i32,
    pub rotation: f32,
    pub world_building_inventory: Option<Vec<world::WorldBuildingInventoryItem>>,
    pub output_world_building: Option<WorldBuildingId>,
    pub output_pos_x: Option<i32>,
    pub output_pos_y: Option<i32>,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct WorldBuildingOutgoingPacket {
    building: world::WorldBuilding,
}

impl NetworkPacket for WorldBuildingIncomingPacket {
    fn get_packet_type(&self) -> String {
        "worldBuilding".to_string()
    }
    fn deserialize(&self, data: String) -> WorldBuildingIncomingPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct WorldBuildingIncomingPacket {
    building: WorldBuilding,
}
impl NetworkPacket for WorldBuildingOutgoingPacket {
    fn get_packet_type(&self) -> String {
        "worldBuilding".to_string()
    }
    fn deserialize(&self, data: String) -> WorldBuildingOutgoingPacket {
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
    let deserialized_packet = serde_json::from_str(&packet);

    if let Err(e) = deserialized_packet {
        println!("Error deserializing packet: {:?}", e);
        return;
    }

    let deserialized_packet: WorldBuildingIncomingPacket = deserialized_packet.unwrap();

    let building_query = format!(
        "{}.buildings[?(@.id=={})]",
        world.id, deserialized_packet.building.id
    );

    let current_world_building = redis::cmd("JSON.GET")
        .arg("worlds")
        .arg(&building_query)
        .query::<world::WorldBuilding>(redis_connection);

    if let Err(e) = current_world_building {
        println!("Error getting current world building: {:?}", e);
        return;
    }
    let mut current_world_building = current_world_building.unwrap();

    let merge_result = merge_values(&mut current_world_building, deserialized_packet.building);

    if let Err(e) = merge_result {
        println!("Error merging values: {:?}", e);
        println!("Skipping inserting faulty data to redis");
        return;
    }

    let packet = WorldBuildingOutgoingPacket {
        building: current_world_building,
    };

    publish_packet(&packet, &world.id, None, publish_send_packet);
    redis::cmd("JSON.SET")
        .arg("worlds")
        .arg(&building_query)
        .arg(packet.building)
        .execute(redis_connection);
}

fn merge_values(
    current_world_building: &mut world::WorldBuilding,
    new_building: WorldBuilding,
) -> Result<(), serde_json::Error> {
    let serialized_current_world_building = serde_json::to_value(&current_world_building);
    let serialized_new_building = serde_json::to_value(&new_building);

    if let Err(e) = serialized_current_world_building {
        println!("Error serializing current_world_building: {:?}", e);
        return Err(e);
    }

    if let Err(e) = serialized_new_building {
        println!("Error serializing new_building: {:?}", e);
        return Err(e);
    }

    let mut serialized_current_world_building = serialized_current_world_building.unwrap();
    let serialized_new_building = serialized_new_building.unwrap();

    // merge / patch the current world building with the new world building
    merge(
        &mut serialized_current_world_building,
        serialized_new_building,
    );

    // deserialize the merged world building
    let merged_world_building = serde_json::from_value(serialized_current_world_building);

    if let Err(e) = merged_world_building {
        println!("Error deserializing merged_world_building: {:?}", e);
        return Err(e);
    }

    *current_world_building = merged_world_building.unwrap();
    return Ok(());
}
