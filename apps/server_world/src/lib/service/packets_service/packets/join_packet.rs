use crate::packets_service::NetworkPacket;

#[derive(Debug)]
pub struct JoinPacket {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
}

impl NetworkPacket for JoinPacket {
    fn deserialize(packet: String) -> Self {
        let packet = packet.split("#").collect::<Vec<&str>>();

        let id = packet[0].to_string();
        let name = packet[1].to_string();

        let position = vec![
            packet[2].parse::<f32>().unwrap(),
            packet[3].parse::<f32>().unwrap(),
        ];

        JoinPacket {
            id,
            name,
            position,
        }
    }
    fn serialize(&self) -> String {
        let packet = format!(
            "join#{}#{}#{}#{}",
            self.id,
            self.name,
            self.position[0].to_string(),
            self.position[1].to_string()
        );
        packet
    }
}
