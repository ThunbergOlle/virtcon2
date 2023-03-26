

use crate::packets_service::{NetworkPacket, publish_packet};
use crate::world;

#[path = "./packets/join_packet.rs"]
mod join_packet;

pub fn on_packet(packet: String, world: &mut world::World, connection: &mut redis::Connection,) {
    let packet_parts = packet.split("#").collect::<Vec<&str>>();
    let packet_type = packet_parts[0];
    let packet_parts = packet_parts[1..].join("#");
    match packet_type {
        "join" => packet_join_world(packet_parts, world, connection),
        _ => println!("Packet not found"),
    }
}

pub fn packet_join_world(packet: String, world: &mut world::World, connection: &mut redis::Connection,) {
    let packet = join_packet::JoinPacket::deserialize(packet);
    println!("Packet received: {:?}", packet);

    publish_packet(&packet, world.id.clone(), connection);

    let player = world::Player {
        id: packet.id,
        name: packet.name,
        position: packet.position,
    };

    world.players.append(&mut vec![player]);



}
