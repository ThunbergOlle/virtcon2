use std::sync::mpsc;

use crate::{packets_service::publish_internal_packet, world};

/* When ticking, we need to increase the state of each of the buildings */
pub fn tick(
    redis_connection: &mut redis::Connection,
    world_id: String,
    _publish_send_packet: &mpsc::Sender<String>,
) {
    let world_building_query = format!("{}.buildings", world_id);
    let buildings = redis::cmd("JSON.GET")
        .arg("worlds")
        .arg(world_building_query)
        .query(redis_connection);

    if let Err(e) = buildings {
        println!("Error getting buildings: {:?}", e);
        return;
    }

    let buildings: String = buildings.unwrap();

    let buildings: Vec<world::WorldBuilding> = serde_json::from_str(&buildings).unwrap();

    for mut building in buildings {
        building.current_processing_ticks += 1;
        // check if the building is done processing
        if building.building.is_none() {
            println!("Faulty building: {:?}", building);
            continue;
        }

        if building.current_processing_ticks >= building.building.as_ref().unwrap().processing_ticks
        {
          building.current_processing_ticks = 0;
          send_done_processing_packet(&world_id, building.id, redis_connection);
        }

        // update processing ticks in redis
        redis::cmd("JSON.SET")
            .arg("worlds")
            .arg(format!(
                "{}.buildings[?(@.id=={})].current_processing_ticks",
                world_id, building.id
            ))
            .arg(building.current_processing_ticks)
            .execute(redis_connection);
    }
}
fn send_done_processing_packet(
    world_id: &str,
    building_id: i32,
    redis_connection: &mut redis::Connection,
) {
    let world_building_finished_processing_packet = super::packets_service::packets::world_building_finished_processing::WorldBuildingFinishedProcessing {
  world_building_id: building_id,
  };

    publish_internal_packet(
        &world_building_finished_processing_packet,
        world_id,
        redis_connection,
    );
}
