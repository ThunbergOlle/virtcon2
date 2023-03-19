fn main() {
    // get worldId env variable
    let world_id = std::env::var("WORLD_ID").expect("WORLD_ID must be set");
    let env_tps = std::env::var("TPS").expect("TPS must be set");
    let tps = env_tps.parse::<u64>().expect("TPS must be a number");

    // print world id
    println!("Setting up world with ID: {}", world_id);
    // tick system
    loop {
        // tick
        println!("Ticking world with ID: {}", world_id);
        // sleep
        std::thread::sleep(std::time::Duration::from_millis(1000 / tps));

    }
}
