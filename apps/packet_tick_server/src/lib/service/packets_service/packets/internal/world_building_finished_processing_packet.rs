use serde::{Deserialize, Serialize};

use crate::packets_service::NetworkPacket;

#[derive(Debug, Serialize, Deserialize)]
pub struct WorldBuildingFinishedProcessing {
    pub world_building_id: i32,
}
impl NetworkPacket for WorldBuildingFinishedProcessing {
    fn get_packet_type(&self) -> String {
        "internalWorldBuildingFinishedProcessing".to_string()
    }
    fn deserialize(&self, data: String) -> WorldBuildingFinishedProcessing {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        let data = WorldBuildingFinishedProcessing {
            world_building_id: self.world_building_id.clone(),
        };
        serde_json::to_string(&data).unwrap()
    }
}
