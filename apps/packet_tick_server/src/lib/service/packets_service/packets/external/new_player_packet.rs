use serde::{Serialize, Deserialize};

use crate::{packets_service::NetworkPacket, world};

#[derive(Debug, Serialize, Deserialize)]
pub struct NewPlayerPacket {
    pub player: world::Player,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct NewPlayerPacketSerializeData {
    pub player: world::Player,
}
impl NetworkPacket for NewPlayerPacket {
    fn get_packet_type(&self) -> String {
        "newPlayer".to_string()
    }
    fn deserialize(&self, data: String) -> NewPlayerPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        let mut data = NewPlayerPacketSerializeData {
            player: self.player.clone(),
        };
        data.player.socket_id = "".to_string();
        serde_json::to_string(&data).unwrap()
    }
}
