use crate::world;

#[path = "./packets/packets.rs"]
mod packets;

pub fn on_packet(packet: String, world: &mut world::World, connection: &mut redis::Connection) {
    println!("Packet: {}", packet);
    let packet_parts = packet.split("#").collect::<Vec<&str>>();
    let packet_type = packet_parts[0];
    let packet = packet_parts[1].to_string();

    match packet_type {
        "join" => packets::packet_join_world(packet, world, connection),
        "disconnect" => packets::packet_disconnect(packet, world, connection),
        "playerMove" => packets::packet_player_move(packet, world, connection),
        _ => println!("Packet not found"),
    }
}
