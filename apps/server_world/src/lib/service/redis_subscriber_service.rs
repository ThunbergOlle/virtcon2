use std::{thread, sync::mpsc};

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
        /* Subscribe to world */
        pubsub
            .subscribe(world_id)
            .expect("Failed to subscribe to world");

        loop {
            let msg = pubsub.get_message();
            match msg {
                Ok(msg) => {
                    println!("Got message: {:?}", msg);
                    let payload: String = msg.get_payload().expect("Failed to get payload");
                    message_sender.send(payload).expect("Failed to send message");
                }
                Err(e) => {
                    println!("Error: {:?}", e);
                }
            }
        }
    });
}
