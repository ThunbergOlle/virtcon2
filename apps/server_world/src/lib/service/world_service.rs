use redis::Connection;

use crate::world::World;

pub fn get_world(world_id: &str, connection: &mut Connection) -> redis::RedisResult<World> {
  // get world
  let world = redis::cmd("JSON.GET")
      .arg("worlds")
      .arg(world_id)
      .query(connection)?;

  Ok(world)
}
