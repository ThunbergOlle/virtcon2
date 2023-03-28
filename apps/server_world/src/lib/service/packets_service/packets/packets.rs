
use crate::packets_service::NetworkPacket;
use serde::{Deserialize, Serialize};
use crate::packets_service::publish_packet;
use crate::{world};

include!("./join_packet.rs");
include!("./disconnect_packet.rs");
include!("./player_move_packet.rs");
include!("./load_world_packet.rs");

// packet type
#[derive(Debug, Serialize, Deserialize)]
pub enum PacketTypes {
    UnknownPacket,
    JoinPacket,
    DisconnectPacket,
    PlayerMovePacket,
    LoadWorldPacket,
}



