use std::{sync::mpsc, thread};

pub fn subscribe(
    redis_client: redis::Client,
    world_id: String,
    message_sender: mpsc::Sender<String>,
) {
    thread::spawn(move || {
        let mut redis_pub_sub_connection = redis_client
            .get_connection()
            .expect("Redis connection failed");
        let mut pubsub = redis_pub_sub_connection.as_pubsub();
        let channel_name = "router_".to_owned() + &world_id;
        /* Subscribe to world */
        pubsub
            .subscribe(channel_name)
            .expect("Failed to subscribe to world");

        loop {
            let msg = pubsub.get_message();
            match msg {
                Ok(msg) => {
                    let payload: String = msg.get_payload().expect("Failed to get payload");
                    message_sender
                        .send(payload)
                        .expect("Failed to send message");
                }
                Err(e) => {
                    println!("Error: {:?}", e);
                }
            }
        }
    });
}
