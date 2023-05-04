use crate::world;

pub fn save_world(world: &world::World, connection: &mut redis::Connection) {
    let world_json = serde_json::to_string(&world).unwrap();

    redis::cmd("JSON.SET")
        .arg("worlds")
        .arg(&world.id)
        .arg(world_json)
        .execute(connection)
}

pub fn get_world(
    world_id: &str,
    connection: &mut redis::Connection,
) -> redis::RedisResult<world::World> {
    // get world
    let world = redis::cmd("JSON.GET")
        .arg("worlds")
        .arg(world_id)
        .query(connection)?;

    Ok(world)
}
