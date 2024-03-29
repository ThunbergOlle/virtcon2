use redis::Commands;

pub fn tick(
    tps: i32,
    world_id: String,
    tick: &mut u32,
    last_tick: &mut std::time::Instant,
    redis_connection: &mut redis::Connection,
    on_send_packet: &std::sync::mpsc::Receiver<String>,
) {
    let send_packets = on_send_packet
        .try_iter()
        .map(|x| x)
        .collect::<Vec<String>>();


    let channel = format!("tick_{}", world_id);

    match redis_connection.publish::<String, String, i32>(channel, send_packets.join(";;")){
        Ok(_) => {}
        Err(e) => {
            println!("Error publishing to channel: {:?}", e);
        }
    }

    // increase tick
    *tick += 1;

    let current_tick = *tick;
    // sleep
    let sleep_time = std::time::Duration::from_millis((1000 / tps).try_into().unwrap());
    let elapsed = last_tick.elapsed();

    if let Some(over) = elapsed.checked_sub(sleep_time) {
      if over > std::time::Duration::from_millis(100) {
        println!("Lagging behind {:?} on tick {:?}", over, tick);
      }
    }

    if elapsed < sleep_time {
        if current_tick % 100 == 0 {
            println!("Tick ({}) took: {:?}", current_tick, elapsed,);
        }

        std::thread::sleep(sleep_time - elapsed);
    }
    *last_tick = std::time::Instant::now();
}
