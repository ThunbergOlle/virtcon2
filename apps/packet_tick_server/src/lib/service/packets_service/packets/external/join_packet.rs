use std::sync::mpsc;

use serde::{Deserialize, Serialize};

use crate::{packets_service::{NetworkPacket, publish_packet}, world};

use super::{load_world::LoadWorldPacket, new_player::NewPlayerPacket};

#[derive(Debug, Serialize, Deserialize)]
pub struct JoinPacket {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
    pub socket_id: String,
}
#[derive(Serialize, Deserialize)]
struct JoinPacketSerializeData {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
}
impl NetworkPacket for JoinPacket {
    fn get_packet_type(&self) -> String {
        "join".to_string()
    }
    fn deserialize(&self, data: String) -> JoinPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        /* remove the socket id from the packet. So all socket ids are kept secret */
        let data = JoinPacketSerializeData {
            id: self.id.clone(),
            name: self.name.clone(),
            position: self.position.clone(),
        };
        serde_json::to_string(&data).unwrap()
    }
}

pub fn packet_join_world(
    packet: String,
    world: &world::World,
    redis_connection: &mut redis::Connection,
    sender: &str,
    publish_send_packet: &mpsc::Sender<String>,
) {
    // we need to get the user from the PostgreSQL database

    let world_id = world.id.clone();
    // deserialize packet
    let deserialized_packet: JoinPacket = serde_json::from_str(&packet).unwrap();

    publish_packet(&deserialized_packet, &world.id, None, publish_send_packet);

    let player = world::Player {
        id: deserialized_packet.id,
        name: deserialized_packet.name,
        position: deserialized_packet.position,
        inventory: vec![],
        socket_id: deserialized_packet.socket_id,
        world_id: world_id,
    };

    let load_world_packet = LoadWorldPacket {
        world: world.clone(),
        player: player.clone(),
    };

    publish_packet(
        &load_world_packet,
        &world.id,
        Some(sender),
        publish_send_packet,
    );

    let new_player_packet = NewPlayerPacket {
        player: player.clone(),
    };

    publish_packet(&new_player_packet, &world.id, None, publish_send_packet);

    // serialized player
    let serialized_player = serde_json::to_string(&player).unwrap();
    let worlds_player_query = format!("{}.players", world.id);
    redis::cmd("JSON.ARRAPPEND")
        .arg("worlds")
        .arg(worlds_player_query)
        .arg(serialized_player)
        .execute(redis_connection);
}
