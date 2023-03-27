pub fn tick(
    tps: i32,
    tick: &mut i32,
    last_tick: &mut std::time::Instant,
) {
    // increase tick
    *tick += 1;

    let current_tick = *tick;
    // sleep
    let sleep_time = std::time::Duration::from_millis((1000 / tps).try_into().unwrap());
    let elapsed = last_tick.elapsed();

    if let Some(over) = elapsed.checked_sub(sleep_time) {
        println!("Lagging behind: {:?}", over);
    }

    if elapsed < sleep_time {
        if current_tick % 100 == 0 {
            println!(
                "Tick ({}) took: {:?}",
                current_tick, elapsed,
            );
          }

        std::thread::sleep(sleep_time - elapsed);
    }
    *last_tick = std::time::Instant::now();
}
