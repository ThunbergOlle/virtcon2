
// import mod world
#[path = "./lib/database/models/world.rs"]
mod world;

fn main() {
    // get worldId env variable
    let world_id = std::env::var("WORLD_ID").expect("WORLD_ID must be set");
    let env_tps = std::env::var("TPS").expect("TPS must be set");
    let tps = env_tps.parse::<u64>().expect("TPS must be a number");

    // print world id
    println!("Setting up world with ID: {}", world_id);
    let world = get_world(world_id).expect("World not found");
    // tick system
    loop {
        // tick
        println!("Ticking world with ID: {}", &world.id);
        // sleep
        std::thread::sleep(std::time::Duration::from_millis(1000 / tps));

    }
}
fn get_world(world_id: String) -> redis::RedisResult<world::World> {
    // get redis connection
    let client = redis::Client::open("redis://127.0.0.1/")?;
    let mut con = client.get_connection()?;

    let world_location = format!("worlds.$.{}", world_id);
    // get world
    let world: world::World = redis::cmd("JSON.GET")
        .arg(world_location)
        .query(&mut con)?;

    Ok(world)
}
