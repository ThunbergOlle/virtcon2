use serde::{Serialize, Deserialize};

use crate::{world, packets_service::NetworkPacket};

#[derive(Debug, Serialize, Deserialize)]
pub struct LoadWorldPacket {
    pub world: world::World,
    pub player: world::Player,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct LoadWorldPacketSerializeData {
    pub world: world::World,
    pub player: world::Player,
}
impl NetworkPacket for LoadWorldPacket {
    fn get_packet_type(&self) -> String {
        "loadWorld".to_string()
    }
    fn deserialize(&self, data: String) -> LoadWorldPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        let mut data = LoadWorldPacketSerializeData {
            world: self.world.clone(),
            player: self.player.clone(),
        };
        data.player.socket_id = "".to_string();
        serde_json::to_string(&data).unwrap()
    }
}
