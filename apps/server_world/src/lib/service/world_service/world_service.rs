use crate::world;

pub fn save_world(world: &world::World, connection: &mut redis::Connection) {

    let world_json = serde_json::to_string(&world).unwrap();

    redis::cmd("JSON.SET")
        .arg("worlds")
        .arg(&world.id)
        .arg(world_json)
        .execute(connection)

}
