use crate::world;

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
