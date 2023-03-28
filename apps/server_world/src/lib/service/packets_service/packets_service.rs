use std::sync::mpsc;


use serde::{Deserialize, Serialize};

use crate::{world, world_service::{save_world, self}};



#[path = "./packets/packets.rs"]
mod packets;

pub trait NetworkPacket {
    fn get_packet_type(&self) -> String;
    fn deserialize(&self, data: String) -> Self;
    fn serialize(&self) -> String;
}

pub fn tick(
    world_id: String,
    message_receiver: &std::sync::mpsc::Receiver<String>,
    publish_send_packet: &mpsc::Sender<String>,
    connection: &mut redis::Connection,
) {
    let mut world = world_service::get_world(&world_id, connection).expect("World not found");

    let client_packets = message_receiver
        .try_iter()
        .map(|x| x)
        .collect::<Vec<String>>();

    /* Run handler that will check and handle all of the newly received packets. */
    handle_packets(client_packets, &mut world, connection, publish_send_packet);

    /* Save the world after we are done modifying it for this tick */
    save_world(&world, connection);
}

pub fn handle_packets(
    client_packets: Vec<String>,
    world: &mut world::World,
    connection: &mut redis::Connection,
    publish_send_packet: &mpsc::Sender<String>,
) {
    for i in client_packets {
        on_packet(i, world, connection, publish_send_packet);
    }
}
pub fn on_packet(packet: String, world: &mut world::World, connection: &mut redis::Connection, publish_send_packet: &mpsc::Sender<String>) {
    let packet_parts = packet.split("#").collect::<Vec<&str>>();
    let packet_type = packet_parts[0];
    let packet_target = packet_parts[1];
    let packet_data = packet_parts[2].to_string();

    match packet_type {
        "join" => packets::packet_join_world(packet_data, world, connection, packet_target, publish_send_packet),
        "disconnect" => packets::packet_disconnect(packet_data, world, connection, publish_send_packet),
        "playerMove" => packets::packet_player_move(packet_data, world, connection, publish_send_packet),
        "playerSetPosition" => packets::packet_player_set_position(packet_data, world, connection, publish_send_packet),
        _ => println!("Packet not found"),
    }
}

/* Section for publishing of new packets  */
#[derive(Debug, Serialize, Deserialize)]
pub struct PublishablePacket {
    world_id: String,
    packet_type: String,
    data: String,
}

pub fn publish_packet(
    packet: &impl NetworkPacket,
    world_id: &str,
    target: Option<&str>,
    publish_send_packet: &mpsc::Sender<String>,
) {
    // serialize json
    let packet = PublishablePacket {
        world_id: world_id.to_string(),
        packet_type: packet.get_packet_type(),
        data: packet.serialize(),
    };

    let serialized_packet = serde_json::to_string(&packet).unwrap();

    // if no target, send to world
    let channel = match target {
        Some(target) => format!("socket:{}", target),
        None => format!("world:{}", world_id),
    };

    let publishable_packet = format!("{}#{}", channel, serialized_packet);
    publish_send_packet.send(publishable_packet).unwrap();

}
