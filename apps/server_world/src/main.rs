use std::{
    sync::{mpsc},
};



// import mod world
#[path = "./lib/database/models/world.rs"]
mod world;

#[path = "./lib/service/tick_service.rs"]
mod tick_service;

#[path = "./lib/service/redis_subscriber_service.rs"]
mod redis_subscriber_service;

#[path = "./lib/service/packets_service/packets_service.rs"]
mod packets_service;

#[path = "./lib/service/world_service/world_service.rs"]
mod world_service;


fn main() {
    /* Setup redis connection */
    let redis_client =
        redis::Client::open("redis://127.0.0.1/").expect("Failed to connect to redis");

    let mut redis_connection = redis_client
        .get_connection()
        .expect("Redis connection failed");

    let world_id = std::env::var("WORLD_ID").expect("WORLD_ID must be set");
    let env_tps = std::env::var("TPS").expect("TPS must be set");
    let tps = env_tps.parse::<i32>().expect("TPS must be a number");


    let (message_sender, message_receiver) = mpsc::channel();

    redis_subscriber_service::subscribe(redis_client, world_id.clone(), message_sender);

    // tick system
    let mut tick = 0;
    let mut last_tick = std::time::Instant::now();

    loop {
        packets_service::tick(world_id.clone(),&message_receiver, &mut redis_connection);
        tick_service::tick(tps, &mut tick, &mut last_tick);
    }
}
