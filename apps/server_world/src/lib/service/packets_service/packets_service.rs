use redis::Commands;
use serde::{Deserialize, Serialize};

use crate::{world, world_service::save_world};

#[path = "../world_service.rs"]
mod world_service;

#[path = "./packets_handler.rs"]
mod packets_handler;

pub trait NetworkPacket {
    fn get_packet_type(&self) -> String;
    fn deserialize(&self, data: String) -> Self;
    fn serialize(&self) -> String;
}

pub fn handle_packets(
    client_packets: Vec<String>,
    world: &mut world::World,
    connection: &mut redis::Connection,
) {
    for i in client_packets {
        packets_handler::on_packet(i, world, connection);
    }
}
pub fn tick(
    world_id: String,
    message_receiver: &std::sync::mpsc::Receiver<String>,
    connection: &mut redis::Connection,
) {
    let mut world = world_service::get_world(&world_id, connection).expect("World not found");

    let client_packets = message_receiver
        .try_iter()
        .map(|x| x)
        .collect::<Vec<String>>();

    handle_packets(client_packets, &mut world, connection);
    save_world(&world, connection);
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublishablePacket {
    world_id: String,
    packet_type: String,
    data: String,
}

pub fn publish_packet(
    packet: &impl NetworkPacket,
    world_id: String,
    connection: &mut redis::Connection,
) {
    // serialize json
    let packet = PublishablePacket {
        world_id,
        packet_type: packet.get_packet_type(),
        data: packet.serialize(),
    };
    let serialized_packet = serde_json::to_string(&packet).unwrap();

    match connection.publish::<String, String, i32>(
        format!("from_world:{}", packet.world_id),
        serialized_packet,
    ) {
        Ok(_) => {}
        Err(e) => {
            println!("Error: {:?}", e);
        }
    }
}
