

#[derive(Debug, Serialize, Deserialize)]
pub struct JoinPacket {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
}
impl NetworkPacket for JoinPacket {
    fn get_packet_type(&self) -> String {
        "join".to_string()
    }
    fn deserialize(&self, data: String) -> JoinPacket {
        serde_json::from_str(&data).unwrap()
    }
    fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}


pub fn packet_join_world(
  packet: String,
  world: &mut world::World,
  connection: &mut redis::Connection,
) {
  // deserialize packet
  let deserialized_packet: JoinPacket = serde_json::from_str(&packet).unwrap();

  publish_packet(&deserialized_packet, world.id.clone(), connection);

  let player = world::Player {
      id: deserialized_packet.id,
      name: deserialized_packet.name,
      position: deserialized_packet.position,
  };

  world.players.append(&mut vec![player]);
}
