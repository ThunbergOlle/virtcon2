

#[derive(Debug, Serialize, Deserialize)]
pub struct DisconnectPacket {
    pub id: String,
}
impl NetworkPacket for DisconnectPacket {
    fn get_packet_type(&self) -> String {
        "disconnect".to_string()
    }
    fn deserialize(&self, data: String) -> DisconnectPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}


pub fn packet_disconnect(
  packet: String,
  world: &mut world::World,
  _: &mut redis::Connection,
  publish_send_packet: &mpsc::Sender<String>,

) {
  // deserialize packet
  let deserialized_packet: DisconnectPacket = serde_json::from_str(&packet).unwrap();

  publish_packet(&deserialized_packet, &world.id, None, publish_send_packet);

  // remove player from world
  world.players.retain(|x| x.id != deserialized_packet.id);
}
