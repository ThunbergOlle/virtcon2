#[derive(Debug, Serialize, Deserialize)]
pub struct JoinPacket {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
    pub socket_id: String,
}
#[derive(Serialize, Deserialize)]
struct JoinPacketSerializeData {
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
        /* remove the socket id from the packet. So all socket ids are kept secret */
        let data = JoinPacketSerializeData {
            id: self.id.clone(),
            name: self.name.clone(),
            position: self.position.clone(),
        };
        serde_json::to_string(&data).unwrap()
    }
}

pub fn packet_join_world(
    packet: String,
    world: &mut world::World,
    connection: &mut redis::Connection,
    sender: &str,
) {
    let world_id = world.id.clone();
    // deserialize packet
    let deserialized_packet: JoinPacket = serde_json::from_str(&packet).unwrap();

    publish_packet(&deserialized_packet, &world.id, None, connection);
    let player = world::Player {
        id: deserialized_packet.id,
        name: deserialized_packet.name,
        position: deserialized_packet.position,
        socket_id: deserialized_packet.socket_id,
        world_id: world_id,
    };
    let load_world_packet = LoadWorldPacket {
        world: world.clone(),
        player: player.clone(),
    };
    publish_packet(&load_world_packet, &world.id, Some(sender), connection);

    world.players.append(&mut vec![player]);
}
