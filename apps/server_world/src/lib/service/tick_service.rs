pub fn tick(tps: i32, tick: &mut i32, last_tick: &mut std::time::Instant, tick_begin_life_time: std::time::Instant) {
    // increase tick
    *tick += 1;

    let current_tick = *tick;
    // sleep
    let sleep_time = std::time::Duration::from_millis((1000 / tps).try_into().unwrap());
    let elapsed = last_tick.elapsed();
    if elapsed < sleep_time {
        if current_tick % 100 == 0 {
            println!(
                "Tick ({}) took: {:?}, average tick-rate: {:?}",
                current_tick,
                elapsed,
                ((current_tick) as f64 / tick_begin_life_time.elapsed().as_secs_f64())
            );
        }

        std::thread::sleep(sleep_time - elapsed);
    }
    *last_tick = std::time::Instant::now();
}
