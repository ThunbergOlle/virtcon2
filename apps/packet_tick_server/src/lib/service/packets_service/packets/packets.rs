
use crate::packets_service::NetworkPacket;
use serde::{Deserialize, Serialize};
use crate::packets_service::publish_packet;
use crate::{world};
use std::{
  sync::{mpsc},
};

include!("./external/join_packet.rs");
include!("./external/disconnect_packet.rs");
include!("./external/player_move_packet.rs");
include!("./external/load_world_packet.rs");
include!("./external/player_set_position_packet.rs");
include!("./external/new_player_packet.rs");

// packet type
#[derive(Debug, Serialize, Deserialize)]
pub enum PacketTypes {
    UnknownPacket,
    JoinPacket,
    DisconnectPacket,
    PlayerMovePacket,
    LoadWorldPacket,
    NewPlayerPacket,
}



